import { createFileRoute, redirect } from '@tanstack/react-router';
import { Routes } from '@/lib/routes';

// Legacy links and payment callbacks continue to land on the unified page.
export const Route = createFileRoute('/settings/billing')({
  beforeLoad: () => {
    throw redirect({ to: Routes.DashboardCredits });
  },
});
