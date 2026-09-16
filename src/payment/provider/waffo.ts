import {
  type CashierLanguage,
  verifyWebhook,
  WaffoPancake,
  WaffoPancakeError,
  type WebhookEvent,
  type WebhookEventData,
  WebhookEventType,
} from '@waffo/pancake-ts';
import { and, eq, ne, or } from 'drizzle-orm';
import { websiteConfig } from '@/config/website';
import { isPaidPlan, type NoddiPackCode } from '@/credits/catalog';
import {
  endSubscriptionCredits,
  grantPurchasedCredits,
  grantSubscriptionPeriod,
  revokeCreditsForRefund,
} from '@/credits/service';
import { getDb } from '@/db';
import { payment } from '@/db/app.schema';
import {
  findPlanByPlanId,
  findPlanByPriceId,
  findPriceInPlan,
} from '@/lib/price-plan';
import { sendPaymentNotification } from '@/notification';
import type {
  CheckoutResult,
  CreateCheckoutParams,
  CreatePortalParams,
  PaymentProvider,
  PaymentStatus,
  PlanInterval,
  PortalResult,
} from '../types';
import { PaymentScenes, PaymentTypes, PlanIntervals } from '../types';

export const WAFFO_CUSTOMER_PORTAL_URL =
  'https://pancake.waffo.ai/consumer/portal/login';

type WaffoEvent = WebhookEvent<WebhookEventData>;

/** Application locale → Waffo hosted checkout language. */
const WAFFO_LANGUAGES: Record<string, CashierLanguage> = {
  en: 'en',
  zh: 'zh-Hans',
};

type SubscriptionUpdate = {
  status?: PaymentStatus;
  cancelAtPeriodEnd?: boolean;
  paid?: boolean;
  /** Re-read priceId/interval from the event (plan upgrade or downgrade). */
  syncPlan?: boolean;
};

type WaffoGroupRow = {
  id: string;
  productIds?: string[] | null;
  products?: Array<{ id: string }> | null;
};

type WaffoRemoteOrder = {
  id?: string;
  status?: string;
  currentPeriodEnd?: string | null;
};

const PLAN_GROUP_NAME = 'Sunburst plans';
const RECONCILE_INTERVAL_MS = 60_000;

/**
 * Waffo Pancake payment provider for fixed-price template plans.
 */
export class WaffoProvider implements PaymentProvider {
  /** Waffo has no per-merchant customer records; the portal is a shared URL. */
  readonly requiresCustomerId = false;

  /** Waffo redirects buyers to its own confirmation page after payment. */
  readonly hostsPostCheckoutPage = true;

  /** Plan changes complete on hosted checkout, not a separate portal. */
  readonly supportsPlanChangeCheckout = true;

  private client: WaffoPancake;
  private reconcileAt = new Map<string, number>();
  private syncInFlight = new Map<string, Promise<void>>();

  constructor() {
    const merchantId = process.env.WAFFO_MERCHANT_ID;
    const privateKey = process.env.WAFFO_PRIVATE_KEY;
    if (!merchantId) {
      throw new Error('WAFFO_MERCHANT_ID environment variable is not set');
    }
    if (!privateKey) {
      throw new Error('WAFFO_PRIVATE_KEY environment variable is not set');
    }
    this.client = new WaffoPancake({ merchantId, privateKey });
  }

