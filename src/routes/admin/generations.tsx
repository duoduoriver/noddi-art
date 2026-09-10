import { getGenerationOperations } from '@/api/admin-noddi';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { m } from '@/locale/paraglide/messages';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/generations')({
  component: GenerationsPage,
});

function GenerationsPage() {
  const { data } = useQuery({
    queryKey: ['admin-noddi-generations'],
    queryFn: () => getGenerationOperations(),
  });
  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: m.noddi_admin_generations(), isCurrentPage: true },
        ]}
      />
      <main className="space-y-6 p-4 lg:p-8">
        <h1 className="font-hand text-4xl">{m.noddi_admin_generations()}</h1>
        <p className="border-l-4 border-[#ff6fc7] bg-[#ff6fc7]/10 p-4">
          {m.noddi_admin_disabled()}
        </p>
        <div className="overflow-x-auto border-2 border-black">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-3">Job</th>
                <th className="p-3">Operation</th>
                <th className="p-3">Status</th>
                <th className="p-3">Error</th>
              </tr>
            </thead>
            <tbody>
              {data?.jobs.map((job) => (
                <tr key={job.id} className="border-t">
                  <td className="p-3 font-mono text-xs">{job.id}</td>
                  <td className="p-3">{job.operation}</td>
                  <td className="p-3">{job.status}</td>
                  <td className="p-3">{job.failureCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
