import { m } from '@/locale/paraglide/messages';
import { Routes } from '@/lib/routes';
import type { MenuItemConfig } from '../types';

export function getNavbarLinks(): MenuItemConfig[] {
  return [
    { title: m.noddi_nav_generate(), href: Routes.Generate, external: false },
    { title: m.nav_pricing(), href: Routes.Pricing, external: false },
    { title: 'Tools', href: Routes.Tools, external: false },
    { title: 'Guides', href: Routes.Guides, external: false },
    { title: 'Gallery', href: Routes.Gallery, external: false },
  ];
}