  getProviderName(): string {
    return 'waffo';
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const plan = findPlanByPlanId(params.planId);
    if (!plan) throw new Error(`Plan with ID ${params.planId} not found`);
    const price = findPriceInPlan(params.planId, params.priceId);
    if (!price) {
      throw new Error(
        `Price ID ${params.priceId} not found in plan ${params.planId}`
      );
    }

    if (price.type === 'subscription') {
      // Waffo only credits unused time when both products share a
      // subscription product group. Without it, checkout opens a second
      // independent subscription and both stay active.
      await this.ensurePlanSwitchGroup([
        ...this.getCatalogSubscriptionProductIds(),
        params.priceId,
        params.currentPriceId,
      ]);
    }

    // Waffo exposes two checkout entry points:
    //   - `client.checkout.createSession(...)` — anonymous buyer flow.
    //   - `client.checkout.authenticated.create(...)` — signed-in buyer
    //     flow. Internally issues a JWT via `client.auth.issueSessionToken()`
    //     keyed by `buyerIdentity` and appends it to the checkout URL as a
    //     `#token=...` fragment. Waffo can then attribute the order to a
    //     specific merchant-side user and surface their history in the
    //     consumer portal.
    // We always run inside `authApiMiddleware` (see src/api/payment.ts), so
    // every checkout has a known userId and we prefer the authenticated
    // variant to preserve buyer attribution end-to-end.
    try {
      const metadata = {
        ...params.metadata,
        planId: params.planId,
        priceId: params.priceId,
      };
      const language = this.mapLocaleToWaffoLanguage(params.locale);
      // Plan changes cannot run a trial, and Waffo rejects a plan change
      // while the current subscription is still trialing.
      const withTrial = params.isPlanChange
        ? false
        : typeof price.trialPeriodDays === 'number' && price.trialPeriodDays > 0
          ? true
          : undefined;
      const darkMode =
        params.theme === 'dark'
          ? true
          : params.theme === 'light'
            ? false
            : undefined;
      const result = await this.client.checkout.authenticated.create({
        // Merchant-stable buyer identifier baked into the JWT. Prefer userId
        // (stable across email changes) and fall back to email only if the
        // caller failed to attach it — email-based identity would create a
        // "new" Waffo buyer when the user updates their address.
        buyerIdentity: params.metadata?.userId ?? params.customerEmail,
        buyerEmail: params.customerEmail,
        currency: price.currency,
        metadata,
        // Order-scoped identifier inherited by the order, its payments and its
        // refunds — it must be unique per checkout, not per customer.
        orderMerchantExternalId: crypto.randomUUID(),
        productId: params.priceId,
        successUrl: params.successUrl,
        ...(language ? { language } : {}),
        ...(withTrial !== undefined ? { withTrial } : {}),
        ...(darkMode !== undefined ? { darkMode } : {}),
      });

      return {
        id: result.sessionId,
        url: result.checkoutUrl,
      };
    } catch (error) {
      this.logError('create checkout', error);
      throw new Error('Failed to create Waffo checkout session');
    }
  }

  async createCustomerPortal(
    _params: CreatePortalParams
  ): Promise<PortalResult> {
    return { url: WAFFO_CUSTOMER_PORTAL_URL };
  }

  async syncSubscriptionsFromProvider(userId: string): Promise<void> {
    const inflight = this.syncInFlight.get(userId);
    if (inflight) return inflight;
    const last = this.reconcileAt.get(userId) ?? 0;
    if (Date.now() - last < RECONCILE_INTERVAL_MS) return;
    const run = this.performSubscriptionSync(userId).finally(() => {
      this.syncInFlight.delete(userId);
    });
    this.syncInFlight.set(userId, run);
    await run;
  }

  private async performSubscriptionSync(userId: string): Promise<void> {
    const rows = await getDb()
      .select({
        id: payment.id,
        status: payment.status,
      })
      .from(payment)
      .where(
        and(
          eq(payment.userId, userId),
          eq(payment.type, PaymentTypes.SUBSCRIPTION)
        )
      )
      .limit(20);
    let sawRemote = false;
    let hasLive = false;
    for (const row of rows) {
      const remote = await this.fetchSubscriptionOrder(row.id);
      if (remote === 'unknown') {
        if (row.status === 'active' || row.status === 'trialing') {
          hasLive = true;
        }
        continue;
      }
      sawRemote = true;
      const next = this.mapRemoteSubscription(remote);
      if (next.status === 'active' || next.status === 'trialing') {
        hasLive = true;
      }
      await getDb()
        .update(payment)
        .set({
          status: next.status,
          paid: next.paid,
          cancelAtPeriodEnd: next.cancelAtPeriodEnd,
          updatedAt: new Date(),
        })
        .where(eq(payment.id, row.id));
    }
    if (!sawRemote) return;
    this.reconcileAt.set(userId, Date.now());
    if (!hasLive) {
      await endSubscriptionCredits(userId);
    }
  }

