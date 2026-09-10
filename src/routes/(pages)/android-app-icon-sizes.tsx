import { GuidePage } from '@/components/seo/guide-page';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const path = '/android-app-icon-sizes';
const title = 'Android App Icon Sizes: mdpi to xxxhdpi Guide | Sunburst AI';
const description =
  'Android launcher icon size reference for mdpi through xxxhdpi, adaptive icon layer dimensions, Play Store artwork, and the package Sunburst AI generates.';

export const Route = createFileRoute('/(pages)/android-app-icon-sizes')({
  head: () =>
    seo(path, {
      title,
      description,
      keywords:
        'android app icon sizes, android launcher icon size, mipmap sizes, mdpi hdpi xhdpi icon, android adaptive icon size',
    }),
  component: AndroidAppIconSizesPage,
});

function AndroidAppIconSizesPage() {
  return (
    <GuidePage
      eyebrow="ANDROID APP ICON SIZES"
      title="Android App Icon Sizes from mdpi to xxxhdpi"
      description={description}
      updated="September 9, 2026"
      quickFacts={[
        { label: 'Legacy base', value: '48 dp' },
        { label: 'Adaptive layer', value: '108 dp' },
        { label: 'Safe artwork', value: '≤ 66 dp' },
        { label: 'Play Store', value: '512 px' },
      ]}
      tableTitle="Android launcher and adaptive icon pixel sizes"
      table={{
        headers: [
          'Density',
          'Legacy launcher PNG',
          'Adaptive layer canvas',
          'Scale',
        ],
        rows: [
          ['mdpi', '48 × 48 px', '108 × 108 px', '1×'],
          ['hdpi', '72 × 72 px', '162 × 162 px', '1.5×'],
          ['xhdpi', '96 × 96 px', '216 × 216 px', '2×'],
          ['xxhdpi', '144 × 144 px', '324 × 324 px', '3×'],
          ['xxxhdpi', '192 × 192 px', '432 × 432 px', '4×'],
        ],
      }}
      cta={{
        href: '/android-mipmap-generator',
        label: 'Generate Android mipmap and adaptive icon assets for free',
        description:
          'Upload one existing square icon and build the density folders, adaptive layers, themed monochrome icons, XML, and Play Store image locally.',
      }}
      sections={[
        {
          title:
            'Legacy launcher icons and adaptive icons solve different jobs',
          paragraphs: [
            'Legacy launcher PNGs are density-specific raster files. Adaptive icons instead use foreground and background layers that the launcher can mask into different device shapes and animate on supported surfaces.',
            'Sunburst AI keeps both in the Android package so a developer receives familiar mipmap launcher assets together with API 26+ adaptive resources.',
          ],
        },
        {
          title: 'Why the adaptive layer canvas is larger',
          paragraphs: [
            'Android’s adaptive icon guidance uses a 108×108dp layer canvas. Artwork must leave room around the edges because device launchers can apply different masks and visual effects. The current Sunburst AI exporter fits extracted foreground artwork into a conservative 66/108 safe ratio.',
          ],
        },
        {
          title: 'Current Sunburst AI Android package',
          bullets: [
            'ic_launcher.png and ic_launcher_round.png for mdpi through xxxhdpi.',
            'Foreground, background, and monochrome layers for each density.',
            'API 26+ adaptive icon XML for launcher and round launcher resources.',
            'A separate 512px Play Store image and README.',
          ],
        },
      ]}
      sources={[
        {
          href: 'https://developer.android.com/develop/ui/compose/system/icon_design_adaptive',
          label: 'Android Developers: Adaptive icons',
        },
      ]}
      related={[
        {
          href: '/android-adaptive-icon-safe-zone',
          label: 'Android Adaptive Icon Safe Zone',
          description:
            'See why the 66dp central area matters across launcher masks.',
        },
        {
          href: '/android-mipmap-generator',
          label: 'Free Android Mipmap Generator',
          description: 'Generate the resource folders from an existing image.',
        },
        {
          href: '/android-app-icon-generator',
          label: 'AI Android App Icon Generator',
          description:
            'Create new icon artwork before packaging it for Android.',
        },
      ]}
    />
  );
}
