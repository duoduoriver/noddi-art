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
  if (summary.isPending) return <p>{m.noddi_project_processing()}</p>;
  if (summary.error || !summary.data)
    return (
      <div role="alert">
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
        <article className="border-2 border-black bg-white p-5 shadow-[3px_3px_0_#111]">
          <p className="text-sm">{m.noddi_credits_available()}</p>
          <p className="font-hand text-5xl">{total}</p>
        </article>
        <article className="border-2 border-black bg-white p-5 shadow-[3px_3px_0_#9b7bff]">
          <p className="text-sm">
            {m.noddi_credits_plan_label({ plan: summary.data.planCode })}
          </p>
          <p className="font-hand text-5xl">{summary.data.planBalance}</p>
          {summary.data.periodEnd ? (
            <p className="mt-2 text-xs">
              {m.noddi_credits_renews({
                date: formatDate(summary.data.periodEnd),
              })}
            </p>
          ) : null}
        </article>
        <article className="border-2 border-black bg-white p-5 shadow-[3px_3px_0_#c6ff5b]">
          <p className="text-sm">{m.noddi_credits_purchased()}</p>
          <p className="font-hand text-5xl">{summary.data.purchasedBalance}</p>
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
          className="border-l-4 border-[#ff6fc7] bg-[#ff6fc7]/10 p-4"
        >
          {m.noddi_credits_frozen()}
        </p>
      ) : null}
      {summary.data.refundDebt > 0 ? (
        <p
          role="alert"
          className="border-l-4 border-[#ff6fc7] bg-[#ff6fc7]/10 p-4"
        >
          {m.noddi_credits_refund_debt({ credits: summary.data.refundDebt })}
        </p>
      ) : null}
      {websiteConfig.payment?.enable ? (
        <section>
          <h2 className="mb-3 font-hand text-2xl">{m.noddi_billing_title()}</h2>
          <BillingCard />
        </section>
      ) : null}
      <section>
        <h2 className="mb-3 font-hand text-2xl">{m.noddi_ledger_title()}</h2>
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
          <p className="border-2 border-dashed border-black p-5">
            {m.noddi_ledger_empty()}
          </p>
        ) : (
          <div className="overflow-x-auto border-2 border-black">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="p-3">{m.noddi_ledger_activity()}</th>
                  <th className="p-3">{m.noddi_ledger_credits()}</th>
                  <th className="p-3">{m.noddi_ledger_date()}</th>
                </tr>
              </thead>
              <tbody>
                {ledger.data.map((entry) => (
                  <tr key={entry.id} className="border-b">
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
        <h2 className="mb-1 font-hand text-2xl">{m.noddi_orders_title()}</h2>
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
          <p className="border-2 border-dashed border-black p-5">
            {m.noddi_orders_empty()}
          </p>
        ) : (
          <div className="overflow-x-auto border-2 border-black">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="p-3">{m.noddi_orders_product()}</th>
                  <th className="p-3">{m.noddi_orders_status()}</th>
                  <th className="p-3">{m.noddi_orders_id()}</th>
                  <th className="p-3">{m.noddi_ledger_date()}</th>
                </tr>
              </thead>
              <tbody>
                {history.data.map((order) => (
                  <tr key={order.id} className="border-b">
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
