import { DeveloperExportPage } from '@/components/seo/developer-export-page';
import { LocalIconTool } from '@/components/seo/local-icon-tool';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const path = '/app-icon-resizer';
const title = 'Free App Icon Resizer: 16px to 1024px PNGs | Sunburst AI';
const description =
  'Resize one square PNG, JPEG, or WebP into common app and web icon sizes from 16px through 1024px. Processing happens locally in your browser.';

export const Route = createFileRoute('/(pages)/app-icon-resizer')({
  head: () =>
    seo(path, {
      title,
      description,
      keywords:
        'app icon resizer, icon size generator, resize app icon, app icon sizes generator, png icon resizer, 1024 app icon resizer',
    }),
  component: AppIconResizerPage,
});

function AppIconResizerPage() {
  return (
    <DeveloperExportPage
      eyebrow="FREE APP ICON RESIZER"
      title="Resize One Icon into the Sizes Developers Actually Need"
      description={description}
      ctaHref="/generate"
      ctaLabel="Generate a better icon with AI"
      requirement="The free resizer itself needs no account and uploads nothing to the generation service."
      localTool={<LocalIconTool mode="resizer" />}
      deliverables={[
        'PNG outputs at 16, 32, 48, 64, 128, 180, 192, 256, 512, and 1024 pixels.',
        'A single ZIP so you can keep the common platform sizes together.',
        'Browser-local processing for PNG, JPEG, and WebP source files.',
      ]}
      fileTree={[
        'icons/',
        '├── icon-16x16.png',
        '├── icon-32x32.png',
        '├── icon-48x48.png',
        '├── icon-64x64.png',
        '├── icon-128x128.png',
        '├── icon-180x180.png',
        '├── icon-192x192.png',
        '├── icon-256x256.png',
        '├── icon-512x512.png',
        '└── icon-1024x1024.png',
      ]}
      workflow={[
        {
          title: 'Upload one square icon',
          description:
            'Choose a PNG, JPEG, or WebP. A 1024px source is recommended so the tool can downscale instead of inventing detail.',
        },
        {
          title: 'Resize in your browser',
          description:
            'Sunburst AI decodes the file locally and creates the common raster sizes without sending it through AI generation.',
        },
        {
          title: 'Download one ZIP',
          description:
            'Keep the generated PNGs together, then use the platform-specific tools when you need Xcode, Android, or PWA package structure.',
        },
      ]}
      notes={[
        'Use the largest clean square source you have. Upscaling a small icon cannot restore missing visual detail.',
        'Inspect the 16px, 32px, and 48px results manually because thin lines and small text can disappear after resizing.',
        'For platform-ready folders and metadata, use the Xcode, Android, or favicon/PWA generators instead of only resizing images.',
      ]}
      relatedTools={[
        {
          href: '/ios-app-icon-sizes',
          label: 'iOS App Icon Sizes Guide',
          description:
            'Understand where a 1024px master fits into the modern Xcode workflow.',
        },
        {
          href: '/favicon-sizes',
          label: 'Favicon Sizes Guide',
          description:
            'See which tiny browser, Apple touch, and PWA dimensions matter.',
        },
        {
          href: '/xcode-appiconset-generator',
          label: 'Xcode AppIcon.appiconset Generator',
          description:
            'Turn an existing square icon into an Xcode asset-catalog package.',
        },
        {
          href: '/android-mipmap-generator',
          label: 'Android Mipmap + Adaptive Icon Generator',
          description:
            'Create density folders, adaptive layers, themed icons, and XML resources.',
        },
        {
          href: '/favicon-generator',
          label: 'Favicon + PWA Generator',
          description:
            'Create favicon.ico, Apple touch icons, PWA icons, and a web manifest.',
        },
      ]}
    />
  );
}
