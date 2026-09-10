import { ProjectList } from '@/components/noddi/project-list';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { m } from '@/locale/paraglide/messages';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/projects/')({
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: m.noddi_projects_title(), isCurrentPage: true }]}
      />
      <main className="mx-auto w-full max-w-5xl p-4 lg:p-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="font-hand text-sm uppercase tracking-widest text-[#9b7bff]">
              noddi
            </p>
            <h1 className="font-hand text-4xl">{m.noddi_projects_title()}</h1>
          </div>
        </div>
        <ProjectList />
      </main>
    </>
  );
}