  async handleWebhookEvent(payload: string, signature: string): Promise<void> {
    try {
      const expectedMode = this.getExpectedMode();
      // Verify against the environment we expect to be running in. Passing
      // an explicit `environment` avoids letting the SDK guess based on
      // headers, and the 5-minute `toleranceMs` matches the SDK default but
      // is set explicitly so time-skew symptoms are traceable later.
      const event = verifyWebhook<WebhookEventData>(payload, signature, {
        environment: expectedMode,
        toleranceMs: 300_000,
      });
      if (event.mode !== expectedMode) {
        console.warn(
          `Skipping Waffo ${event.mode} event in ${expectedMode} runtime: ${event.eventType}`
        );
        return;
      }
      switch (event.eventType) {
        case WebhookEventType.OrderCompleted:
          await this.createOneTimePayment(event);
          break;
        case WebhookEventType.SubscriptionActivated:
          await this.createSubscriptionPayment(event);
          break;
        case WebhookEventType.SubscriptionPaymentSucceeded:
          // Older Waffo renewal payloads may omit checkout metadata. Preserve
          // the current subscription record in that case; otherwise the same
          // period-grant routine handles activated and renewal events.
          if (this.getUserId(event.data) && this.getPriceId(event.data)) {
            await this.createSubscriptionPayment(event);
          } else {
            await this.updateSubscription(event, { status: 'active' });
          }
          break;
        case WebhookEventType.SubscriptionUpdated:
          // Waffo plan changes open a new order. Treat this like an
          // activation when we can attribute the buyer; otherwise sync
          // price/interval on the existing row.
          if (this.getUserId(event.data) && this.getPriceId(event.data)) {
            await this.createSubscriptionPayment(event);
          } else {
            await this.updateSubscription(event, { syncPlan: true });
          }
          break;
        case WebhookEventType.SubscriptionCanceling:
          // Merchant/customer cancel is canceling until the PSP period ends.
          // The site should stop advertising an Active paid plan immediately.
          await this.updateSubscription(event, {
            status: 'canceled',
            cancelAtPeriodEnd: false,
            paid: false,
          });
          await this.endCreditsIfUnsubscribed(
            this.getUserId(event.data),
            event.data.orderId
          );
          break;
        case WebhookEventType.SubscriptionUncanceled:
          await this.updateSubscription(event, {
            status: 'active',
            cancelAtPeriodEnd: false,
          });
          break;
        case WebhookEventType.SubscriptionPastDue:
          await this.updateSubscription(event, { status: 'past_due' });
          break;
        case WebhookEventType.SubscriptionCanceled:
          await this.updateSubscription(event, {
            status: 'canceled',
            cancelAtPeriodEnd: false,
            paid: false,
          });
          await this.endCreditsIfUnsubscribed(
            this.getUserId(event.data),
            event.data.orderId
          );
          break;
        case WebhookEventType.RefundSucceeded:
          await this.revokeRefundedPayment(event);
          break;
        case WebhookEventType.RefundFailed:
          console.warn('Waffo refund failed:', event.eventId);
          break;
        default:
          if (event.eventType === 'subscription.plan_changed') {
            await this.createSubscriptionPayment(event);
            break;
          }
          console.warn(`Unhandled Waffo webhook event: ${event.eventType}`);
      }
    } catch (error) {
      this.logError('webhook handling', error);
      throw new Error('Failed to handle Waffo webhook event');
    }
  }

  /**
   * Extract the structured fields Waffo attaches to API errors so operators
   * can tell why a call failed without diffing raw stack traces. Non-SDK
   * errors fall back to a plain console.error so the shape is unchanged.
   */
  private logError(context: string, error: unknown): void {
    if (error instanceof WaffoPancakeError) {
      console.error(
        `Waffo ${context} error [status=${error.status}]:`,
        error.errors.map((e) => ({
          layer: e.layer,
          message: e.message,
          aiHint: e.aiHint,
        }))
      );
      return;
    }
    console.error(`Waffo ${context} error:`, error);
  }

