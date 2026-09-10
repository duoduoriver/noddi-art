import { DeveloperExportPage } from '@/components/seo/developer-export-page';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const path = '/android-app-icon-generator';
const title =
  'Android App Icon Generator: Adaptive & Themed Icons | Sunburst AI';
const description =
  'Generate an Android app icon and export Play Store artwork, legacy launcher sizes, adaptive foreground/background layers, monochrome themed assets, and XML resources.';

export const Route = createFileRoute('/(pages)/android-app-icon-generator')({
  head: () =>
    seo(path, {
      title,
      description,
      keywords:
        'android app icon generator, android adaptive icon generator, android themed icon generator, android launcher icon generator, mipmap generator',
    }),
  component: AndroidAppIconGeneratorPage,
});

function AndroidAppIconGeneratorPage() {
  return (
    <DeveloperExportPage
      eyebrow="ANDROID APP ICON GENERATOR"
      title="Generate Android Launcher, Adaptive, and Themed Icon Assets"
      description={description}
      ctaHref="/generate?platform=android&exportMode=packages"
      ctaLabel="Generate an Android app icon"
      requirement="Android packages can be prepared from a 512px-or-larger square source."
      deliverables={[
        'Play Store 512px artwork and legacy launcher PNGs for mdpi through xxxhdpi.',
        'Adaptive foreground and opaque background layers for each Android density.',
        'Monochrome layers for themed icon support plus API 26+ adaptive icon XML files.',
      ]}
      fileTree={[
        'android/',
        '├── play_store_512.png',
        '├── README.txt',
        '└── res/',
        '    ├── mipmap-anydpi-v26/',
        '    │   ├── ic_launcher.xml',
        '    │   └── ic_launcher_round.xml',
        '    ├── mipmap-mdpi/ … mipmap-xxxhdpi/',
        '    │   ├── ic_launcher.png',
        '    │   ├── ic_launcher_round.png',
        '    │   ├── ic_launcher_foreground.png',
        '    │   ├── ic_launcher_background.png',
        '    │   └── ic_launcher_monochrome.png',
      ]}
      workflow={[
        {
          title: 'Choose a resilient symbol',
          description:
            'Generate an icon with a strong central subject and enough breathing room to survive Android masks and smaller launcher sizes.',
        },
        {
          title: 'Derive platform layers',
          description:
            'Sunburst AI estimates the background, extracts foreground artwork, and fits it into a conservative adaptive-icon safe area.',
        },
        {
          title: 'Export the res package',
          description:
            'Download density-specific launcher files and XML resources, then review the adaptive and themed result in Android Studio.',
        },
      ]}
      notes={[
        'Adaptive foreground/background/monochrome layers are derived automatically from flattened artwork, so visually inspect them before release.',
        'Transparent source artwork usually produces cleaner layer separation than an opaque image with a complex background.',
        'The current package includes legacy launcher files as well as API 26+ adaptive icon XML resources.',
      ]}
      relatedTools={[
        {
          href: '/android-app-icon-sizes',
          label: 'Android App Icon Sizes Guide',
          description:
            'Reference mdpi through xxxhdpi launcher and adaptive layer dimensions.',
        },
        {
          href: '/android-adaptive-icon-safe-zone',
          label: 'Android Adaptive Icon Safe Zone',
          description:
            'Understand the 108dp layer canvas and conservative 66dp central artwork area.',
        },
        {
          href: '/android-mipmap-generator',
          label: 'Free Android Mipmap + Adaptive Icon Generator',
          description:
            'Already have artwork? Convert it locally into Android resource folders and layers.',
        },
        {
          href: '/ios-app-icon-generator',
          label: 'iOS App Icon Generator',
          description:
            'Prepare the Apple side of the same cross-platform app identity.',
        },
        {
          href: '/xcode-appiconset-generator',
          label: 'Xcode AppIcon.appiconset Generator',
          description: 'See the exact iOS asset-catalog export structure.',
        },
        {
          href: '/favicon-generator',
          label: 'Favicon Generator',
          description:
            'Extend the same icon direction to browser and PWA surfaces.',
        },
      ]}
    />
  );
}
