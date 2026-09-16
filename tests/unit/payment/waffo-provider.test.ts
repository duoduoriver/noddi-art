import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createCheckout: vi.fn(),
  verifyWebhook: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
  selectWhere: vi.fn(),
  limit: vi.fn(),
  values: vi.fn(),
  set: vi.fn(),
  where: vi.fn(),
  revokeCreditsForRefund: vi.fn(),
  graphqlQuery: vi.fn(),
  cancelSubscription: vi.fn(),
  createGroup: vi.fn(),
  updateGroup: vi.fn(),
  publishGroup: vi.fn(),
  endSubscriptionCredits: vi.fn(),
}));

vi.mock('@waffo/pancake-ts', () => ({
  WaffoPancake: class {
    checkout = {
      authenticated: {
        create: mocks.createCheckout,
      },
    };
    graphql = {
      query: mocks.graphqlQuery,
    };
    orders = {
      cancelSubscription: mocks.cancelSubscription,
    };
    subscriptionProductGroups = {
      create: mocks.createGroup,
      update: mocks.updateGroup,
      publish: mocks.publishGroup,
    };
  },
  verifyWebhook: mocks.verifyWebhook,
  // Runtime enum shape matching the SDK; test uses the string values below.
  WebhookEventType: {
    OrderCompleted: 'order.completed',
    SubscriptionActivated: 'subscription.activated',
    SubscriptionPaymentSucceeded: 'subscription.payment_succeeded',
    SubscriptionCanceling: 'subscription.canceling',
    SubscriptionUncanceled: 'subscription.uncanceled',
    SubscriptionUpdated: 'subscription.updated',
    SubscriptionCanceled: 'subscription.canceled',
    SubscriptionPastDue: 'subscription.past_due',
    RefundSucceeded: 'refund.succeeded',
    RefundFailed: 'refund.failed',
  },
  // Minimal stand-in for the SDK error class so `instanceof` checks work.
  WaffoPancakeError: class extends Error {
    status: number;
    errors: Array<{ layer: string; message: string; aiHint?: string }>;
    constructor(
      status: number,
      errors: Array<{ layer: string; message: string; aiHint?: string }>
    ) {
      super(errors[0]?.message ?? 'WaffoPancakeError');
      this.status = status;
      this.errors = errors;
    }
  },
}));

vi.mock('@/db', () => ({
  getDb: () => ({
    insert: mocks.insert,
    update: mocks.update,
    select: mocks.select,
  }),
}));

vi.mock('@/notification', () => ({
  sendPaymentNotification: vi.fn(),
}));

vi.mock('@/credits/service', () => ({
  grantPurchasedCredits: vi.fn(),
  grantSubscriptionPeriod: vi.fn(),
  revokeCreditsForRefund: mocks.revokeCreditsForRefund,
  endSubscriptionCredits: mocks.endSubscriptionCredits,
}));

vi.mock('@/lib/price-plan', () => ({
  findPlanByPlanId: vi.fn(() => ({ id: 'pro' })),
  findPriceInPlan: vi.fn(() => ({
    type: 'subscription',
    priceId: 'PROD_monthly',
    amount: 990,
    currency: 'USD',
  })),
}));

vi.mock('@/config/website', () => ({
  websiteConfig: {
    payment: {
      price: {
        plans: {
          pro: {
            prices: [{ type: 'subscription', priceId: 'PROD_pro' }],
          },
          studio: {
            prices: [{ type: 'subscription', priceId: 'PROD_studio' }],
          },
        },
      },
    },
  },
}));

import { WaffoProvider } from '@/payment/provider/waffo';

