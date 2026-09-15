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
      <main className="space-y-6 p-5 lg:p-8">
        <div>
          <span className="sunburst-eyebrow">Admin</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em]">
            {m.noddi_admin_generations()}
          </h1>
        </div>
        <p className="rounded-xl border border-[#f2b6d6] bg-[#fff0f7] p-4 text-sm">
          {m.noddi_admin_disabled()}
        </p>
        <div className="overflow-x-auto rounded-2xl border border-[#dedde3] bg-white shadow-[0_10px_28px_rgba(17,17,17,0.05)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f6f5f2]">
              <tr>
                <th className="p-3">Job</th>
                <th className="p-3">Operation</th>
                <th className="p-3">Status</th>
                <th className="p-3">Error</th>
              </tr>
            </thead>
            <tbody>
              {data?.jobs.map((job) => (
                <tr key={job.id} className="border-t border-[#ecebf0]">
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
