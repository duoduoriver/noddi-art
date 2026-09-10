import { ModelSeoPage } from '@/components/seo/model-seo-page';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const path = '/models/gpt-image-2-5-sunburst';
const title = 'GPT-Image-2.5 Sunburst for App Icon Workflows | Sunburst AI';
const description =
  'Explore GPT-Image-2.5 Sunburst from an app icon workflow perspective: concept generation, focused refinement, and developer-ready export for iOS, Android, macOS, and Web.';

export const Route = createFileRoute('/(pages)/models/gpt-image-2-5-sunburst')({
  head: () =>
    seo(path, {
      title,
      description,
      keywords:
        'gpt-image-2.5 sunburst, gpt image 2.5, sunburst ai, app icon generator, ai icon generator',
    }),
  component: GptImageSunburstPage,
});

function GptImageSunburstPage() {
  return (
    <ModelSeoPage
      eyebrow="GPT-IMAGE-2.5 SUNBURST"
      title="GPT-Image-2.5 Sunburst for App Icon Workflows"
      description={description}
      points={[
        'Start from a concise product brief instead of a generic image prompt.',
        'Evaluate concepts at real app-icon sizes, not only as large 1024px artwork.',
        'Finish the workflow with Xcode, Android, macOS, favicon, and PWA exports.',
      ]}
      sections={[
        {
          title: 'Why app icons need a different image workflow',
          body: 'An attractive image is only the first step. App icons must remain readable at small sizes, avoid fragile detail, work inside platform masks, and survive export into the files developers actually ship. Sunburst AI keeps those downstream requirements visible from concept through export.',
        },
        {
          title: 'From model output to developer assets',
          body: 'Use generation for visual exploration, then refine a selected direction before creating platform packages. The goal is not just a PNG: it is a dependable icon master that can become an iOS AppIcon set, Android adaptive and themed assets, a macOS icon, or web favicon and PWA files.',
        },
        {
          title:
            'Use model names as a starting point, not the product boundary',
          body: 'Image models change quickly. The durable workflow is the layer around them: prompting for an app-specific symbol, reviewing variations, correcting weak details, and exporting production-ready assets. Sunburst AI is designed around that end-to-end developer task.',
        },
      ]}
      relatedLinks={[
        {
          href: '/models/gpt-image-2-5-sunburst-app-icon-generator',
          label: 'GPT-Image-2.5 Sunburst App Icon Generator',
        },
        {
          href: '/models/sunburst-vs-flare',
          label: 'Sunburst vs Flare for app icons',
        },
      ]}
    />
  );
}
