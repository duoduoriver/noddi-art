import { CreditSummary } from '@/components/noddi/credit-summary';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { m } from '@/locale/paraglide/messages';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/credits')({
  component: CreditsPage,
});

function CreditsPage() {
  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: m.noddi_nav_credits_billing(), isCurrentPage: true },
        ]}
      />
      <main className="mx-auto w-full max-w-6xl p-5 lg:p-8">
        <span className="sunburst-eyebrow">Plan & usage</span>
        <h1 className="mb-8 mt-4 text-4xl font-extrabold tracking-[-0.04em]">
          {m.noddi_nav_credits_billing()}
        </h1>
        <CreditSummary />
      </main>
    </>
  );
}
