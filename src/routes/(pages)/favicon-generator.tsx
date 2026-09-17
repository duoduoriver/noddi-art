import { DeveloperExportPage } from '@/components/seo/developer-export-page';
import { LocalIconTool } from '@/components/seo/local-icon-tool';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const path = '/favicon-generator';
const title =
  'Free Favicon Generator for ICO, Apple Touch & PWA Icons | Sunburst AI';
const description =
  'Use this free favicon generator to create favicon.ico, PNG favicons, Apple touch icons, PWA icons, maskable assets, and a web manifest locally in your browser.';

export const Route = createFileRoute('/(pages)/favicon-generator')({
  head: () =>
    seo(path, {
      title,
      description,
      keywords:
        'favicon generator, ai favicon generator, favicon ico generator, pwa icon generator, maskable icon generator, apple touch icon generator',
    }),
  component: FaviconGeneratorPage,
});

function FaviconGeneratorPage() {
  return (
    <DeveloperExportPage
      eyebrow="FAVICON + PWA GENERATOR"
      title="Free Favicon Generator for ICO, Apple Touch, and PWA Icons"
      description={description}
      ctaHref="/generate?platform=web&exportMode=packages"
      ctaLabel="Generate a new icon with AI"
      requirement="Already have artwork? Use the free converter below; 512 × 512 or larger is recommended."
      localTool={<LocalIconTool mode="web" />}
      deliverables={[
        'favicon.ico containing 16px, 32px, and 48px PNG icon entries.',
        'Standalone 16px and 32px favicons plus a 180px Apple touch icon.',
        '192px and 512px PWA icons, maskable variants, manifest.webmanifest, and a usage README.',
      ]}
      fileTree={[
        'web/',
        '├── favicon.ico',
        '├── favicon-16x16.png',
        '├── favicon-32x32.png',
        '├── apple-touch-icon.png',
        '├── icon-192.png',
        '├── icon-512.png',
        '├── icon-192-maskable.png',
        '├── icon-512-maskable.png',
        '├── manifest.webmanifest',
        '└── README.txt',
      ]}
      workflow={[
        {
          title: 'Design for tiny sizes',
          description:
            'Use a simple subject and high contrast so the icon still reads when it becomes a 16px browser favicon.',
        },
        {
          title: 'Generate web variants',
          description:
            'Sunburst AI resizes the selected source and derives maskable artwork that stays inside a conservative safe area.',
        },
        {
          title: 'Wire the package into your site',
          description:
            'Use the included favicon, Apple touch, PWA, and manifest assets instead of maintaining each web icon size separately.',
        },
      ]}
      notes={[
        'Check the 16px and 32px outputs visually; a design that works at app-icon scale can become muddy as a favicon.',
        'Maskable variants use derived foreground artwork and an opaque edge-derived background, so verify the crop against your final brand artwork.',
        'The included README documents the link and manifest tags used by the generated package.',
      ]}
      relatedTools={[
        {
          href: '/favicon-sizes',
          label: 'Favicon Sizes Guide',
          description:
            'Reference ICO, 16px, 32px, Apple touch, and web app icon roles.',
        },
        {
          href: '/pwa-icon-sizes',
          label: 'PWA Icon Sizes Guide',
          description:
            'See the 192px, 512px, any, maskable, and manifest setup.',
        },
        {
          href: '/app-icon-resizer',
          label: 'App Icon Resizer',
          description:
            'Generate a simple set of common PNG sizes from one source image.',
        },
        {
          href: '/ios-app-icon-generator',
          label: 'iOS App Icon Generator',
          description:
            'Generate and export the same product identity for Apple apps.',
        },
        {
          href: '/android-app-icon-generator',
          label: 'Android App Icon Generator',
          description:
            'Create adaptive, themed, and legacy Android launcher assets.',
        },
        {
          href: '/xcode-appiconset-generator',
          label: 'Xcode AppIcon.appiconset Generator',
          description: 'Prepare the Xcode asset-catalog package for iOS.',
        },
      ]}
    />
  );
}
