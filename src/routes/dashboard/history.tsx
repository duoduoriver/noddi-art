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
      <main className="mx-auto w-full max-w-5xl p-4 lg:p-8">
        <h1 className="mb-8 font-hand text-4xl">
          {m.noddi_projects_history()}
        </h1>
        <ProjectList />
      </main>
    </>
  ),
});
