import { m } from '@/locale/paraglide/messages';
import { Routes } from '@/lib/routes';
import type { MenuItemConfig } from '../types';

/** Only currently reachable Sunburst AI product and legal pages are advertised. */
export function getFooterLinks(): MenuItemConfig[] {
  return [
    {
      title: m.nav_product(),
      items: [
        {
          title: m.noddi_nav_generate(),
          href: Routes.Generate,
          external: false,
        },
        { title: m.nav_pricing(), href: Routes.Pricing, external: false },
        { title: m.nav_faq(), href: Routes.Faqs, external: false },
      ],
    },
    {
      title: 'Developer tools',
      items: [
        {
          title: 'App Icon Resizer',
          href: Routes.AppIconResizer,
          external: false,
        },
        {
          title: 'iOS App Icon Generator',
          href: Routes.IosAppIconGenerator,
          external: false,
        },
        {
          title: 'Android App Icon Generator',
          href: Routes.AndroidAppIconGenerator,
          external: false,
        },
        {
          title: 'Android Mipmap Generator',
          href: Routes.AndroidMipmapGenerator,
          external: false,
        },
        {
          title: 'Xcode AppIcon Generator',
          href: Routes.XcodeAppiconsetGenerator,
          external: false,
        },
        {
          title: 'Favicon Generator',
          href: Routes.FaviconGenerator,
          external: false,
        },
      ],
    },
    {
      title: 'Guides',
      items: [
        { title: 'All App Icon Guides', href: Routes.Guides, external: false },
        {
          title: 'iOS App Icon Sizes',
          href: Routes.IosAppIconSizes,
          external: false,
        },
        {
          title: 'Android App Icon Sizes',
          href: Routes.AndroidAppIconSizes,
          external: false,
        },
        {
          title: 'Android Adaptive Safe Zone',
          href: Routes.AndroidAdaptiveIconSafeZone,
          external: false,
        },
        { title: 'Favicon Sizes', href: Routes.FaviconSizes, external: false },
        { title: 'PWA Icon Sizes', href: Routes.PwaIconSizes, external: false },
        {
          title: 'Xcode AppIcon Guide',
          href: Routes.XcodeAppiconsetGuide,
          external: false,
        },
      ],
    },
    {
      title: m.nav_legal(),
      items: [
        {
          title: m.nav_privacy_policy_title(),
          href: Routes.PrivacyPolicy,
          external: false,
        },
        {
          title: m.nav_terms_of_service_title(),
          href: Routes.TermsOfService,
          external: false,
        },
        {
          title: m.nav_cookie_policy_title(),
          href: Routes.CookiePolicy,
          external: false,
        },
      ],
    },
  ];
}
