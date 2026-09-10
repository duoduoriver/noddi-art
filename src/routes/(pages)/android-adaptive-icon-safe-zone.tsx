import { GuidePage } from '@/components/seo/guide-page';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const path = '/android-adaptive-icon-safe-zone';
const title =
  'Android Adaptive Icon Safe Zone: 108dp & 66dp Guide | Sunburst AI';
const description =
  'Understand the Android adaptive icon 108×108dp layer canvas, conservative 66×66dp safe artwork area, launcher masks, themed monochrome layer, and Sunburst AI export behavior.';

export const Route = createFileRoute(
  '/(pages)/android-adaptive-icon-safe-zone'
)({
  head: () =>
    seo(path, {
      title,
      description,
      keywords:
        'android adaptive icon safe zone, adaptive icon 66 dp, adaptive icon 108 dp, android icon mask, themed app icon safe area',
    }),
  component: AndroidAdaptiveIconSafeZonePage,
});

function AndroidAdaptiveIconSafeZonePage() {
  return (
    <GuidePage
      eyebrow="ANDROID ADAPTIVE ICON SAFE ZONE"
      title="Keep Important Android Icon Artwork Inside the Safe Zone"
      description={description}
      updated="September 9, 2026"
      quickFacts={[
        { label: 'Layer canvas', value: '108 × 108 dp' },
        { label: 'Safe artwork', value: '66 × 66 dp' },
        { label: 'Outer reserve', value: '18 dp / side' },
        { label: 'Themed icon', value: 'Monochrome layer' },
      ]}
      tableTitle="Adaptive icon geometry"
      table={{
        headers: ['Area', 'Dimension', 'How to use it'],
        rows: [
          [
            'Full foreground/background layer',
            '108 × 108 dp',
            'Provide enough canvas for masks and launcher visual effects.',
          ],
          [
            'Conservative central safe zone',
            '66 × 66 dp',
            'Keep the logo or subject you cannot afford to clip inside this area.',
          ],
          [
            'Outer area',
            '18 dp on each side',
            'Treat it as expendable breathing room for masking and motion effects.',
          ],
          [
            'Monochrome artwork',
            'Same adaptive layer system',
            'Keep the essential silhouette simple enough to survive a single-color themed treatment.',
          ],
        ],
      }}
      cta={{
        href: '/android-mipmap-generator',
        label: 'Preview a generated Android adaptive icon package',
        description:
          'Upload an existing icon and let Sunburst AI derive foreground, background, monochrome, density assets, and adaptive XML locally in your browser.',
      }}
      sections={[
        {
          title: 'Why adaptive icons need extra space',
          paragraphs: [
            'Android launchers can apply different masks, so the visible silhouette is not fixed to one rounded-square shape. The layer canvas is deliberately larger than the must-not-clip artwork region.',
            'The safest design approach is to treat the central subject and the background differently: the background should fill the whole layer, while the essential foreground symbol stays comfortably inside the central safe area.',
          ],
        },
        {
          title: 'How Sunburst AI currently fits flattened artwork',
          paragraphs: [
            'The exporter estimates an edge-derived background, extracts a best-effort foreground from the flattened source, and fits that foreground into a 66/108 ratio. This is conservative and aligns with Android’s current design guidance for keeping important logo content inside the safe area.',
          ],
          bullets: [
            'Transparent source artwork usually gives cleaner separation than a complex opaque background.',
            'Automatic extraction is best-effort; always inspect the generated layers in Android Studio.',
            'A simple centered subject with strong negative space survives device masks better than dense edge-to-edge detail.',
          ],
        },
        {
          title: 'Themed icons need a useful monochrome silhouette',
          paragraphs: [
            'Android supports themed app icons through a monochrome layer. A successful monochrome icon is not just the original art converted to grayscale; the important silhouette needs to remain recognizable when the launcher applies a single theme color.',
          ],
        },
      ]}
      sources={[
        {
          href: 'https://developer.android.com/develop/ui/compose/system/icon_design_adaptive',
          label: 'Android Developers: Design adaptive icons',
        },
      ]}
      related={[
        {
          href: '/android-app-icon-sizes',
          label: 'Android App Icon Sizes',
          description:
            'See the mdpi through xxxhdpi pixel dimensions generated from the density scale.',
        },
        {
          href: '/android-mipmap-generator',
          label: 'Free Android Mipmap + Adaptive Tool',
          description:
            'Generate actual layers and resource folders from a square icon.',
        },
        {
          href: '/android-app-icon-generator',
          label: 'AI Android App Icon Generator',
          description:
            'Generate a simpler icon direction designed to survive launcher masks.',
        },
      ]}
    />
  );
}
