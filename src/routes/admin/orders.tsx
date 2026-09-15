import { getNoddiOrders } from '@/api/admin-noddi';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { m } from '@/locale/paraglide/messages';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/orders')({
  component: OrdersPage,
});

function OrdersPage() {
  const { data } = useQuery({
    queryKey: ['admin-noddi-orders'],
    queryFn: () => getNoddiOrders(),
  });
  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: m.noddi_admin_orders(), isCurrentPage: true }]}
      />
      <main className="space-y-6 p-5 lg:p-8">
        <div>
          <span className="sunburst-eyebrow">Admin</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em]">
            {m.noddi_admin_orders()}
          </h1>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-[#dedde3] bg-white shadow-[0_10px_28px_rgba(17,17,17,0.05)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f6f5f2]">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3">Paid</th>
              </tr>
            </thead>
            <tbody>
              {data?.payments.map((entry) => (
                <tr key={entry.id} className="border-t border-[#ecebf0]">
                  <td className="p-3 font-mono text-xs">{entry.id}</td>
                  <td className="p-3">{entry.priceId}</td>
                  <td className="p-3">{entry.status}</td>
                  <td className="p-3">{String(entry.paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
