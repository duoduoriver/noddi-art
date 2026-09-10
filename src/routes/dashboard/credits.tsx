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
      <main className="mx-auto w-full max-w-5xl p-4 lg:p-8">
        <h1 className="mb-8 font-hand text-4xl">
          {m.noddi_nav_credits_billing()}
        </h1>
        <CreditSummary />
      </main>
    </>
  );
}
