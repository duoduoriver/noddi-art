import { getDb } from '@/db';
import { payment } from '@/db/app.schema';
import { user } from '@/db/auth.schema';
import {
  findPlanByPlanId,
  findPlanByPriceId,
  findPriceInPlan,
  getAllPricePlans,
} from '@/lib/price-plan';
import { authApiMiddleware } from '@/middlewares/auth-middleware';
import {
  createCheckout,
  createCustomerPortal,
  getPaymentProvider,
} from '@/payment';
import type {
  PaymentStatus,
  PlanInterval,
  PricePlan,
  Subscription,
} from '@/payment/types';
import { PaymentScenes, PaymentTypes } from '@/payment/types';
import { websiteConfig } from '@/config/website';
import { getBaseUrl } from '@/lib/urls';
import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, or } from 'drizzle-orm';
import { z } from 'zod';

const checkoutSchema = z.object({
  planId: z.string().min(1),
  priceId: z.string().min(1),
  successUrl: z.url().optional(),
  cancelUrl: z.url().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export const createCheckoutSession = createServerFn({ method: 'POST' })
  .inputValidator(checkoutSchema)
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const db = getDb();
    const [userRow] = await db
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (!userRow?.email) throw new Error('User email not found');
    const { planId, priceId, successUrl, cancelUrl } = data;
    const plan = findPlanByPlanId(planId);
    const price = findPriceInPlan(planId, priceId);
    if (!plan || !price || !price.priceId)
      throw new Error('Invalid product selection');
    const baseUrl = getBaseUrl();
    const origin = new URL(baseUrl).origin;
    const sameOrigin = (value: string | undefined, fallback: string) => {
      if (!value) return fallback;
      if (new URL(value).origin !== origin)
        throw new Error('Redirect URL must be same-origin');
      return value;
    };
    const provider = getPaymentProvider();
    const cancel = sameOrigin(cancelUrl, `${baseUrl}/settings/billing`);

    // Stripe replaces {CHECKOUT_SESSION_ID} on redirect. Hosted providers
    // (Creem, Waffo) do not, so omit the placeholder and still land on the
    // in-app confirmation page. PaymentCard polls until the webhook grants
    // credits; skipping it races the first fetch and shows a 0 balance.
    const success = provider.hostsPostCheckoutPage
      ? sameOrigin(
          successUrl,
          `${baseUrl}/settings/payment?callback=/dashboard/credits`
        )
      : sameOrigin(
          successUrl,
          `${baseUrl}/settings/payment?session_id={CHECKOUT_SESSION_ID}&callback=/dashboard/credits`
        );
    const scene = price.type === 'one_time' ? 'credits' : 'subscription';
    if (scene === 'subscription') {
      const [active] = await db
        .select({ id: payment.id })
        .from(payment)
        .where(
          and(
            eq(payment.userId, userId),
            eq(payment.type, PaymentTypes.SUBSCRIPTION),
            eq(payment.paid, true),
            or(eq(payment.status, 'active'), eq(payment.status, 'trialing'))
          )
        )
        .limit(1);
      if (active)
        throw new Error(
          'An active subscription already exists. Use Billing to manage it.'
        );
    }
    // Product facts and credit metadata are server-owned; client metadata is ignored.
    const checkoutMetadata = {
      userId,
      userName: userRow.name ?? '',
      planId: plan.id,
      priceId: price.priceId,
      scene,
      credits:
        scene === 'credits'
          ? String(plan.id === 'launch' ? 100 : plan.id === 'maker' ? 300 : 800)
          : '',
    };

    const result = await createCheckout({
      planId,
      priceId,
      customerEmail: userRow.email,
      successUrl: success,
      cancelUrl: cancel,
      metadata: checkoutMetadata,
    });
    return { url: result.url, id: result.id };
  });

const portalSchema = z.object({
  returnUrl: z.string().url().optional(),
  locale: z.string().optional(),
});

export const createCustomerPortalSession = createServerFn({ method: 'POST' })
  .inputValidator(portalSchema)
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const db = getDb();
    const [row] = await db
      .select({ customerId: user.customerId })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    const provider = getPaymentProvider();
    if (provider.requiresCustomerId !== false && !row?.customerId) {
      throw new Error('No customer found for user');
    }
    const baseUrl = getBaseUrl();
    const returnUrl = data.returnUrl ?? `${baseUrl}/settings/billing`;
    if (new URL(returnUrl).origin !== new URL(baseUrl).origin) {
      throw new Error('Redirect URL must be same-origin');
    }
    const result = await createCustomerPortal({
      customerId: row?.customerId ?? '',
      returnUrl,
      locale: data.locale,
    });
    return { url: result.url };
  });

export const getPaymentHistory = createServerFn({ method: 'GET' })
  .middleware([authApiMiddleware])
  .handler(async ({ context }) =>
    getDb()
      .select({
        id: payment.id,
        priceId: payment.priceId,
        type: payment.type,
        scene: payment.scene,
        status: payment.status,
        paid: payment.paid,
        createdAt: payment.createdAt,
      })
      .from(payment)
      .where(eq(payment.userId, context.userId))
      .orderBy(desc(payment.createdAt))
      .limit(50)
  );

