import { getCreditSummary, listCreditLedger } from '@/api/generation';
import { getPaymentHistory } from '@/api/payment';
import { BillingCard } from '@/components/settings/billing/billing-card';
import { Button } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { findPlanByPriceId } from '@/lib/price-plan';
import { getLocale } from '@/lib/locale';
import { m } from '@/locale/paraglide/messages';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

const ledgerLabels: Record<string, () => string> = {
  signup_grant: m.noddi_ledger_signup_grant,
  generation_debit: m.noddi_ledger_generation_debit,
  generation_refund: m.noddi_ledger_generation_refund,
  subscription_grant: m.noddi_ledger_subscription_grant,
  pack_grant: m.noddi_ledger_pack_grant,
  pack_refund: m.noddi_ledger_pack_refund,
  admin_grant: m.noddi_ledger_admin_grant,
  subscription_expire: m.noddi_ledger_subscription_expire,
  refund_debt: m.noddi_ledger_refund_debt,
};

function orderStatus(status: string) {
  const labels: Record<string, () => string> = {
    active: m.noddi_order_status_active,
    trialing: m.noddi_order_status_trialing,
    completed: m.noddi_order_status_completed,
    paid: m.noddi_order_status_paid,
    pending: m.noddi_order_status_pending,
    failed: m.noddi_order_status_failed,
    refunded: m.noddi_order_status_refunded,
    canceled: m.noddi_order_status_canceled,
  };
  return (labels[status] ?? m.noddi_order_status_unknown)();
}

const formatDate = (date: Date | string) =>
  new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' }).format(
    new Date(date)
  );

