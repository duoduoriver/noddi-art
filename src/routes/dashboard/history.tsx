import { ProjectList } from '@/components/noddi/project-list';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { m } from '@/locale/paraglide/messages';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/history')({
  component: () => (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: m.noddi_projects_history(), isCurrentPage: true },
        ]}
      />
      <main className="mx-auto w-full max-w-6xl p-5 lg:p-8">
        <span className="sunburst-eyebrow">Project archive</span>
        <h1 className="mb-8 mt-4 text-4xl font-extrabold tracking-[-0.04em]">
          {m.noddi_projects_history()}
        </h1>
        <ProjectList />
      </main>
    </>
  ),
});
