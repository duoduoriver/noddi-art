import { GuidePage } from '@/components/seo/guide-page';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const path = '/xcode-appiconset-guide';
const title = 'Xcode AppIcon.appiconset & Contents.json Guide | Sunburst AI';
const description =
  'Understand Xcode AppIcon.appiconset, Contents.json, the modern single-size 1024px iOS app icon workflow, and how to generate the package from an existing icon.';

export const Route = createFileRoute('/(pages)/xcode-appiconset-guide')({
  head: () =>
    seo(path, {
      title,
      description,
      keywords:
        'appicon appiconset guide, contents json app icon, xcode appiconset, xcode asset catalog app icon, appicon contents json',
    }),
  component: XcodeAppiconsetGuidePage,
});

function XcodeAppiconsetGuidePage() {
  return (
    <GuidePage
      eyebrow="XCODE APPICONSET GUIDE"
      title="How AppIcon.appiconset and Contents.json Fit into Xcode"
      description={description}
      updated="September 9, 2026"
      quickFacts={[
        { label: 'Folder', value: 'AppIcon.appiconset' },
        { label: 'Metadata', value: 'Contents.json' },
        { label: 'iOS master', value: '1024 × 1024 px' },
        { label: 'Container', value: 'Assets.xcassets' },
      ]}
      cta={{
        href: '/xcode-appiconset-generator',
        label: 'Generate AppIcon.appiconset from your existing icon',
        description:
          'Choose a square image and build the package locally in your browser. No account or AI generation is required for the conversion.',
      }}
      sections={[
        {
          title: 'What AppIcon.appiconset is',
          paragraphs: [
            'An Xcode asset catalog groups related resources into named sets. AppIcon.appiconset is the app icon set that holds icon imagery and a Contents.json file describing how Xcode should interpret those files.',
            'For a modern iOS Single Size workflow, Xcode can generate the smaller icon variations from one 1024×1024 image rather than requiring a manually maintained PNG for every destination size.',
          ],
        },
        {
          title: 'The package Sunburst AI currently creates',
          code: 'AppIcon.appiconset/\n├── AppIcon-1024.png\n└── Contents.json',
          paragraphs: [
            'The generated Contents.json identifies the 1024px image as a universal iOS app icon asset. Keep the folder together when you add it to your asset catalog so the metadata continues to reference the expected file.',
          ],
        },
        {
          title: 'Where it goes in a project',
          bullets: [
            'Open the relevant asset catalog, commonly Assets.xcassets.',
            'Replace or add the AppIcon set for the target you intend to ship.',
            'Confirm the target’s Primary App Icon Set Name points at the correct set.',
            'Build and inspect the icon on real small surfaces before App Store submission.',
          ],
        },
        {
          title: 'Current Sunburst AI Contents.json shape',
          code: '{\n  "images": [\n    {\n      "filename": "AppIcon-1024.png",\n      "idiom": "universal",\n      "platform": "ios",\n      "size": "1024x1024"\n    }\n  ],\n  "info": { "author": "sunburst-ai", "version": 1 }\n}',
        },
      ]}
      sources={[
        {
          href: 'https://developer.apple.com/documentation/xcode/configuring-your-app-icon',
          label: 'Apple: Configuring your app icon using an asset catalog',
        },
      ]}
      related={[
        {
          href: '/ios-app-icon-sizes',
          label: 'iOS App Icon Sizes',
          description:
            'Understand the 1024px source and modern Single Size workflow.',
        },
        {
          href: '/xcode-appiconset-generator',
          label: 'Free Xcode AppIcon Generator',
          description: 'Build the actual folder and Contents.json locally.',
        },
        {
          href: '/ios-app-icon-generator',
          label: 'AI iOS App Icon Generator',
          description:
            'Create new artwork first when you do not have an icon yet.',
        },
      ]}
    />
  );
}