export const getCurrentPlan = createServerFn({ method: 'GET' })
  .middleware([authApiMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context;
    const db = getDb();
    const [billingUser] = await db
      .select({ customerId: user.customerId })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    const hasCustomerId = Boolean(billingUser?.customerId);
    // Reading account information must not initialize a payment client or
    // require checkout secrets. Waffo uses its shared customer portal.
    const portalRequiresCustomerId =
      websiteConfig.payment?.provider !== 'waffo';
    const [paymentHistory] = await db
      .select({ id: payment.id })
      .from(payment)
      .where(eq(payment.userId, userId))
      .limit(1);
    const hasPaymentHistory = Boolean(paymentHistory);
    const plans = getAllPricePlans();
    const freePlan = plans.find((p) => p.isFree && !p.disabled) ?? null;
    const lifetimePlanIds = plans.filter((p) => p.isLifetime).map((p) => p.id);

    const payments = await db
      .select({
        id: payment.id,
        priceId: payment.priceId,
        customerId: payment.customerId,
        type: payment.type,
        status: payment.status,
        scene: payment.scene,
        interval: payment.interval,
        periodStart: payment.periodStart,
        periodEnd: payment.periodEnd,
        cancelAtPeriodEnd: payment.cancelAtPeriodEnd,
        trialStart: payment.trialStart,
        trialEnd: payment.trialEnd,
        createdAt: payment.createdAt,
      })
      .from(payment)
      .where(
        and(
          eq(payment.paid, true),
          eq(payment.userId, userId),
          or(
            and(
              eq(payment.type, PaymentTypes.ONE_TIME),
              eq(payment.scene, PaymentScenes.LIFETIME),
              eq(payment.status, 'completed')
            ),
            and(
              eq(payment.type, PaymentTypes.SUBSCRIPTION),
              or(eq(payment.status, 'active'), eq(payment.status, 'trialing'))
            )
          )
        )
      )
      .orderBy(desc(payment.createdAt));

    let userLifetimePlan: PricePlan | null = null;
    let activeSubscription: Subscription | null = null;

    for (const rec of payments) {
      if (
        rec.type === PaymentTypes.ONE_TIME &&
        rec.scene === PaymentScenes.LIFETIME &&
        rec.status === 'completed' &&
        !userLifetimePlan
      ) {
        const plan = findPlanByPriceId(rec.priceId);
        if (plan && lifetimePlanIds.includes(plan.id)) {
          userLifetimePlan = plan as PricePlan;
        }
      }
      if (
        !userLifetimePlan &&
        rec.type === PaymentTypes.SUBSCRIPTION &&
        (rec.status === 'active' || rec.status === 'trialing') &&
        !activeSubscription
      ) {
        activeSubscription = {
          id: rec.id,
          priceId: rec.priceId,
          customerId: rec.customerId,
          status: rec.status as PaymentStatus,
          type: rec.type as 'subscription',
          interval: rec.interval as PlanInterval | undefined,
          currentPeriodStart: rec.periodStart ?? undefined,
          currentPeriodEnd: rec.periodEnd ?? undefined,
          cancelAtPeriodEnd: rec.cancelAtPeriodEnd ?? false,
          trialStartDate: rec.trialStart ?? undefined,
          trialEndDate: rec.trialEnd ?? undefined,
          createdAt: rec.createdAt,
        };
      }
    }

    if (userLifetimePlan) {
      return {
        currentPlan: userLifetimePlan,
        subscription: null,
        hasCustomerId,
        hasPaymentHistory,
        portalRequiresCustomerId,
      };
    }
    if (activeSubscription) {
      const subscriptionPlan =
        plans.find((p) =>
          p.prices.some((pr) => pr.priceId === activeSubscription!.priceId)
        ) ?? null;
      return {
        currentPlan: subscriptionPlan as PricePlan | null,
        subscription: activeSubscription,
        hasCustomerId,
        hasPaymentHistory,
        portalRequiresCustomerId,
      };
    }
    return {
      currentPlan: freePlan as PricePlan | null,
      subscription: null,
      hasCustomerId,
      hasPaymentHistory,
      portalRequiresCustomerId,
    };
  });

const checkCompletionSchema = z.object({ sessionId: z.string().min(1) });

/**
 * Check payment completion by Stripe session ID.
 * Used by Stripe flow where the session ID is embedded in the redirect URL.
 */
export const checkPaymentCompletion = createServerFn({ method: 'GET' })
  .inputValidator(checkCompletionSchema)
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    const [record] = await db
      .select()
      .from(payment)
      .where(
        and(
          eq(payment.sessionId, data.sessionId),
          eq(payment.userId, context.userId)
        )
      )
      .limit(1);
    return { isPaid: !!record?.paid };
  });
