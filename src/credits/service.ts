import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { creditAccounts, creditLedger } from '@/db/app.schema';
import {
  PACK_CATALOG,
  PLAN_CATALOG,
  type NoddiPackCode,
  type NoddiPlanCode,
} from '@/credits/catalog';

const FREE_SIGNUP_CREDITS = PLAN_CATALOG.free.allowance;

export type CreditSummary = {
  planBalance: number;
  purchasedBalance: number;
  refundDebt: number;
  planCode: string;
  periodEnd: Date | null;
  paidAccessAt: Date | null;
  paidAccess: boolean;
  frozen: boolean;
};

export type DebitResult = { planDebited: number; purchasedDebited: number };

function id() {
  return crypto.randomUUID();
}

function now() {
  return new Date();
}

/**
 * Grants Free credits exactly once. The operation key makes retries safe.
 * The account is created before any queued job can consume it.
 */
export async function grantSignupCredits(userId: string) {
  const db = getDb();
  const createdAt = now();
  const operationId = `signup:${userId}`;
  await db
    .insert(creditAccounts)
    .values({
      userId,
      planBalance: FREE_SIGNUP_CREDITS,
      purchasedBalance: 0,
      refundDebt: 0,
      planCode: 'free',
      planAllowance: FREE_SIGNUP_CREDITS,
      issuedTotal: FREE_SIGNUP_CREDITS,
      updatedAt: createdAt,
      lastOperationId: operationId,
    })
    .onConflictDoNothing();
  await db
    .insert(creditLedger)
    .values({
      id: id(),
      operationId,
      userId,
      planDelta: FREE_SIGNUP_CREDITS,
      purchasedDelta: 0,
      debtDelta: 0,
      type: 'signup_grant',
      createdAt,
    })
    .onConflictDoNothing();
}

async function expirePlanCredits(userId: string, at = now()) {
  const [account] = await getDb()
    .select()
    .from(creditAccounts)
    .where(eq(creditAccounts.userId, userId))
    .limit(1);
  if (account?.periodEnd && account.periodEnd.getTime() <= at.getTime()) {
    await getDb()
      .update(creditAccounts)
      .set({
        planBalance: 0,
        planCode: 'free',
        planAllowance: FREE_SIGNUP_CREDITS,
        periodEnd: null,
        version: sql`${creditAccounts.version} + 1`,
        updatedAt: at,
      })
      .where(
        and(
          eq(creditAccounts.userId, userId),
          eq(creditAccounts.version, account.version)
        )
      );
  }
}

export async function getCreditSummary(userId: string): Promise<CreditSummary> {
  await grantSignupCredits(userId);
  await expirePlanCredits(userId);
  const [account] = await getDb()
    .select()
    .from(creditAccounts)
    .where(eq(creditAccounts.userId, userId))
    .limit(1);
  if (!account) throw new Error('Credit account was not created');
  return {
    planBalance: account.planBalance,
    purchasedBalance: account.purchasedBalance,
    refundDebt: account.refundDebt,
    planCode: account.planCode,
    periodEnd: account.periodEnd,
    paidAccessAt: account.paidAccessAt,
    paidAccess:
      account.refundDebt === 0 &&
      (account.planCode !== 'free' || account.paidAccessAt !== null),
    frozen: account.refundDebt > 0,
  };
}

/**
 * Compare-and-swap debit used by the Queue consumer. A failed compare means a
 * concurrent operation changed the account; callers may retry from a fresh read.
 */
export async function debitCredits(
  userId: string,
  operationId: string,
  amount: number,
  jobId: string
): Promise<DebitResult | null> {
  if (!Number.isInteger(amount) || amount <= 0)
    throw new Error('Invalid debit');
  await grantSignupCredits(userId);
  await expirePlanCredits(userId);
  const db = getDb();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const [account] = await db
      .select()
      .from(creditAccounts)
      .where(eq(creditAccounts.userId, userId))
      .limit(1);
    if (!account) return null;
    const planDebited = Math.min(account.planBalance, amount);
    const purchasedDebited = amount - planDebited;
    if (account.purchasedBalance < purchasedDebited) return null;
    const updatedAt = now();
    const result = await db
      .update(creditAccounts)
      .set({
        planBalance: account.planBalance - planDebited,
        purchasedBalance: account.purchasedBalance - purchasedDebited,
        consumedTotal: account.consumedTotal + amount,
        version: account.version + 1,
        lastOperationId: operationId,
        updatedAt,
      })
      .where(
        and(
          eq(creditAccounts.userId, userId),
          eq(creditAccounts.version, account.version)
        )
      )
      .returning({ userId: creditAccounts.userId });
    if (result.length === 0) continue;
    try {
      await db.insert(creditLedger).values({
        id: id(),
        operationId,
        userId,
        planDelta: -planDebited,
        purchasedDelta: -purchasedDebited,
        debtDelta: 0,
        type: 'generation_debit',
        jobId,
        createdAt: updatedAt,
      });
      return { planDebited, purchasedDebited };
    } catch (error) {
      // The unique operation can only happen after a successfully persisted debit.
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('unique')
      ) {
        const [ledger] = await db
          .select()
          .from(creditLedger)
          .where(eq(creditLedger.operationId, operationId))
          .limit(1);
        if (ledger) {
          return {
            planDebited: Math.abs(ledger.planDelta),
            purchasedDebited: Math.abs(ledger.purchasedDelta),
          };
        }
      }
      throw error;
    }
  }
  return null;
}

