import { DashboardHeader } from '@/components/layout/dashboard-header';
import { ProjectWorkspace } from '@/components/noddi/project-workspace';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/projects/$projectId')({
  head: () => ({
    scripts: [
      {
        src: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
        async: true,
        defer: true,
      },
    ],
  }),
  component: ProjectPage,
});

function ProjectPage() {
  const { projectId } = Route.useParams();
  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          {
            label: 'Projects',
            href: '/dashboard/projects',
            isCurrentPage: false,
          },
          { label: 'Project', isCurrentPage: true },
        ]}
      />
      <main className="mx-auto w-full max-w-6xl p-5 lg:p-8">
        <ProjectWorkspace projectId={projectId} />
      </main>
    </>
  );
}