  /**
   * Waffo delivers `test` and `prod` events to the same endpoint, so a
   * production Worker must reject sandbox events or test purchases would grant
   * real access. Set WAFFO_DEBUG=true to accept test events in production.
   */
  private getExpectedMode(): 'test' | 'prod' {
    const useTestMode =
      !import.meta.env.PROD || process.env.WAFFO_DEBUG === 'true';
    return useTestMode ? 'test' : 'prod';
  }

  private getUserId(data: WebhookEventData): string | undefined {
    return data.orderMetadata?.userId ?? data.merchantProvidedBuyerIdentity;
  }

  /**
   * Waffo webhook payloads carry no productId, so the plan price is resolved
   * from the checkout metadata, falling back to the product metadata for
   * events that are not tied to a checkout we created (plan changes).
   */
  private getPriceId(data: WebhookEventData): string | undefined {
    return data.orderMetadata?.priceId ?? data.productMetadata?.priceId;
  }

  private async createOneTimePayment(event: WaffoEvent): Promise<void> {
    const { data } = event;
    const userId = this.getUserId(data);
    const priceId = this.getPriceId(data);
    if (!userId || !priceId) {
      console.warn('Waffo one-time event is missing userId or priceId');
      return;
    }
    const now = new Date();
    try {
      await getDb()
        .insert(payment)
        .values({
          id: data.orderId,
          priceId,
          userId,
          customerId: data.merchantProvidedBuyerIdentity ?? userId,
          subscriptionId: null,
          sessionId: null,
          invoiceId: data.paymentId ?? event.eventId,
          type: PaymentTypes.ONE_TIME,
          scene: PaymentScenes.CREDITS,
          interval: null,
          status: 'completed',
          paid: true,
          periodStart: null,
          periodEnd: null,
          cancelAtPeriodEnd: null,
          trialStart: null,
          trialEnd: null,
          createdAt: now,
          updatedAt: now,
        });
    } catch (error) {
      if (!this.isUniqueViolation(error)) throw error;
    }
    const plan = findPlanByPlanId(data.orderMetadata?.planId ?? '');
    if (
      plan?.id === 'launch' ||
      plan?.id === 'maker' ||
      plan?.id === 'studio-pack'
    ) {
      await grantPurchasedCredits(
        userId,
        data.orderId,
        plan.id as NoddiPackCode
      );
    }
    await sendPaymentNotification({
      sessionId: data.orderId,
      customerId: data.merchantProvidedBuyerIdentity ?? userId,
      userName: data.orderMetadata?.userName ?? data.buyerEmail,
      amount: Number(data.amount),
    });
  }

  private async createSubscriptionPayment(event: WaffoEvent): Promise<void> {
    const { data } = event;
    const userId = this.getUserId(data);
    const priceId = this.getPriceId(data);
    if (!userId || !priceId) {
      console.warn('Waffo subscription event is missing userId or priceId');
      return;
    }
    const periodStart = this.parseDate(data.currentPeriodStart);
    const periodEnd = this.parseDate(data.currentPeriodEnd);
    const now = new Date();
    let created = true;
    try {
      await getDb()
        .insert(payment)
        .values({
          id: data.orderId,
          priceId,
          userId,
          customerId: data.merchantProvidedBuyerIdentity ?? userId,
          subscriptionId: data.orderId,
          sessionId: null,
          invoiceId: data.paymentId ?? event.eventId,
          type: PaymentTypes.SUBSCRIPTION,
          scene: PaymentScenes.SUBSCRIPTION,
          interval: this.mapBillingPeriod(data.billingPeriod),
          status: this.mapSubscriptionStatus(data.orderStatus),
          paid: true,
          periodStart,
          periodEnd,
          cancelAtPeriodEnd: data.orderStatus === 'canceling',
          trialStart: null,
          trialEnd: null,
          createdAt: now,
          updatedAt: now,
        });
    } catch (error) {
      if (!this.isUniqueViolation(error)) throw error;
      created = false;
      await this.updateSubscription(event, {
        status: 'active',
        syncPlan: true,
      });
    }
    if (created) {
      await this.deactivateOtherSubscriptions(userId, data.orderId);
    }
    const plan =
      findPlanByPlanId(data.orderMetadata?.planId ?? '') ??
      findPlanByPriceId(priceId);
    const periodKey =
      periodStart?.toISOString() ?? data.paymentId ?? event.eventId;
    if (plan && isPaidPlan(plan.id)) {
      await grantSubscriptionPeriod(
        userId,
        data.orderId,
        periodKey,
        plan.id,
        periodEnd
      );
    }
  }