export async function refundGeneration(
  userId: string,
  jobId: string,
  planDebited: number,
  purchasedDebited: number
) {
  const db = getDb();
  const operationId = `generation-refund:${jobId}`;
  const createdAt = now();
  const [account] = await db
    .select()
    .from(creditAccounts)
    .where(eq(creditAccounts.userId, userId))
    .limit(1);
  if (!account) return;
  const currentPlanRoom = Math.max(
    0,
    account.planAllowance - account.planBalance
  );
  const planRefund = Math.min(planDebited, currentPlanRoom);
  const ledgerResult = await db
    .insert(creditLedger)
    .values({
      id: id(),
      operationId,
      userId,
      planDelta: planRefund,
      purchasedDelta: purchasedDebited,
      debtDelta: 0,
      type: 'generation_refund',
      jobId,
      metadata: JSON.stringify({
        unappliedPlanCredits: planDebited - planRefund,
      }),
      createdAt,
    })
    .onConflictDoNothing()
    .returning({ operationId: creditLedger.operationId });
  if (ledgerResult.length === 0) return;
  await db
    .update(creditAccounts)
    .set({
      planBalance: account.planBalance + planRefund,
      purchasedBalance: account.purchasedBalance + purchasedDebited,
      version: account.version + 1,
      lastOperationId: operationId,
      updatedAt: createdAt,
    })
    .where(
      and(
        eq(creditAccounts.userId, userId),
        eq(creditAccounts.version, account.version)
      )
    );
}

export async function grantSubscriptionPeriod(
  userId: string,
  paymentId: string,
  periodKey: string,
  planCode: Exclude<NoddiPlanCode, 'free'>,
  periodEnd: Date | null
) {
  await grantSignupCredits(userId);
  const plan = PLAN_CATALOG[planCode];
  const operationId = `subscription:${paymentId}:${periodKey}`;
  const createdAt = now();
  const ledger = await getDb()
    .insert(creditLedger)
    .values({
      id: id(),
      operationId,
      userId,
      planDelta: plan.allowance,
      purchasedDelta: 0,
      debtDelta: 0,
      type: 'subscription_grant',
      paymentId,
      periodKey,
      createdAt,
    })
    .onConflictDoNothing()
    .returning({ operationId: creditLedger.operationId });
  if (!ledger.length) return;
  await getDb()
    .update(creditAccounts)
    .set({
      planBalance: plan.allowance,
      planCode,
      planAllowance: plan.allowance,
      periodEnd,
      issuedTotal: sql`${creditAccounts.issuedTotal} + ${plan.allowance}`,
      version: sql`${creditAccounts.version} + 1`,
      lastOperationId: operationId,
      updatedAt: createdAt,
    })
    .where(eq(creditAccounts.userId, userId));
}

export async function grantPurchasedCredits(
  userId: string,
  paymentId: string,
  packCode: NoddiPackCode,
  source: 'pack_grant' | 'admin_grant' = 'pack_grant'
) {
  await grantSignupCredits(userId);
  const pack = PACK_CATALOG[packCode];
  const operationId = `${source}:${paymentId}`;
  const [account] = await getDb()
    .select()
    .from(creditAccounts)
    .where(eq(creditAccounts.userId, userId))
    .limit(1);
  if (!account) throw new Error('Credit account was not created');
  const debtPaid = Math.min(account.refundDebt, pack.credits);
  const purchasedDelta = pack.credits - debtPaid;
  const createdAt = now();
  const ledger = await getDb()
    .insert(creditLedger)
    .values({
      id: id(),
      operationId,
      userId,
      planDelta: 0,
      purchasedDelta,
      debtDelta: -debtPaid,
      type: source,
      paymentId,
      metadata: JSON.stringify({ packCode, debtPaid }),
      createdAt,
    })
    .onConflictDoNothing()
    .returning({ operationId: creditLedger.operationId });
  if (!ledger.length) return;
  await getDb()
    .update(creditAccounts)
    .set({
      purchasedBalance: account.purchasedBalance + purchasedDelta,
      refundDebt: account.refundDebt - debtPaid,
      paidAccessAt: account.paidAccessAt ?? createdAt,
      issuedTotal: account.issuedTotal + pack.credits,
      version: account.version + 1,
      lastOperationId: operationId,
      updatedAt: createdAt,
    })
    .where(
      and(
        eq(creditAccounts.userId, userId),
        eq(creditAccounts.version, account.version)
      )
    );
}

