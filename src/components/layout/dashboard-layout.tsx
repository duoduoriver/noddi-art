import { DashboardHeader } from '@/components/layout/dashboard-header';
import type { DashboardBreadcrumbItem } from '@/components/layout/dashboard-header';

interface DashboardLayoutProps {
  breadcrumbs: DashboardBreadcrumbItem[];
  title: string;
  description: string;
  children: React.ReactNode;
}

/**
 * Shared layout for dashboard/admin/settings routes
 * header with breadcrumbs + title/description + content
 */
export function DashboardLayout({
  breadcrumbs,
  title,
  description,
  children,
}: DashboardLayoutProps) {
  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="@container/main flex flex-1 flex-col gap-2 bg-white">
        <div className="flex flex-col gap-5 px-5 py-6 lg:gap-7 lg:px-8 lg:py-8">
          <div className="max-w-3xl">
            <span className="sunburst-eyebrow">Workspace</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
              {description}
            </p>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
