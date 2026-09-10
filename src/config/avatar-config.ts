import { m } from '@/locale/paraglide/messages';
import {
  IconCreditCard,
  IconPalette,
  IconSettings2,
} from '@tabler/icons-react';
import { Routes } from '@/lib/routes';
import type { MenuItemConfig } from '../types';
/**
 * Avatar dropdown links
 */
export function getAvatarLinks(): MenuItemConfig[] {
  return [
    {
      title: m.noddi_nav_my_projects(),
      href: Routes.DashboardProjects,
      icon: IconPalette,
    },
    {
      title: m.noddi_nav_credits_billing(),
      href: Routes.DashboardCredits,
      icon: IconCreditCard,
    },
    {
      title: m.noddi_nav_account_settings(),
      href: Routes.SettingsProfile,
      icon: IconSettings2,
    },
  ];
}
