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
      <main className="mx-auto w-full max-w-6xl p-5 lg:p-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <span className="sunburst-eyebrow">Your workspace</span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em]">
              {m.noddi_projects_title()}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Reopen previous concepts or start a fresh icon direction.
            </p>
          </div>
        </div>
        <ProjectList />
      </main>
    </>
  );
}
