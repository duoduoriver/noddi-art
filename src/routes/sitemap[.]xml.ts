import { createFileRoute } from '@tanstack/react-router';
import { getBaseUrl } from '@/lib/urls';
import { websiteConfig } from '@/config/website';
import {
  baseLocale,
  isLocalizedPath,
  localeConfig,
  locales,
  localizeHref,
} from '@/lib/locale';

/**
 * Dynamic sitemap.xml
 * https://tanstack.dev/start/latest/docs/framework/react/guide/seo#dynamic-sitemap
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const base = getBaseUrl().replace(/\/$/, '');
        const seoReleaseDate = '2026-09-09';
        const staticUrls: {
          path: string;
          lastmod?: string;
        }[] = [
          { path: '/', lastmod: seoReleaseDate },
          { path: '/generate', lastmod: seoReleaseDate },
          { path: '/models/gpt-image-2-5-sunburst', lastmod: seoReleaseDate },
          {
            path: '/models/gpt-image-2-5-sunburst-app-icon-generator',
            lastmod: seoReleaseDate,
          },
          { path: '/models/sunburst-vs-flare', lastmod: seoReleaseDate },
          { path: '/ios-app-icon-generator', lastmod: seoReleaseDate },
          { path: '/android-app-icon-generator', lastmod: seoReleaseDate },
          { path: '/xcode-appiconset-generator', lastmod: seoReleaseDate },
          { path: '/favicon-generator', lastmod: seoReleaseDate },
          { path: '/app-icon-resizer', lastmod: seoReleaseDate },
          { path: '/android-mipmap-generator', lastmod: seoReleaseDate },
          { path: '/guides', lastmod: seoReleaseDate },
          { path: '/ios-app-icon-sizes', lastmod: seoReleaseDate },
          { path: '/android-app-icon-sizes', lastmod: seoReleaseDate },
          { path: '/android-adaptive-icon-safe-zone', lastmod: seoReleaseDate },
          { path: '/favicon-sizes', lastmod: seoReleaseDate },
          { path: '/pwa-icon-sizes', lastmod: seoReleaseDate },
          { path: '/xcode-appiconset-guide', lastmod: seoReleaseDate },
          { path: '/terms' },
          { path: '/privacy' },
          { path: '/cookie' },
        ];

        if (websiteConfig.payment?.enable) {
          staticUrls.push({ path: '/pricing', lastmod: seoReleaseDate });
        }

        const alternates = (path: string) => {
          if (!isLocalizedPath(path)) {
            return '';
          }

          const localeLinks = locales
            .map((locale) => {
              const href = `${base}${localizeHref(path, { locale })}`;
              return `\n    <xhtml:link rel="alternate" hreflang="${localeConfig[locale].hreflang}" href="${href}" />`;
            })
            .join('');
          const defaultHref = `${base}${localizeHref(path, {
            locale: baseLocale,
          })}`;
          return `${localeLinks}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${defaultHref}" />`;
        };

        const urlEntry = (
          path: string,
          opts?: { changefreq?: string; priority?: string; lastmod?: string }
        ) => {
          const loc = isLocalizedPath(path)
            ? localizeHref(path, { locale: baseLocale })
            : path;
          const lastmod = opts?.lastmod
            ? `\n    <lastmod>${opts.lastmod}</lastmod>`
            : '';
          const changefreq = opts?.changefreq
            ? `\n    <changefreq>${opts.changefreq}</changefreq>`
            : '';
          const priority = opts?.priority
            ? `\n    <priority>${opts.priority}</priority>`
            : '';
          return `  <url>\n    <loc>${base}${loc}</loc>${alternates(path)}${lastmod}${changefreq}${priority}\n  </url>`;
        };

        const staticPart = staticUrls
          .map((u) => urlEntry(u.path, { lastmod: u.lastmod }))
          .join('\n');

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticPart}
</urlset>`;

        return new Response(sitemap, {
          headers: {
            'Content-Type': 'application/xml',
          },
        });
      },
    },
  },
});