export function CreditSummary() {
  const summary = useQuery({
    queryKey: ['noddi-credits'],
    queryFn: () => getCreditSummary(),
  });
  const ledger = useQuery({
    queryKey: ['noddi-ledger'],
    queryFn: () => listCreditLedger(),
  });
  const history = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => getPaymentHistory(),
  });
  if (summary.isPending)
    return (
      <div className="sunburst-card flex min-h-40 items-center justify-center p-6 text-sm text-muted-foreground">
        {m.noddi_project_processing()}
      </div>
    );
  if (summary.error || !summary.data)
    return (
      <div role="alert" className="sunburst-card-strong p-5">
        <p>
          {m.noddi_credits_load_error({
            message: summary.error?.message ?? '',
          })}
        </p>
        <Button onClick={() => summary.refetch()}>
          {m.noddi_common_retry()}
        </Button>
      </div>
    );
  const total = summary.data.planBalance + summary.data.purchasedBalance;
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="sunburst-card-strong p-5">
          <p className="text-sm font-semibold text-[#666]">
            {m.noddi_credits_available()}
          </p>
          <p className="mt-2 text-5xl font-extrabold tracking-[-0.05em]">
            {total}
          </p>
        </article>
        <article className="sunburst-card-purple p-5">
          <p className="text-sm font-semibold text-[#666]">
            {m.noddi_credits_plan_label({ plan: summary.data.planCode })}
          </p>
          <p className="mt-2 text-5xl font-extrabold tracking-[-0.05em]">
            {summary.data.planBalance}
          </p>
          {summary.data.periodEnd ? (
            <p className="mt-2 text-xs">
              {m.noddi_credits_renews({
                date: formatDate(summary.data.periodEnd),
              })}
            </p>
          ) : null}
        </article>
        <article className="sunburst-card p-5">
          <p className="text-sm font-semibold text-[#666]">
            {m.noddi_credits_purchased()}
          </p>
          <p className="mt-2 text-5xl font-extrabold tracking-[-0.05em]">
            {summary.data.purchasedBalance}
          </p>
          {websiteConfig.payment?.enable ? (
            <Button
              render={<Link to="/pricing" />}
              variant="outline"
              className="mt-2"
            >
              {m.noddi_credits_get()}
            </Button>
          ) : null}
        </article>
      </div>
      {summary.data.frozen ? (
        <p
          role="alert"
          className="rounded-xl border border-[#f2b6d6] bg-[#fff0f7] p-4"
        >
          {m.noddi_credits_frozen()}
        </p>
      ) : null}
      {summary.data.refundDebt > 0 ? (
        <p
          role="alert"
          className="rounded-xl border border-[#f2b6d6] bg-[#fff0f7] p-4"
        >
          {m.noddi_credits_refund_debt({ credits: summary.data.refundDebt })}
        </p>
      ) : null}
      {websiteConfig.payment?.enable ? (
        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-[-0.03em]">
            {m.noddi_billing_title()}
          </h2>
          <BillingCard />
        </section>
      ) : null}
      <section>
        <h2 className="mb-3 text-2xl font-extrabold tracking-[-0.03em]">
          {m.noddi_ledger_title()}
        </h2>
        {ledger.isPending ? (
          <p>{m.noddi_ledger_loading()}</p>
        ) : ledger.error ? (
          <div role="alert">
            {m.noddi_ledger_load_error()}{' '}
            <Button variant="outline" onClick={() => ledger.refetch()}>
              {m.noddi_common_retry()}
            </Button>
          </div>
        ) : !ledger.data?.length ? (
          <p className="sunburst-soft-band rounded-2xl border border-dashed border-[#b9aaff] p-5">
            {m.noddi_ledger_empty()}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#dedde3] bg-white shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f6f5f2]">
                <tr className="border-b border-[#dedde3]">
                  <th className="p-3">{m.noddi_ledger_activity()}</th>
                  <th className="p-3">{m.noddi_ledger_credits()}</th>
                  <th className="p-3">{m.noddi_ledger_date()}</th>
                </tr>
              </thead>
              <tbody>
                {ledger.data.map((entry) => (
                  <tr key={entry.id} className="border-b border-[#ecebf0]">
                    <td className="p-3">
                      {(
                        ledgerLabels[entry.type] ?? m.noddi_ledger_adjustment
                      )()}
                      {entry.project ? (
                        <Link
                          to="/dashboard/projects/$projectId"
                          params={{ projectId: entry.project.projectId }}
                          className="mt-1 block text-muted-foreground underline"
                        >
                          {entry.project.projectName}
                        </Link>
                      ) : null}
                    </td>
                    <td className="p-3">
                      {entry.planDelta + entry.purchasedDelta > 0 ? '+' : ''}
                      {entry.planDelta + entry.purchasedDelta}
                    </td>
                    <td className="p-3">{formatDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-1 text-2xl font-extrabold tracking-[-0.03em]">
          {m.noddi_orders_title()}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {m.noddi_orders_description()}
        </p>
        {history.isPending ? (
          <p>{m.noddi_orders_loading()}</p>
        ) : history.error ? (
          <div role="alert">
            {m.noddi_orders_load_error()}{' '}
            <Button variant="outline" onClick={() => history.refetch()}>
              {m.noddi_common_retry()}
            </Button>
          </div>
        ) : !history.data?.length ? (
          <p className="sunburst-soft-band rounded-2xl border border-dashed border-[#b9aaff] p-5">
            {m.noddi_orders_empty()}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#dedde3] bg-white shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f6f5f2]">
                <tr className="border-b border-[#dedde3]">
                  <th className="p-3">{m.noddi_orders_product()}</th>
                  <th className="p-3">{m.noddi_orders_status()}</th>
                  <th className="p-3">{m.noddi_orders_id()}</th>
                  <th className="p-3">{m.noddi_ledger_date()}</th>
                </tr>
              </thead>
              <tbody>
                {history.data.map((order) => (
                  <tr key={order.id} className="border-b border-[#ecebf0]">
                    <td className="p-3">
                      {findPlanByPriceId(order.priceId)?.name ??
                        m.noddi_orders_unknown_product()}
                    </td>
                    <td className="p-3">{orderStatus(order.status)}</td>
                    <td className="p-3 font-mono text-xs">{order.id}</td>
                    <td className="p-3">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