export async function revokeCreditsForRefund({
  userId,
  paymentId,
  refundId,
  kind,
}: {
  userId: string;
  paymentId: string;
  refundId: string;
  kind: 'one_time' | 'subscription';
}) {
  const db = getDb();
  const operationId = `payment-refund:${refundId}`;
  const [existing] = await db
    .select({ id: creditLedger.id })
    .from(creditLedger)
    .where(eq(creditLedger.operationId, operationId))
    .limit(1);
  if (existing) return;

  const [account] = await db
    .select()
    .from(creditAccounts)
    .where(eq(creditAccounts.userId, userId))
    .limit(1);
  if (!account) return;

  let planDelta = 0;
  let purchasedDelta = 0;
  let debtDelta = 0;
  let nextPlanBalance = account.planBalance;
  let nextPurchasedBalance = account.purchasedBalance;
  let nextRefundDebt = account.refundDebt;
  let nextPlanCode = account.planCode;
  let nextPlanAllowance = account.planAllowance;
  let nextPeriodEnd = account.periodEnd;

  if (kind === 'one_time') {
    const [grant] = await db
      .select({
        purchasedDelta: creditLedger.purchasedDelta,
        debtDelta: creditLedger.debtDelta,
      })
      .from(creditLedger)
      .where(
        and(
          eq(creditLedger.paymentId, paymentId),
          eq(creditLedger.type, 'pack_grant')
        )
      )
      .limit(1);
    if (!grant) return;
    const debtPreviouslyPaid = Math.max(0, -grant.debtDelta);
    const removable = Math.min(account.purchasedBalance, grant.purchasedDelta);
    const spentFromGrant = grant.purchasedDelta - removable;
    purchasedDelta = -removable;
    debtDelta = debtPreviouslyPaid + spentFromGrant;
    nextPurchasedBalance = account.purchasedBalance - removable;
    nextRefundDebt = account.refundDebt + debtDelta;
  } else {
    const spentFromPlan = Math.max(
      0,
      account.planAllowance - account.planBalance
    );
    planDelta = -account.planBalance;
    debtDelta = spentFromPlan;
    nextPlanBalance = 0;
    nextRefundDebt = account.refundDebt + spentFromPlan;
    nextPlanCode = 'free';
    nextPlanAllowance = FREE_SIGNUP_CREDITS;
    nextPeriodEnd = null;
  }

  const createdAt = now();
  const inserted = await db
    .insert(creditLedger)
    .values({
      id: id(),
      operationId,
      userId,
      planDelta,
      purchasedDelta,
      debtDelta,
      type: 'payment_refund',
      paymentId,
      metadata: JSON.stringify({ kind }),
      createdAt,
    })
    .onConflictDoNothing()
    .returning({ operationId: creditLedger.operationId });
  if (!inserted.length) return;

  await db
    .update(creditAccounts)
    .set({
      planBalance: nextPlanBalance,
      purchasedBalance: nextPurchasedBalance,
      refundDebt: nextRefundDebt,
      planCode: nextPlanCode,
      planAllowance: nextPlanAllowance,
      periodEnd: nextPeriodEnd,
      paidAccessAt:
        nextPlanCode !== 'free' || nextPurchasedBalance > 0
          ? account.paidAccessAt
          : null,
      version: account.version + 1,
      lastOperationId: operationId,
      updatedAt: createdAt,
    })
    .where(eq(creditAccounts.userId, userId));
}

export async function listCreditLedger(userId: string, limit = 50) {
  return getDb()
    .select()
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId))
    .orderBy(desc(creditLedger.createdAt))
    .limit(Math.min(limit, 100));
}

export async function hasPaidAccess(userId: string) {
  const summary = await getCreditSummary(userId);
  return summary.paidAccess && !summary.frozen;
}

export async function hasRefundDebt(userId: string) {
  const [account] = await getDb()
    .select({ refundDebt: creditAccounts.refundDebt })
    .from(creditAccounts)
    .where(
      and(eq(creditAccounts.userId, userId), gt(creditAccounts.refundDebt, 0))
    )
    .limit(1);
  return !!account;
}