  private async updateSubscription(
    event: WaffoEvent,
    options: SubscriptionUpdate = {}
  ): Promise<void> {
    const { data } = event;
    const values: Partial<typeof payment.$inferInsert> = {
      status: this.mapSubscriptionStatus(
        data.orderStatus,
        options.status ?? 'active'
      ),
      paid: options.paid ?? true,
      // Only clear a scheduled cancellation when the event actually reports
      // one; otherwise a renewal or plan change would silently un-cancel.
      cancelAtPeriodEnd:
        options.cancelAtPeriodEnd ?? data.orderStatus === 'canceling',
      updatedAt: new Date(),
    };
    const periodStart = this.parseDate(data.currentPeriodStart);
    const periodEnd = this.parseDate(data.currentPeriodEnd);
    if (periodStart) values.periodStart = periodStart;
    if (periodEnd) values.periodEnd = periodEnd;
    if (options.syncPlan) {
      const priceId = this.getPriceId(data);
      if (priceId) values.priceId = priceId;
      if (data.billingPeriod) {
        values.interval = this.mapBillingPeriod(data.billingPeriod);
      }
    }
    await getDb()
      .update(payment)
      .set(values)
      .where(
        or(
          eq(payment.subscriptionId, data.orderId),
          eq(payment.id, data.orderId)
        )
      );
  }

  /**
   * A Waffo plan change ends the previous order and opens a new one.
   * Keep the old row for history, but stop treating it as the live plan.
   * Also cancel the replaced order on Waffo — a local-only update leaves
   * both subscriptions active in the merchant dashboard.
   */
  private async deactivateOtherSubscriptions(
    userId: string,
    currentOrderId: string
  ): Promise<void> {
    this.reconcileAt.set(userId, Date.now());
    const others = await getDb()
      .select({ id: payment.id })
      .from(payment)
      .where(
        and(
          eq(payment.userId, userId),
          eq(payment.type, PaymentTypes.SUBSCRIPTION),
          ne(payment.id, currentOrderId)
        )
      )
      .limit(20);
    for (const row of others) {
      try {
        await this.client.orders.cancelSubscription({ orderId: row.id });
      } catch (error) {
        this.logError('cancel replaced subscription', error);
      }
    }
    await getDb()
      .update(payment)
      .set({
        status: 'canceled',
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(payment.userId, userId),
          eq(payment.type, PaymentTypes.SUBSCRIPTION),
          ne(payment.id, currentOrderId),
          or(eq(payment.status, 'active'), eq(payment.status, 'trialing'))
        )
      );
  }

  /**
   * Put Pro/Studio in one subscription product group so hosted checkout
   * treats a second purchase as a plan change and credits unused time.
   * Listing groups via GraphQL can 400 on older schemas; checkout still
   * proceeds if this setup fails.
   */
  private async ensurePlanSwitchGroup(
    productIds: Array<string | undefined>
  ): Promise<void> {
    const ids = [
      ...new Set(productIds.filter((id): id is string => Boolean(id))),
    ].sort();
    if (ids.length < 2) return;
    try {
      const storeId = await this.getDefaultStoreId();
      if (!storeId) {
        console.warn('Waffo plan group skipped: no store id');
        return;
      }
      const groups = await this.listSubscriptionProductGroups(storeId);
      const covering = groups.find((group) =>
        ids.every((id) => this.groupProductIds(group).includes(id))
      );
      if (covering) return;
      const overlapping = groups.find((group) =>
        ids.some((id) => this.groupProductIds(group).includes(id))
      );
      if (overlapping) {
        const merged = [
          ...new Set([...this.groupProductIds(overlapping), ...ids]),
        ];
        await this.client.subscriptionProductGroups.update({
          id: overlapping.id,
          productIds: merged,
          rules: { sharedTrial: true },
        });
        await this.publishPlanGroup(overlapping.id);
        return;
      }
      const { group } = await this.client.subscriptionProductGroups.create({
        storeId,
        name: PLAN_GROUP_NAME,
        rules: { sharedTrial: true },
        productIds: ids,
      });
      await this.publishPlanGroup(group.id);
    } catch (error) {
      this.logError('ensure plan switch group', error);
    }
  }

