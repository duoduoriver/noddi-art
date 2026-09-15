import { ModelSeoPage } from '@/components/seo/model-seo-page';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const path = '/models/gpt-image-2-5-sunburst-app-icon-generator';
const title = 'GPT-Image-2.5 Sunburst App Icon Generator | Sunburst AI';
const description =
  'Explore a GPT-Image-2.5 Sunburst app icon workflow, then use Sunburst AI to generate four concepts, pick a favorite, prepare an HD master when needed, and export icons for iOS, Android, macOS, favicon, and PWA.';

export const Route = createFileRoute(
  '/(pages)/models/gpt-image-2-5-sunburst-app-icon-generator'
)({
  head: () =>
    seo(path, {
      title,
      description,
      keywords:
        'gpt-image-2.5 sunburst app icon generator, sunburst icon generator, ai app icon generator, ios app icon generator, android app icon generator',
    }),
  component: SunburstAppIconGeneratorPage,
});

function SunburstAppIconGeneratorPage() {
  return (
    <ModelSeoPage
      eyebrow="APP ICON GENERATOR"
      title="GPT-Image-2.5 Sunburst App Icon Generator Workflow"
      description={description}
      ctaLabel="Generate your app icon"
      points={[
        'Describe the app, symbol, style, color direction, and anything the icon should avoid.',
        'Compare four concepts, then choose the direction that works best at app-icon sizes.',
        'Export the selected icon into platform-specific developer packages instead of resizing files by hand.',
      ]}
      sections={[
        {
          title: 'Generate for the product, not for a generic logo prompt',
          body: 'A useful app icon brief explains what the product does, the symbol users should recognize, the visual mood, and the constraints. That gives the generator a clearer job than simply asking for a modern logo or a beautiful icon.',
        },
        {
          title: 'Review the icon in context',
          body: 'Strong app icons need a clear silhouette, controlled detail, recognizable contrast, and enough breathing room for platform masks. Compare directions first, then pick the candidate that still works when reduced to the size users will actually see on a home screen or browser tab.',
        },
        {
          title: 'Export once for iOS, Android, macOS, and Web',
          body: 'After the visual direction is ready, Sunburst AI turns the selected master into practical assets such as Xcode AppIcon output, Android adaptive and themed icons, macOS ICNS, favicon files, and PWA assets. The export step is part of the product, not an afterthought.',
        },
      ]}
      relatedLinks={[
        {
          href: '/models/gpt-image-2-5-sunburst',
          label: 'GPT-Image-2.5 Sunburst workflow guide',
        },
        {
          href: '/models/sunburst-vs-flare',
          label: 'Sunburst vs Flare for app icons',
        },
      ]}
    />
  );
}
