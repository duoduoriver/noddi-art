import { m } from '@/locale/paraglide/messages';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PaymentCard } from '@/components/payment/payment-card';
import { Routes } from '@/lib/routes';

export const Route = createFileRoute('/settings/payment')({
  validateSearch: (
    s
  ): {
    session_id?: string;
    callback?: string;
    plan?: string;
  } => ({
    session_id: typeof s?.session_id === 'string' ? s.session_id : undefined,
    callback: typeof s?.callback === 'string' ? s.callback : undefined,
    plan: typeof s?.plan === 'string' ? s.plan : undefined,
  }),
  component: PaymentPage,
});

function PaymentPage() {
  const search = useSearch({ from: '/settings/payment' });
  const breadcrumbs = [
    { label: m.common_settings(), isCurrentPage: false },
    { label: m.settings_billing_breadcrumb(), isCurrentPage: true },
  ];
  return (
    <DashboardLayout
      breadcrumbs={breadcrumbs}
      title={m.settings_billing_title()}
      description={m.settings_billing_description()}
    >
      <PaymentCard
        sessionId={search.session_id}
        // Hosted providers (Creem, Waffo) return without a Stripe session
        // id. Do not require `callback` — some hosts rewrite the query
        // string — and poll until the webhook grants credits.
        hostedPostCheckout={search.session_id === undefined}
        callback={search.callback ?? Routes.DashboardCredits}
        expectedPlan={search.plan}
      />
    </DashboardLayout>
  );
}
