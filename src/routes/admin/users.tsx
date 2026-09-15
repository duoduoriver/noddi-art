import { m } from '@/locale/paraglide/messages';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { AdminUsersContent } from '@/components/admin/users/admin-users-content';

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const breadcrumbs = [
    { label: m.admin_title(), isCurrentPage: false },
    { label: m.admin_users_title(), isCurrentPage: true },
  ];
  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-6 px-5 py-6 lg:px-8 lg:py-8">
            <div>
              <span className="sunburst-eyebrow">Admin</span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em]">
                {m.admin_users_title()}
              </h1>
            </div>
            <div className="rounded-2xl border border-[#dedde3] bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.05)] sm:p-5">
              <AdminUsersContent />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
