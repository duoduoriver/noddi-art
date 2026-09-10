import { DeveloperExportPage } from '@/components/seo/developer-export-page';
import { LocalIconTool } from '@/components/seo/local-icon-tool';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const path = '/android-mipmap-generator';
const title = 'Free Android Mipmap & Adaptive Icon Generator | Sunburst AI';
const description =
  'Upload an existing square icon and generate Android mdpi through xxxhdpi launcher assets, adaptive layers, monochrome themed icons, Play Store artwork, and XML resources.';

export const Route = createFileRoute('/(pages)/android-mipmap-generator')({
  head: () =>
    seo(path, {
      title,
      description,
      keywords:
        'android mipmap generator, android adaptive icon generator, android launcher icon generator, android icon sizes, themed icon generator, android studio icon generator',
    }),
  component: AndroidMipmapGeneratorPage,
});

function AndroidMipmapGeneratorPage() {
  return (
    <DeveloperExportPage
      eyebrow="FREE ANDROID ICON TOOL"
      title="Generate Android Mipmap, Adaptive, and Themed Icon Resources"
      description={description}
      ctaHref="/generate?platform=android&exportMode=packages"
      ctaLabel="Generate a new Android icon with AI"
      requirement="The converter is free, browser-local, and works with an existing square PNG, JPEG, or WebP."
      localTool={<LocalIconTool mode="android" />}
      deliverables={[
        'Legacy ic_launcher and round launcher PNGs for mdpi, hdpi, xhdpi, xxhdpi, and xxxhdpi.',
        'Adaptive foreground/background layers and monochrome assets for themed icons.',
        'API 26+ launcher XML, a 512px Play Store image, and a short integration README.',
      ]}
      fileTree={[
        'android/',
        '├── play_store_512.png',
        '├── README.txt',
        '└── res/',
        '    ├── mipmap-anydpi-v26/',
        '    │   ├── ic_launcher.xml',
        '    │   └── ic_launcher_round.xml',
        '    └── mipmap-mdpi/ … mipmap-xxxhdpi/',
        '        ├── ic_launcher.png',
        '        ├── ic_launcher_round.png',
        '        ├── ic_launcher_foreground.png',
        '        ├── ic_launcher_background.png',
        '        └── ic_launcher_monochrome.png',
      ]}
      workflow={[
        {
          title: 'Upload existing artwork',
          description:
            'Use a square image at 512px or larger when possible. Transparent artwork usually produces cleaner automatic layer separation.',
        },
        {
          title: 'Build density and adaptive assets',
          description:
            'The tool resizes launcher files, estimates an opaque background, extracts foreground artwork, and creates monochrome variants locally.',
        },
        {
          title: 'Review in Android Studio',
          description:
            'Copy the generated res resources into your project and visually check masks, themed icons, and layer separation before release.',
        },
      ]}
      notes={[
        'Foreground extraction is best-effort for flattened artwork. Complex opaque backgrounds can need manual cleanup.',
        'Adaptive icon masks differ by launcher and device, so verify the central subject has enough breathing room.',
        'The tool creates the same package structure used by the Sunburst AI Android export pipeline, but no AI generation is required.',
      ]}
      relatedTools={[
        {
          href: '/android-app-icon-sizes',
          label: 'Android App Icon Sizes Guide',
          description:
            'Check the density-specific pixel sizes the package creates.',
        },
        {
          href: '/android-adaptive-icon-safe-zone',
          label: 'Android Adaptive Icon Safe Zone',
          description:
            'Understand how masks and the 66/108 safe ratio affect foreground artwork.',
        },
        {
          href: '/android-app-icon-generator',
          label: 'AI Android App Icon Generator',
          description:
            'Start from a text brief when you do not already have Android icon artwork.',
        },
        {
          href: '/app-icon-resizer',
          label: 'App Icon Resizer',
          description:
            'Create a simple multi-size PNG ZIP without Android-specific resource folders.',
        },
        {
          href: '/xcode-appiconset-generator',
          label: 'Xcode AppIcon.appiconset Generator',
          description:
            'Build the iOS asset-catalog package from the same icon source.',
        },
      ]}
    />
  );
}
