import { DeveloperExportPage } from '@/components/seo/developer-export-page';
import { LocalIconTool } from '@/components/seo/local-icon-tool';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const path = '/xcode-appiconset-generator';
const title = 'Free Xcode AppIcon.appiconset Generator | Sunburst AI';
const description =
  'Upload an existing square icon and create an Xcode AppIcon.appiconset with a 1024px icon and Contents.json locally in your browser, free and without an account.';

export const Route = createFileRoute('/(pages)/xcode-appiconset-generator')({
  head: () =>
    seo(path, {
      title,
      description,
      keywords:
        'xcode appicon generator, appiconset generator, xcode app icon generator, contents json appicon, ios asset catalog icon',
    }),
  component: XcodeAppiconsetGeneratorPage,
});

function XcodeAppiconsetGeneratorPage() {
  return (
    <DeveloperExportPage
      eyebrow="XCODE APPICONSET"
      title="Create an AppIcon.appiconset Without Hand-Writing Contents.json"
      description={description}
      ctaHref="/generate?platform=ios&exportMode=packages"
      ctaLabel="Generate a new icon with AI"
      requirement="Already have artwork? Use the free converter below; 1024 × 1024 is recommended."
      localTool={<LocalIconTool mode="ios" />}
      deliverables={[
        'The AppIcon.appiconset directory structure expected by the current Sunburst AI Xcode export.',
        'AppIcon-1024.png generated from the selected HD master.',
        'Contents.json with the universal iOS image entry already wired to the file.',
      ]}
      fileTree={[
        'AppIcon.appiconset/',
        '├── AppIcon-1024.png',
        '└── Contents.json',
        '',
        'Contents.json → universal · ios · 1024x1024',
      ]}
      workflow={[
        {
          title: 'Pick the icon first',
          description:
            'Generate four concepts and choose the design you actually want to ship before worrying about asset-catalog plumbing.',
        },
        {
          title: 'Create the HD master',
          description:
            'The iOS package is built from the shared 1024px production master so the source is large enough for the AppIcon asset.',
        },
        {
          title: 'Drop it into Xcode',
          description:
            'Download the package and move the AppIcon.appiconset into the appropriate asset catalog in your project.',
        },
      ]}
      notes={[
        'If you already have an app icon design, use the free browser-local converter above; no AI generation or account is required for that conversion.',
        'Check the generated asset catalog inside Xcode before release so you catch any project-specific configuration differences.',
        'The package intentionally keeps the source structure simple: one universal 1024px image plus Contents.json.',
      ]}
      relatedTools={[
        {
          href: '/xcode-appiconset-guide',
          label: 'Xcode AppIcon.appiconset Guide',
          description:
            'Learn what the folder and Contents.json do inside an asset catalog.',
        },
        {
          href: '/ios-app-icon-sizes',
          label: 'iOS App Icon Sizes Guide',
          description:
            'See the current 1024px Single Size workflow and when smaller variants are generated.',
        },
        {
          href: '/ios-app-icon-generator',
          label: 'iOS App Icon Generator',
          description:
            'Start earlier in the workflow with AI generation, concept selection, and HD preparation.',
        },
        {
          href: '/app-icon-resizer',
          label: 'App Icon Resizer',
          description:
            'Create common PNG sizes from one square source before packaging.',
        },
        {
          href: '/android-app-icon-generator',
          label: 'Android App Icon Generator',
          description:
            'Create Android launcher and adaptive icon resources from the same product direction.',
        },
        {
          href: '/favicon-generator',
          label: 'Favicon Generator',
          description:
            'Prepare browser, Apple touch, PWA, and maskable web icon assets.',
        },
      ]}
    />
  );
}