  private getCatalogSubscriptionProductIds(): string[] {
    const plans = websiteConfig.payment?.price?.plans;
    if (!plans) return [];
    const ids: string[] = [];
    for (const plan of Object.values(plans)) {
      for (const price of plan.prices ?? []) {
        if (price.type === 'subscription' && price.priceId) {
          ids.push(price.priceId);
        }
      }
    }
    return ids;
  }

  private groupProductIds(group: WaffoGroupRow): string[] {
    if (group.productIds?.length) return group.productIds;
    return group.products?.map((product) => product.id) ?? [];
  }

  private async getDefaultStoreId(): Promise<string | undefined> {
    const result = await this.client.graphql.query<{
      stores?: Array<{ id: string }>;
    }>({
      query: 'query { stores { id } }',
    });
    if (result.errors?.length) {
      console.warn('Waffo stores query failed', result.errors);
      return undefined;
    }
    return result.data?.stores?.[0]?.id;
  }

  private async listSubscriptionProductGroups(
    storeId: string
  ): Promise<WaffoGroupRow[]> {
    try {
      const result = await this.client.graphql.query<{
        subscriptionProductGroups?: WaffoGroupRow[];
      }>({
        query: `query ($storeId: String!) {
          subscriptionProductGroups(storeId: $storeId) {
            id
            productIds
          }
        }`,
        variables: { storeId },
      });
      if (result.errors?.length) {
        console.warn('Waffo product group query failed', result.errors);
        return [];
      }
      return result.data?.subscriptionProductGroups ?? [];
    } catch (error) {
      this.logError('list subscription product groups', error);
      return [];
    }
  }

  private async publishPlanGroup(groupId: string): Promise<void> {
    try {
      await this.client.subscriptionProductGroups.publish({ id: groupId });
    } catch (error) {
      this.logError('publish subscription product group', error);
    }
  }

  private async fetchSubscriptionOrder(
    orderId: string
  ): Promise<WaffoRemoteOrder | null | 'unknown'> {
    const listed = await this.findListedSubscriptionOrder(orderId);
    if (listed !== 'unknown') return listed;
    try {
      const result = await this.client.graphql.query<{
        subscriptionOrder?: WaffoRemoteOrder | null;
      }>({
        query: `query ($id: String!) {
          subscriptionOrder(id: $id) {
            id
            status
            currentPeriodEnd
          }
        }`,
        variables: { id: orderId },
      });
      if (result.errors?.length) {
        console.warn('Waffo subscription order query failed', result.errors);
        return 'unknown';
      }
      return result.data?.subscriptionOrder ?? null;
    } catch (error) {
      this.logError('fetch subscription order', error);
      return 'unknown';
    }
  }

  private async findListedSubscriptionOrder(
    orderId: string
  ): Promise<WaffoRemoteOrder | null | 'unknown'> {
    try {
      const storeId = await this.getDefaultStoreId();
      if (!storeId) return 'unknown';
      const result = await this.client.graphql.query<{
        subscriptionOrders?: WaffoRemoteOrder[];
      }>({
        query: `query ($storeId: String!) {
          subscriptionOrders(storeId: $storeId) {
            id
            status
            currentPeriodEnd
          }
        }`,
        variables: { storeId },
      });
      if (result.errors?.length) {
        console.warn('Waffo subscription orders query failed', result.errors);
        return 'unknown';
      }
      const orders = result.data?.subscriptionOrders;
      if (!orders) return 'unknown';
      return orders.find((order) => order.id === orderId) ?? null;
    } catch (error) {
      this.logError('list subscription orders', error);
      return 'unknown';
    }
  }