describe('Waffo provider boundary', () => {
  beforeEach(() => {
    process.env.WAFFO_MERCHANT_ID = 'MER_test';
    process.env.WAFFO_PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----';
    mocks.createCheckout.mockReset();
    mocks.verifyWebhook.mockReset();
    mocks.insert.mockReset();
    mocks.update.mockReset();
    mocks.select.mockReset();
    mocks.from.mockReset();
    mocks.selectWhere.mockReset();
    mocks.limit.mockReset();
    mocks.values.mockReset();
    mocks.set.mockReset();
    mocks.where.mockReset();
    mocks.revokeCreditsForRefund.mockReset();
    mocks.graphqlQuery.mockReset();
    mocks.cancelSubscription.mockReset();
    mocks.createGroup.mockReset();
    mocks.updateGroup.mockReset();
    mocks.publishGroup.mockReset();
    mocks.endSubscriptionCredits.mockReset();
    mocks.insert.mockReturnValue({ values: mocks.values });
    mocks.update.mockReturnValue({ set: mocks.set });
    mocks.select.mockReturnValue({ from: mocks.from });
    mocks.from.mockReturnValue({ where: mocks.selectWhere });
    mocks.selectWhere.mockReturnValue({ limit: mocks.limit });
    mocks.set.mockReturnValue({ where: mocks.where });
    mocks.limit.mockResolvedValue([]);
    mocks.values.mockResolvedValue(undefined);
    mocks.where.mockResolvedValue(undefined);
    mocks.graphqlQuery.mockImplementation(
      async ({ query }: { query: string }) => {
        if (query.includes('stores {')) {
          return { data: { stores: [{ id: 'STO_test' }] } };
        }
        return { data: { subscriptionProductGroups: [] } };
      }
    );
    mocks.createGroup.mockResolvedValue({ group: { id: 'GRP_test' } });
    mocks.updateGroup.mockResolvedValue({ group: { id: 'GRP_test' } });
    mocks.publishGroup.mockResolvedValue({ group: { id: 'GRP_test' } });
    mocks.cancelSubscription.mockResolvedValue({
      orderId: 'ORD_old',
      status: 'canceling',
    });
    mocks.endSubscriptionCredits.mockResolvedValue(undefined);
    mocks.createCheckout.mockResolvedValue({
      checkoutUrl: 'https://pancake.waffo.ai/checkout/CHK_test',
      sessionId: 'CHK_test',
      expiresAt: '2026-08-01T00:00:00.000Z',
    });
  });

  test('creates an authenticated Waffo checkout from a fixed template price', async () => {
    const provider = new WaffoProvider();

    await expect(
      provider.createCheckout({
        planId: 'pro',
        priceId: 'PROD_monthly',
        customerEmail: 'buyer@example.com',
        successUrl: 'https://example.com/settings/billing',
        metadata: { userId: 'user_123', userName: 'Buyer' },
      })
    ).resolves.toEqual({
      id: 'CHK_test',
      url: 'https://pancake.waffo.ai/checkout/CHK_test',
    });

    expect(mocks.createCheckout).toHaveBeenCalledWith({
      buyerIdentity: 'user_123',
      buyerEmail: 'buyer@example.com',
      currency: 'USD',
      metadata: {
        userId: 'user_123',
        userName: 'Buyer',
        planId: 'pro',
        priceId: 'PROD_monthly',
      },
      orderMerchantExternalId: expect.any(String),
      productId: 'PROD_monthly',
      successUrl: 'https://example.com/settings/billing',
    });
    // The order-scoped external id must be unique per checkout (not per user),
    // so assert it is a UUID rather than the userId.
    const [callArgs] = mocks.createCheckout.mock.calls[0];
    expect(callArgs.orderMerchantExternalId).not.toBe('user_123');
    expect(callArgs.orderMerchantExternalId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  test('maps the site locale and resolved theme to the Waffo checkout', async () => {
    const provider = new WaffoProvider();

    await provider.createCheckout({
      planId: 'pro',
      priceId: 'PROD_monthly',
      customerEmail: 'buyer@example.com',
      locale: 'zh',
      theme: 'dark',
      metadata: { userId: 'user_123' },
    });

    expect(mocks.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'zh-Hans',
        darkMode: true,
      })
    );

    mocks.createCheckout.mockClear();

    await provider.createCheckout({
      planId: 'pro',
      priceId: 'PROD_monthly',
      customerEmail: 'buyer@example.com',
      locale: 'en',
      theme: 'light',
      metadata: { userId: 'user_123' },
    });

    expect(mocks.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'en',
        darkMode: false,
      })
    );
  });

  test('skips the trial when the checkout is a plan change', async () => {
    const provider = new WaffoProvider();

    await provider.createCheckout({
      planId: 'studio',
      priceId: 'PROD_studio',
      customerEmail: 'buyer@example.com',
      isPlanChange: true,
      currentOrderId: 'ORD_pro',
      currentPriceId: 'PROD_pro',
      metadata: { userId: 'user_123' },
    });

    expect(mocks.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        withTrial: false,
        productId: 'PROD_studio',
      })
    );
    expect(mocks.createGroup).toHaveBeenCalledWith({
      storeId: 'STO_test',
      name: 'Sunburst plans',
      rules: { sharedTrial: true },
      productIds: ['PROD_pro', 'PROD_studio'],
    });
    expect(mocks.publishGroup).toHaveBeenCalledWith({ id: 'GRP_test' });
  });

  test('still creates checkout when the product-group GraphQL lookup fails', async () => {
    mocks.graphqlQuery.mockRejectedValue(new Error('graphql 400'));
    const provider = new WaffoProvider();

    await expect(
      provider.createCheckout({
        planId: 'studio',
        priceId: 'PROD_studio',
        customerEmail: 'buyer@example.com',
        isPlanChange: true,
        currentPriceId: 'PROD_pro',
        metadata: { userId: 'user_123' },
      })
    ).resolves.toEqual({
      id: 'CHK_test',
      url: 'https://pancake.waffo.ai/checkout/CHK_test',
    });
    expect(mocks.createGroup).not.toHaveBeenCalled();
    expect(mocks.createCheckout).toHaveBeenCalled();
  });

  test('does not recreate a product group that already covers both plans', async () => {
    mocks.graphqlQuery.mockImplementation(
      async ({ query }: { query: string }) => {
        if (query.includes('stores {')) {
          return { data: { stores: [{ id: 'STO_test' }] } };
        }
        return {
          data: {
            subscriptionProductGroups: [
              {
                id: 'GRP_existing',
                productIds: ['PROD_pro', 'PROD_studio'],
              },
            ],
          },
        };
      }
    );
    const provider = new WaffoProvider();

    await provider.createCheckout({
      planId: 'studio',
      priceId: 'PROD_studio',
      customerEmail: 'buyer@example.com',
      isPlanChange: true,
      currentPriceId: 'PROD_pro',
      metadata: { userId: 'user_123' },
    });

    expect(mocks.createGroup).not.toHaveBeenCalled();
    expect(mocks.updateGroup).not.toHaveBeenCalled();
    expect(mocks.publishGroup).not.toHaveBeenCalled();
  });

  test('adds the missing plan to an overlapping product group', async () => {
    mocks.graphqlQuery.mockImplementation(
      async ({ query }: { query: string }) => {
        if (query.includes('stores {')) {
          return { data: { stores: [{ id: 'STO_test' }] } };
        }
        return {
          data: {
            subscriptionProductGroups: [
              { id: 'GRP_existing', productIds: ['PROD_pro'] },
            ],
          },
        };
      }
    );
    const provider = new WaffoProvider();

    await provider.createCheckout({
      planId: 'studio',
      priceId: 'PROD_studio',
      customerEmail: 'buyer@example.com',
      isPlanChange: true,
      currentPriceId: 'PROD_pro',
      metadata: { userId: 'user_123' },
    });

    expect(mocks.updateGroup).toHaveBeenCalledWith({
      id: 'GRP_existing',
      productIds: ['PROD_pro', 'PROD_studio'],
      rules: { sharedTrial: true },
    });
    expect(mocks.createGroup).not.toHaveBeenCalled();
    expect(mocks.publishGroup).toHaveBeenCalledWith({ id: 'GRP_existing' });
  });

  test('records an order.completed webhook using existing payment columns', async () => {
    mocks.verifyWebhook.mockReturnValue({
      id: 'delivery_123',
      eventId: 'PAY_123',
      eventType: 'order.completed',
      mode: 'test',
      data: {
        orderId: 'ORD_123',
        buyerEmail: 'buyer@example.com',
        currency: 'USD',
        amount: '19.00',
        taxAmount: '0.00',
        productName: 'Pro Monthly',
        paymentId: 'PAY_123',
        orderMetadata: {
          planId: 'pro',
          priceId: 'PROD_monthly',
          userId: 'user_123',
        },
      },
    });

    await new WaffoProvider().handleWebhookEvent(
      '{"eventType":"order.completed"}',
      'signed'
    );

    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ORD_123',
        invoiceId: 'PAY_123',
        paid: true,
        priceId: 'PROD_monthly',
        sessionId: null,
        status: 'completed',
        type: 'one_time',
        userId: 'user_123',
      })
    );
  });

  test('updates an existing subscription when Waffo reports cancellation at period end', async () => {
    mocks.verifyWebhook.mockReturnValue({
      id: 'delivery_canceling',
      eventId: 'EVT_canceling',
      eventType: 'subscription.canceling',
      mode: 'test',
      data: {
        orderId: 'ORD_subscription',
        buyerEmail: 'buyer@example.com',
        currency: 'USD',
        amount: '9.90',
        taxAmount: '0.00',
        productName: 'Pro Monthly',
        orderStatus: 'canceling',
        currentPeriodEnd: '2026-09-01T00:00:00.000Z',
      },
    });

    await new WaffoProvider().handleWebhookEvent(
      '{"eventType":"subscription.canceling"}',
      'signed'
    );

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        cancelAtPeriodEnd: false,
        paid: false,
        status: 'canceled',
        updatedAt: expect.any(Date),
      })
    );
  });

  test('clears scheduled cancellation after a successful renewal', async () => {
    mocks.verifyWebhook.mockReturnValue({
      id: 'delivery_paid',
      eventId: 'EVT_paid',
      eventType: 'subscription.payment_succeeded',
      mode: 'test',
      data: {
        orderId: 'ORD_subscription',
        buyerEmail: 'buyer@example.com',
        currency: 'USD',
        amount: '9.90',
        taxAmount: '0.00',
        productName: 'Pro Monthly',
        orderStatus: 'active',
      },
    });

    await new WaffoProvider().handleWebhookEvent(
      '{"eventType":"subscription.payment_succeeded"}',
      'signed'
    );

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        cancelAtPeriodEnd: false,
        paid: true,
        status: 'active',
      })
    );
  });

  test('revokes lifetime access when Waffo reports a successful full refund', async () => {
    mocks.verifyWebhook.mockReturnValue({
      id: 'delivery_refund',
      eventId: 'REFUND_123',
      eventType: 'refund.succeeded',
      mode: 'test',
      data: {
        orderId: 'ORD_123',
        paymentId: 'PAY_123',
        buyerEmail: 'buyer@example.com',
        currency: 'USD',
        amount: '199.00',
        taxAmount: '0.00',
        productName: 'Lifetime',
        refundStatus: 'succeeded',
      },
    });

    mocks.limit.mockResolvedValueOnce([
      { id: 'ORD_123', userId: 'user_123', type: 'one_time' },
    ]);

    await new WaffoProvider().handleWebhookEvent(
      '{"eventType":"refund.succeeded"}',
      'signed'
    );

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ paid: false, updatedAt: expect.any(Date) })
    );
    expect(mocks.revokeCreditsForRefund).toHaveBeenCalledWith({
      userId: 'user_123',
      paymentId: 'ORD_123',
      refundId: 'REFUND_123',
      kind: 'one_time',
    });
  });

  test('inserts a subscription payment on subscription.activated', async () => {
    mocks.verifyWebhook.mockReturnValue({
      id: 'delivery_activated',
      eventId: 'EVT_activated',
      eventType: 'subscription.activated',
      mode: 'test',
      data: {
        orderId: 'ORD_sub_1',
        buyerEmail: 'buyer@example.com',
        currency: 'USD',
        amount: '9.90',
        taxAmount: '0.00',
        productName: 'Pro Monthly',
        orderStatus: 'active',
        billingPeriod: 'monthly',
        currentPeriodStart: '2026-08-01T00:00:00.000Z',
        currentPeriodEnd: '2026-09-01T00:00:00.000Z',
        orderMetadata: {
          planId: 'pro',
          priceId: 'PROD_monthly',
          userId: 'user_123',
        },
      },
    });

    await new WaffoProvider().handleWebhookEvent(
      '{"eventType":"subscription.activated"}',
      'signed'
    );

    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ORD_sub_1',
        subscriptionId: 'ORD_sub_1',
        priceId: 'PROD_monthly',
        userId: 'user_123',
        interval: 'month',
        status: 'active',
        paid: true,
        cancelAtPeriodEnd: false,
        type: 'subscription',
      })
    );
  });

  test('syncs priceId and interval on subscription.updated (plan change)', async () => {
    mocks.values.mockRejectedValueOnce(
      new Error('UNIQUE constraint failed: payment.id')
    );
    mocks.verifyWebhook.mockReturnValue({
      id: 'delivery_updated',
      eventId: 'EVT_updated',
      eventType: 'subscription.updated',
      mode: 'test',
      data: {
        orderId: 'ORD_sub_1',
        buyerEmail: 'buyer@example.com',
        currency: 'USD',
        amount: '99.00',
        taxAmount: '0.00',
        productName: 'Pro Yearly',
        orderStatus: 'active',
        billingPeriod: 'yearly',
        productMetadata: { priceId: 'PROD_yearly' },
      },
    });

    await new WaffoProvider().handleWebhookEvent(
      '{"eventType":"subscription.updated"}',
      'signed'
    );

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        priceId: 'PROD_yearly',
        interval: 'year',
        status: 'active',
        paid: true,
      })
    );
  });

  test('inserts a new order for subscription.plan_changed upgrades', async () => {
    mocks.verifyWebhook.mockReturnValue({
      id: 'delivery_plan_changed',
      eventId: 'EVT_plan_changed',
      eventType: 'subscription.plan_changed',
      mode: 'test',
      data: {
        orderId: 'ORD_studio',
        buyerEmail: 'buyer@example.com',
        currency: 'USD',
        amount: '29.00',
        taxAmount: '0.00',
        productName: 'Studio Monthly',
        orderStatus: 'active',
        billingPeriod: 'monthly',
        currentPeriodStart: '2026-09-16T00:00:00.000Z',
        currentPeriodEnd: '2026-10-16T00:00:00.000Z',
        orderMetadata: {
          planId: 'studio',
          priceId: 'PROD_studio',
          userId: 'user_123',
        },
      },
    });

    mocks.limit.mockResolvedValueOnce([{ id: 'ORD_pro' }]);

    await new WaffoProvider().handleWebhookEvent(
      '{"eventType":"subscription.plan_changed"}',
      'signed'
    );

    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ORD_studio',
        subscriptionId: 'ORD_studio',
        priceId: 'PROD_studio',
        userId: 'user_123',
        status: 'active',
        paid: true,
        type: 'subscription',
      })
    );
    expect(mocks.cancelSubscription).toHaveBeenCalledWith({
      orderId: 'ORD_pro',
    });
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'canceled',
        cancelAtPeriodEnd: false,
      })
    );
  });

  test('still marks the old plan canceled when Waffo cancel returns 400', async () => {
    mocks.verifyWebhook.mockReturnValue({
      id: 'delivery_plan_changed',
      eventId: 'EVT_plan_changed',
      eventType: 'subscription.plan_changed',
      mode: 'test',
      data: {
        orderId: 'ORD_studio',
        buyerEmail: 'buyer@example.com',
        currency: 'USD',
        amount: '29.00',
        taxAmount: '0.00',
        productName: 'Studio Monthly',
        orderStatus: 'active',
        billingPeriod: 'monthly',
        currentPeriodStart: '2026-09-16T00:00:00.000Z',
        currentPeriodEnd: '2026-10-16T00:00:00.000Z',
        orderMetadata: {
          planId: 'studio',
          priceId: 'PROD_studio',
          userId: 'user_123',
        },
      },
    });
    mocks.limit.mockResolvedValueOnce([{ id: 'ORD_pro' }]);
    mocks.cancelSubscription.mockRejectedValueOnce(
      new Error('Subscription cannot be canceled, current status: canceling')
    );

    await expect(
      new WaffoProvider().handleWebhookEvent(
        '{"eventType":"subscription.plan_changed"}',
        'signed'
      )
    ).resolves.toBeUndefined();
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'canceled',
        cancelAtPeriodEnd: false,
      })
    );
  });

  test('skips webhook events whose mode does not match the runtime', async () => {
    mocks.verifyWebhook.mockReturnValue({
      id: 'delivery_prod_in_test',
      eventId: 'EVT_prod',
      eventType: 'order.completed',
      // Runtime is dev/test but the payload says prod: must be ignored.
      mode: 'prod',
      data: {
        orderId: 'ORD_prod',
        buyerEmail: 'buyer@example.com',
        currency: 'USD',
        amount: '19.00',
        taxAmount: '0.00',
        productName: 'Pro Monthly',
        paymentId: 'PAY_prod',
        orderMetadata: {
          planId: 'pro',
          priceId: 'PROD_monthly',
          userId: 'user_123',
        },
      },
    });

    await new WaffoProvider().handleWebhookEvent(
      '{"eventType":"order.completed"}',
      'signed'
    );

    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  test('falls back to orderId when refund event omits paymentId', async () => {
    mocks.verifyWebhook.mockReturnValue({
      id: 'delivery_refund_no_pay',
      eventId: 'REFUND_no_pay',
      eventType: 'refund.succeeded',
      mode: 'test',
      data: {
        orderId: 'ORD_renewal',
        buyerEmail: 'buyer@example.com',
        currency: 'USD',
        amount: '9.90',
        taxAmount: '0.00',
        productName: 'Pro Monthly',
        refundStatus: 'succeeded',
      },
    });

    mocks.limit.mockResolvedValueOnce([
      { id: 'ORD_renewal', userId: 'user_123', type: 'subscription' },
    ]);

    await new WaffoProvider().handleWebhookEvent(
      '{"eventType":"refund.succeeded"}',
      'signed'
    );

    // Update must still fire even without paymentId, matching by orderId only.
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ paid: false })
    );
    expect(mocks.revokeCreditsForRefund).toHaveBeenCalledWith({
      userId: 'user_123',
      paymentId: 'ORD_renewal',
      refundId: 'REFUND_no_pay',
      kind: 'subscription',
    });
  });

  test('ignores subscription events that are missing userId or priceId', async () => {
    mocks.verifyWebhook.mockReturnValue({
      id: 'delivery_missing',
      eventId: 'EVT_missing',
      eventType: 'subscription.activated',
      mode: 'test',
      data: {
        orderId: 'ORD_missing',
        buyerEmail: 'buyer@example.com',
        currency: 'USD',
        amount: '0.00',
        taxAmount: '0.00',
        productName: 'Unknown',
        orderStatus: 'active',
        // No orderMetadata → no userId / priceId to resolve.
      },
    });

    await new WaffoProvider().handleWebhookEvent(
      '{"eventType":"subscription.activated"}',
      'signed'
    );

    expect(mocks.insert).not.toHaveBeenCalled();
  });

  test('swallows duplicate one-time payment (unique violation) on webhook replay', async () => {
    mocks.verifyWebhook.mockReturnValue({
      id: 'delivery_dup',
      eventId: 'PAY_dup',
      eventType: 'order.completed',
      mode: 'test',
      data: {
        orderId: 'ORD_dup',
        buyerEmail: 'buyer@example.com',
        currency: 'USD',
        amount: '19.00',
        taxAmount: '0.00',
        productName: 'Pro Monthly',
        paymentId: 'PAY_dup',
        orderMetadata: {
          planId: 'pro',
          priceId: 'PROD_monthly',
          userId: 'user_123',
        },
      },
    });
    mocks.values.mockRejectedValueOnce(
      new Error('D1_ERROR: UNIQUE constraint failed: payment.id')
    );

    await expect(
      new WaffoProvider().handleWebhookEvent(
        '{"eventType":"order.completed"}',
        'signed'
      )
    ).resolves.toBeUndefined();
  });

  test('returns the shared hosted portal URL for createCustomerPortal', async () => {
    const provider = new WaffoProvider();
    await expect(
      provider.createCustomerPortal({
        customerId: 'user_123',
        returnUrl: 'https://example.com/settings/billing',
      })
    ).resolves.toEqual({
      url: 'https://pancake.waffo.ai/consumer/portal/login',
    });
    expect(provider.requiresCustomerId).toBe(false);
  });

  test('syncs a Waffo-canceled order down to free credits', async () => {
    mocks.limit
      .mockResolvedValueOnce([
        {
          id: 'ORD_studio',
          status: 'active',
          periodEnd: new Date('2026-10-16T00:00:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([]);
    mocks.graphqlQuery.mockResolvedValue({
      data: {
        subscriptionOrder: {
          id: 'ORD_studio',
          status: 'canceled',
          currentPeriodEnd: '2026-10-16T00:00:00.000Z',
        },
      },
    });

    await new WaffoProvider().syncSubscriptionsFromProvider('user_123');

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'canceled',
        paid: false,
        cancelAtPeriodEnd: false,
      })
    );
    expect(mocks.endSubscriptionCredits).toHaveBeenCalledWith('user_123');
  });

  test('drops Studio when Waffo reports canceling', async () => {
    mocks.limit.mockResolvedValueOnce([
      {
        id: 'ORD_studio',
        status: 'active',
        periodEnd: new Date('2026-10-16T00:00:00.000Z'),
      },
    ]);
    mocks.graphqlQuery.mockResolvedValue({
      data: {
        subscriptionOrder: {
          id: 'ORD_studio',
          status: 'canceling',
          currentPeriodEnd: '2026-10-16T00:00:00.000Z',
        },
      },
    });

    await new WaffoProvider().syncSubscriptionsFromProvider('user_123');

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'canceled',
        paid: false,
        cancelAtPeriodEnd: false,
      })
    );
    expect(mocks.endSubscriptionCredits).toHaveBeenCalledWith('user_123');
  });

  test('does not drop the local plan when the Waffo order query fails', async () => {
    mocks.limit.mockResolvedValueOnce([
      {
        id: 'ORD_studio',
        status: 'active',
        periodEnd: new Date('2026-10-16T00:00:00.000Z'),
      },
    ]);
    mocks.graphqlQuery.mockRejectedValue(new Error('graphql 400'));

    await new WaffoProvider().syncSubscriptionsFromProvider('user_123');

    expect(mocks.set).not.toHaveBeenCalled();
    expect(mocks.endSubscriptionCredits).not.toHaveBeenCalled();
  });

  test('clears credits after subscription.canceled when no live plan remains', async () => {
    mocks.verifyWebhook.mockReturnValue({
      id: 'delivery_canceled',
      eventId: 'EVT_canceled',
      eventType: 'subscription.canceled',
      mode: 'test',
      data: {
        orderId: 'ORD_studio',
        buyerEmail: 'buyer@example.com',
        currency: 'USD',
        amount: '29.00',
        taxAmount: '0.00',
        productName: 'Studio Monthly',
        orderStatus: 'canceled',
        orderMetadata: { userId: 'user_123' },
      },
    });
    mocks.limit.mockResolvedValueOnce([]);

    await new WaffoProvider().handleWebhookEvent(
      '{"eventType":"subscription.canceled"}',
      'signed'
    );

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'canceled',
        paid: false,
        cancelAtPeriodEnd: false,
      })
    );
    expect(mocks.endSubscriptionCredits).toHaveBeenCalledWith('user_123');
  });

  test('constructor throws when required env vars are missing', () => {
    const previousMerchant = process.env.WAFFO_MERCHANT_ID;
    const previousKey = process.env.WAFFO_PRIVATE_KEY;
    const env = process.env as Record<string, string | undefined>;
    try {
      delete env.WAFFO_MERCHANT_ID;
      expect(() => new WaffoProvider()).toThrow(/WAFFO_MERCHANT_ID/);
      process.env.WAFFO_MERCHANT_ID = 'MER_test';
      delete env.WAFFO_PRIVATE_KEY;
      expect(() => new WaffoProvider()).toThrow(/WAFFO_PRIVATE_KEY/);
    } finally {
      if (previousMerchant !== undefined) {
        process.env.WAFFO_MERCHANT_ID = previousMerchant;
      }
      if (previousKey !== undefined) {
        process.env.WAFFO_PRIVATE_KEY = previousKey;
      }
    }
  });
});
