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
      <main className="space-y-6 p-4 lg:p-8">
        <h1 className="font-hand text-4xl">{m.noddi_admin_orders()}</h1>
        <div className="overflow-x-auto border-2 border-black">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3">Paid</th>
              </tr>
            </thead>
            <tbody>
              {data?.payments.map((entry) => (
                <tr key={entry.id} className="border-t">
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
