import { DeveloperExportPage } from '@/components/seo/developer-export-page';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const path = '/ios-app-icon-generator';
const title =
  'iOS App Icon Generator for Xcode & App Store | Sunburst AI';
const description =
  'Generate four AI iOS app-icon concepts, pick the strongest direction, prepare a 1024px HD master, and export an Xcode AppIcon package ready for App Store submission.';

export const Route = createFileRoute('/(pages)/ios-app-icon-generator')({
  head: () =>
    seo(path, {
      title,
      description,
      keywords:
        'ios app icon generator, iphone app icon generator, ai ios icon generator, app store icon generator, xcode app icon, appiconset generator',
    }),
  component: IosAppIconGeneratorPage,
});

function IosAppIconGeneratorPage() {
  return (
    <DeveloperExportPage
      eyebrow="IOS APP ICON GENERATOR"
      title="iOS App Icon Generator for Xcode and the App Store"
      description={description}
      ctaHref="/generate?platform=ios&exportMode=packages"
      ctaLabel="Generate an iOS app icon"
      requirement="iOS export uses a 1024 × 1024 HD master."
      deliverables={[
        'A 1024 × 1024 production icon master for the iOS package.',
        'An AppIcon.appiconset folder ready to add to an Xcode asset catalog.',
        'A Contents.json file that references the universal iOS AppIcon image.',
      ]}
      fileTree={[
        'ios/',
        '└── AppIcon.appiconset/',
        '    ├── AppIcon-1024.png',
        '    └── Contents.json',
      ]}
      workflow={[
        {
          title: 'Describe the app',
          description:
            'Start with the product purpose, icon subject, style direction, colors, and details to avoid.',
        },
        {
          title: 'Pick one direction',
          description:
            'Compare concepts at small sizes, choose the clearest silhouette, and create the HD master once the design is ready.',
        },
        {
          title: 'Export for Xcode',
          description:
            'Choose the iOS developer package and download the AppIcon.appiconset instead of assembling the asset catalog by hand.',
        },
      ]}
      notes={[
        'Review the icon at small home-screen sizes before shipping; fine detail that looks good at 1024px can disappear when reduced.',
        'Keep important artwork away from fragile edges so the composition survives different presentation contexts.',
        'The current Sunburst AI iOS package uses one 1024px universal AppIcon plus Contents.json.',
      ]}
      relatedTools={[
        {
          href: '/ios-app-icon-sizes',
          label: 'iOS App Icon Sizes Guide',
          description:
            'See why the current Xcode workflow can start from one 1024px source.',
        },
        {
          href: '/xcode-appiconset-guide',
          label: 'Xcode AppIcon.appiconset Guide',
          description:
            'Understand the asset-catalog folder and Contents.json before you ship.',
        },
        {
          href: '/app-icon-resizer',
          label: 'App Icon Resizer',
          description:
            'Resize an existing square icon into common PNG dimensions locally.',
        },
        {
          href: '/xcode-appiconset-generator',
          label: 'Xcode AppIcon.appiconset Generator',
          description:
            'See the exact asset-catalog package and how it is structured.',
        },
        {
          href: '/android-app-icon-generator',
          label: 'Android App Icon Generator',
          description:
            'Generate adaptive, themed, legacy launcher, and Play Store assets.',
        },
        {
          href: '/favicon-generator',
          label: 'Favicon Generator',
          description:
            'Turn the same visual direction into favicon and PWA assets.',
        },
      ]}
    />
  );
}
