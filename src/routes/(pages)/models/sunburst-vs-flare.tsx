import { ModelSeoPage } from '@/components/seo/model-seo-page';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const path = '/models/sunburst-vs-flare';
const title = 'GPT-Image-2.5 Sunburst vs Flare for App Icons | Sunburst AI';
const description =
  'Compare GPT-Image-2.5 Sunburst and Flare for app icon work using the same prompts, then judge prompt adherence, small-size readability, edit consistency, speed, and cost.';

export const Route = createFileRoute('/(pages)/models/sunburst-vs-flare')({
  head: () =>
    seo(path, {
      title,
      description,
      keywords:
        'sunburst vs flare, gpt-image-2.5 sunburst vs flare, gpt image 2.5 comparison, app icon ai model comparison',
    }),
  component: SunburstVsFlarePage,
});

function SunburstVsFlarePage() {
  return (
    <ModelSeoPage
      eyebrow="MODEL COMPARISON"
      title="GPT-Image-2.5 Sunburst vs Flare for App Icons"
      description={description}
      ctaLabel="Try an app icon brief"
      points={[
        'Use identical prompts and reference inputs so the comparison is reproducible.',
        'Judge each result at 1024px, 128px, 64px, and 32px to expose fragile detail.',
        'Track generation speed, edit consistency, and cost alongside visual quality.',
      ]}
      sections={[
        {
          title: 'Compare the same app-icon brief',
          body: 'A fair model comparison starts with the same product description, subject, style, colors, background direction, and negative constraints. Change one variable at a time. Otherwise a visually stronger result may simply come from a stronger prompt rather than a stronger model.',
        },
        {
          title: 'Small-size readability matters more than gallery impact',
          body: 'App icons are rarely consumed as full-screen artwork. Downscale every candidate and check silhouette, contrast, edge clarity, and whether the core symbol survives. A beautiful 1024px render can still be a weak production icon if its meaning disappears at 32px.',
        },
        {
          title: 'Measure workflow fit, not only first-generation quality',
          body: 'The practical winner is the workflow that reaches a shippable icon with the least rework. Record how well focused edits preserve the chosen concept, how many retries are required, the time to final output, and the cost of reaching a usable master before platform export.',
        },
      ]}
      relatedLinks={[
        {
          href: '/models/gpt-image-2-5-sunburst',
          label: 'GPT-Image-2.5 Sunburst workflow guide',
        },
        {
          href: '/models/gpt-image-2-5-sunburst-app-icon-generator',
          label: 'GPT-Image-2.5 Sunburst App Icon Generator',
        },
      ]}
    />
  );
}
