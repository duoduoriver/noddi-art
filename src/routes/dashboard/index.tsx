import { createFileRoute, redirect } from '@tanstack/react-router';
import { Routes } from '@/lib/routes';

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: () => {
    throw redirect({ to: Routes.DashboardProjects });
  },
});
