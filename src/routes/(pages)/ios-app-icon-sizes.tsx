import { GuidePage } from '@/components/seo/guide-page';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const path = '/ios-app-icon-sizes';
const title = 'iOS App Icon Sizes: 1024px Xcode Guide | Sunburst AI';
const description =
  'Current iOS app icon size guidance for Xcode: when a single 1024×1024 source is enough, how Xcode generates smaller variants, and how to package AppIcon.appiconset.';

export const Route = createFileRoute('/(pages)/ios-app-icon-sizes')({
  head: () =>
    seo(path, {
      title,
      description,
      keywords:
        'ios app icon sizes, iphone app icon size, xcode app icon size, 1024 app icon, app store icon size',
    }),
  component: IosAppIconSizesPage,
});

function IosAppIconSizesPage() {
  return (
    <GuidePage
      eyebrow="IOS APP ICON SIZES"
      title="iOS App Icon Sizes: Start with a 1024 × 1024 Master"
      description={description}
      updated="September 9, 2026"
      quickFacts={[
        { label: 'Master', value: '1024 × 1024 px' },
        { label: 'Shape', value: 'Square source' },
        { label: 'Modern Xcode', value: 'Single Size supported' },
        { label: 'Sunburst export', value: 'AppIcon.appiconset' },
      ]}
      tableTitle="Modern iOS icon workflow"
      table={{
        headers: ['Stage', 'Size', 'What happens'],
        rows: [
          [
            'Design master',
            '1024 × 1024 px',
            'Keep the source square and review it at small sizes before shipping.',
          ],
          [
            'Xcode asset catalog',
            'Single 1024 × 1024 image',
            'Current Xcode can auto-generate the smaller iOS and iPadOS icon variations from one source.',
          ],
          [
            'App Store imagery',
            '1024 × 1024 source',
            'The App Store icon is supplied through the app icon set for iOS distribution.',
          ],
          [
            'Runtime surfaces',
            'Smaller generated variants',
            'The system uses scaled variants in places such as Home Screen, Settings, notifications, and search.',
          ],
        ],
      }}
      cta={{
        href: '/xcode-appiconset-generator',
        label: 'Generate an Xcode AppIcon.appiconset for free',
        description:
          'Already have a 1024px square icon? Build the AppIcon.appiconset and Contents.json locally in your browser.',
      }}
      sections={[
        {
          title: 'Why one 1024px icon can be enough now',
          paragraphs: [
            'Apple’s current Xcode documentation says iOS and iPadOS app icon variations can be generated from a single 1024×1024 image. In the asset catalog, the Single Size workflow lets Xcode derive the smaller variants instead of requiring you to maintain every legacy slot manually.',
            'That makes the production task simpler: spend your design effort on a clean 1024px master, then inspect the result at realistic small sizes before you ship.',
          ],
        },
        {
          title: 'When you may still want individual variants',
          bullets: [
            'You need different artwork detail at small sizes instead of a straight scaled version.',
            'An older project is already configured with an All Sizes app icon set and you want to preserve that workflow.',
            'Your icon uses very thin strokes, tiny text, or dense texture that becomes unreadable after automatic scaling.',
          ],
        },
        {
          title: 'What Sunburst AI currently exports for iOS',
          paragraphs: [
            'The current Sunburst AI iOS package uses a 1024×1024 HD master and creates an AppIcon.appiconset containing the universal iOS image plus Contents.json. This mirrors the modern single-size Xcode workflow rather than generating a large set of legacy raster slots.',
          ],
          code: 'AppIcon.appiconset/\n├── AppIcon-1024.png\n└── Contents.json',
        },
      ]}
      sources={[
        {
          href: 'https://developer.apple.com/documentation/xcode/configuring-your-app-icon',
          label: 'Apple: Configuring your app icon using an asset catalog',
        },
        {
          href: 'https://developer.apple.com/design/human-interface-guidelines/app-icons',
          label: 'Apple Human Interface Guidelines: App icons',
        },
      ]}
      related={[
        {
          href: '/xcode-appiconset-guide',
          label: 'Xcode AppIcon.appiconset Guide',
          description:
            'Understand the folder and Contents.json that Xcode reads.',
        },
        {
          href: '/app-icon-resizer',
          label: 'Free App Icon Resizer',
          description: 'Preview the same artwork at common small PNG sizes.',
        },
        {
          href: '/ios-app-icon-generator',
          label: 'AI iOS App Icon Generator',
          description:
            'Create a new icon when you do not already have finished artwork.',
        },
      ]}
    />
  );
}
