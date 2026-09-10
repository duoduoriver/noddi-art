import { m } from '@/locale/paraglide/messages';
import { Routes } from '@/lib/routes';
import type { MenuItemConfig } from '../types';

export function getNavbarLinks(): MenuItemConfig[] {
  return [
    { title: m.noddi_nav_generate(), href: Routes.Generate, external: false },
    { title: m.nav_pricing(), href: Routes.Pricing, external: false },
    { title: m.nav_faq(), href: Routes.Faqs, external: false },
  ];
}
