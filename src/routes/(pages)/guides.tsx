import Container from '@/components/layout/container';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const path = '/guides';
const title = 'App Icon Developer Guides | Sunburst AI';
const description =
  'Practical app icon size, Xcode, Android adaptive icon, favicon, and PWA guides for developers shipping iOS, Android, and web apps.';

const guides = [
  {
    href: '/ios-app-icon-sizes',
    title: 'iOS App Icon Sizes',
    description:
      'Modern Xcode single-size workflow, 1024px master, and App Store icon notes.',
  },
  {
    href: '/android-app-icon-sizes',
    title: 'Android App Icon Sizes',
    description:
      'mdpi through xxxhdpi launcher sizes plus adaptive layer dimensions.',
  },
  {
    href: '/android-adaptive-icon-safe-zone',
    title: 'Android Adaptive Icon Safe Zone',
    description:
      'Understand the 108dp layer canvas, conservative 66dp safe zone, and masks.',
  },
  {
    href: '/favicon-sizes',
    title: 'Favicon Sizes',
    description: 'ICO, 16px, 32px, Apple touch icon, and web app icon choices.',
  },
  {
    href: '/pwa-icon-sizes',
    title: 'PWA Icon Sizes',
    description: '192px, 512px, maskable purpose, and manifest examples.',
  },
  {
    href: '/xcode-appiconset-guide',
    title: 'Xcode AppIcon.appiconset Guide',
    description:
      'What AppIcon.appiconset and Contents.json do in an asset catalog.',
  },
] as const;

export const Route = createFileRoute('/(pages)/guides')({
  head: () => seo(path, { title, description }),
  component: GuidesPage,
});

function GuidesPage() {
  return (
    <main className="bg-white text-[#111111]">
      <Container className="px-5 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#6548d8]">
            DEVELOPER GUIDES
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            App Icon Guides for Shipping, Not Just Designing
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
            Use these references when you need the correct icon master, platform
            package, safe zone, or web manifest setup. Every guide links back to
            a working Sunburst AI utility where the workflow can be automated.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <a
                key={guide.href}
                href={guide.href}
                className="border-2 border-black bg-white p-6 shadow-[4px_4px_0_#c6ff5b] transition-transform hover:-translate-y-1"
              >
                <h2 className="text-xl font-bold">{guide.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {guide.description}
                </p>
                <span className="mt-5 inline-block text-sm font-bold underline decoration-2 underline-offset-4">
                  Read guide →
                </span>
              </a>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
