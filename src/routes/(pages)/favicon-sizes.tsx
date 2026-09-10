import { GuidePage } from '@/components/seo/guide-page';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const path = '/favicon-sizes';
const title =
  'Favicon Sizes: ICO, 16px, 32px & Apple Touch Guide | Sunburst AI';
const description =
  'Practical favicon size reference for modern websites: favicon.ico, 16×16 and 32×32 PNGs, Apple touch icon, PWA icons, and the Sunburst AI web package.';

export const Route = createFileRoute('/(pages)/favicon-sizes')({
  head: () =>
    seo(path, {
      title,
      description,
      keywords:
        'favicon sizes, favicon size, favicon ico sizes, apple touch icon size, favicon 16x16 32x32, website icon sizes',
    }),
  component: FaviconSizesPage,
});

function FaviconSizesPage() {
  return (
    <GuidePage
      eyebrow="FAVICON SIZES"
      title="Favicon Sizes for Browsers, Apple Touch, and PWA"
      description={description}
      updated="September 9, 2026"
      quickFacts={[
        { label: 'Tiny favicon', value: '16 × 16 px' },
        { label: 'Common PNG', value: '32 × 32 px' },
        { label: 'ICO bundle', value: '16 / 32 / 48' },
        { label: 'Apple touch', value: '180 × 180 px' },
      ]}
      tableTitle="Web icon sizes in the Sunburst AI package"
      table={{
        headers: ['Asset', 'Size', 'Typical role'],
        rows: [
          [
            'favicon.ico',
            '16, 32, 48 px entries',
            'Broad browser favicon compatibility in one ICO container.',
          ],
          [
            'favicon-16x16.png',
            '16 × 16 px',
            'Very small browser/tab presentation.',
          ],
          [
            'favicon-32x32.png',
            '32 × 32 px',
            'Higher-density browser favicon use.',
          ],
          [
            'apple-touch-icon.png',
            '180 × 180 px',
            'Apple touch/home-screen shortcut icon.',
          ],
          [
            'PWA icons',
            '192 × 192 and 512 × 512 px',
            'Installable web app manifest icons and maskable variants.',
          ],
        ],
      }}
      cta={{
        href: '/favicon-generator',
        label: 'Generate the favicon + PWA package for free',
        description:
          'Upload one square icon and download ICO, PNG favicons, Apple touch, PWA, maskable, manifest, and README files without an account.',
      }}
      sections={[
        {
          title: 'A favicon is not just one magic size',
          paragraphs: [
            'Browsers and operating systems can consume different icon formats and dimensions. A small favicon still needs to remain recognizable at 16px, while installation and home-screen surfaces benefit from much larger artwork.',
            'That is why the Sunburst AI web export keeps the tiny browser assets and the PWA assets in the same package instead of treating them as unrelated tasks.',
          ],
        },
        {
          title: 'Design differently for 16px',
          bullets: [
            'Avoid small text, thin outlines, and subtle interior texture.',
            'Use a strong silhouette and high contrast so the shape survives downscaling.',
            'Inspect the actual 16px and 32px outputs instead of trusting a large 1024px preview.',
          ],
        },
        {
          title: 'HTML link tags included in the generated README',
          code: '<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="manifest" href="/manifest.webmanifest">',
        },
      ]}
      sources={[
        {
          href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/link',
          label: 'MDN: <link> element and icon examples',
        },
        {
          href: 'https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons',
          label: 'MDN: Define your PWA app icons',
        },
      ]}
      related={[
        {
          href: '/pwa-icon-sizes',
          label: 'PWA Icon Sizes',
          description:
            'Go deeper on 192px, 512px, purpose, and maskable icons.',
        },
        {
          href: '/favicon-generator',
          label: 'Free Favicon Generator',
          description:
            'Generate the web icon package locally from existing artwork.',
        },
        {
          href: '/app-icon-resizer',
          label: 'Free App Icon Resizer',
          description:
            'Create additional raster sizes when you only need PNG outputs.',
        },
      ]}
    />
  );
}
