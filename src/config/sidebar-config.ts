import { m } from '@/locale/paraglide/messages';
import {
  IconCreditCard,
  IconPalette,
  IconSettings2,
  IconShieldCheck,
  IconUsers,
} from '@tabler/icons-react';
import { Routes } from '@/lib/routes';
import type { MenuItemConfig } from '../types';

export function getSidebarLinks(): MenuItemConfig[] {
  return [
    {
      title: m.noddi_nav_my_projects(),
      icon: IconPalette,
      href: Routes.DashboardProjects,
      external: false,
    },
    {
      title: m.noddi_nav_credits_billing(),
      icon: IconCreditCard,
      href: Routes.DashboardCredits,
      external: false,
    },
    {
      title: m.admin_title(),
      icon: IconShieldCheck,
      authorizeOnly: ['admin'],
      items: [
        {
          title: m.admin_users_title(),
          icon: IconUsers,
          href: Routes.AdminUsers,
          external: false,
        },
        {
          title: m.noddi_admin_generations(),
          icon: IconPalette,
          href: Routes.AdminGenerations,
          external: false,
        },
        {
          title: m.noddi_admin_orders(),
          icon: IconCreditCard,
          href: Routes.AdminOrders,
          external: false,
        },
      ],
    },
    {
      title: m.noddi_nav_account_settings(),
      icon: IconSettings2,
      href: Routes.SettingsProfile,
      external: false,
    },
  ];
}