  private mapRemoteSubscription(remote: WaffoRemoteOrder | null): {
    status: PaymentStatus;
    paid: boolean;
    cancelAtPeriodEnd: boolean;
  } {
    const status = remote?.status?.toLowerCase();
    if (
      !remote ||
      status === 'canceled' ||
      status === 'cancelled' ||
      status === 'canceling' ||
      status === 'cancelling' ||
      status === 'expired' ||
      status === 'closed'
    ) {
      return {
        status: 'canceled',
        paid: false,
        cancelAtPeriodEnd: false,
      };
    }
    return {
      status: this.mapSubscriptionStatus(status, 'active'),
      paid: true,
      cancelAtPeriodEnd: false,
    };
  }

  private async endCreditsIfUnsubscribed(
    userId?: string,
    orderId?: string
  ): Promise<void> {
    let resolvedUserId = userId;
    if (!resolvedUserId && orderId) {
      const [row] = await getDb()
        .select({ userId: payment.userId })
        .from(payment)
        .where(or(eq(payment.id, orderId), eq(payment.subscriptionId, orderId)))
        .limit(1);
      resolvedUserId = row?.userId ?? undefined;
    }
    if (!resolvedUserId) return;
    const [live] = await getDb()
      .select({ id: payment.id })
      .from(payment)
      .where(
        and(
          eq(payment.userId, resolvedUserId),
          eq(payment.type, PaymentTypes.SUBSCRIPTION),
          or(eq(payment.status, 'active'), eq(payment.status, 'trialing'))
        )
      )
      .limit(1);
    if (!live) {
      await endSubscriptionCredits(resolvedUserId);
    }
  }

  /**
   * Any successful refund (partial or full) revokes access, matching the
   * behavior of the Stripe and Creem providers. Waffo's webhook payload has
   * no reliable partial-vs-full marker (SDK exposes only refundStatus /
   * refundReason / refundCreatedAt, and the `amount` field's meaning inside
   * a refund event is not documented). If a partial refund should still
   * grant access, handle it manually in the merchant dashboard.
   */
  private async revokeRefundedPayment(event: WaffoEvent): Promise<void> {
    const { orderId, paymentId } = event.data;
    // Renewals never rewrite invoiceId, so also match the order the refunded
    // payment belongs to.
    const filters = [
      ...(paymentId ? [eq(payment.invoiceId, paymentId)] : []),
      ...(orderId ? [eq(payment.id, orderId)] : []),
    ];
    if (filters.length === 0) {
      console.warn('Waffo refund event is missing paymentId and orderId');
      return;
    }
    const db = getDb();
    const [refundedPayment] = await db
      .select({ id: payment.id, userId: payment.userId, type: payment.type })
      .from(payment)
      .where(or(...filters))
      .limit(1);
    await db
      .update(payment)
      .set({ paid: false, updatedAt: new Date() })
      .where(or(...filters));
    if (refundedPayment?.userId) {
      await revokeCreditsForRefund({
        userId: refundedPayment.userId,
        paymentId: refundedPayment.id,
        refundId: event.eventId,
        kind:
          refundedPayment.type === PaymentTypes.SUBSCRIPTION
            ? 'subscription'
            : 'one_time',
      });
    } else {
      console.warn(
        'Waffo refund could not resolve a local user credit account'
      );
    }
  }

  /** Application locale → Waffo hosted checkout language. */
  private mapLocaleToWaffoLanguage(
    locale?: string
  ): CashierLanguage | undefined {
    if (!locale) return undefined;
    return WAFFO_LANGUAGES[locale] ?? WAFFO_LANGUAGES[locale.split('-')[0]];
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private mapBillingPeriod(value?: string): PlanInterval {
    return value === 'yearly' ? PlanIntervals.YEAR : PlanIntervals.MONTH;
  }

  private mapSubscriptionStatus(
    status: string | undefined,
    fallback: PaymentStatus = 'active'
  ): PaymentStatus {
    switch (status?.toLowerCase()) {
      case 'past_due':
        return 'past_due';
      case 'canceling':
      case 'cancelling':
      case 'canceled':
      case 'cancelled':
      case 'expired':
      case 'closed':
        return 'canceled';
      case 'active':
        return 'active';
      default:
        return fallback;
    }
  }

  /** D1 reports duplicate rows as `UNIQUE constraint failed: ...`. */
  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Error && error.message.toLowerCase().includes('unique')
    );
  }
}
