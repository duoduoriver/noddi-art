import { SketchFrame } from '@/components/noddi/sketch-frame';
import { Button } from '@/components/ui/button';
import { m } from '@/locale/paraglide/messages';
import {
  IconAdjustments,
  IconArrowRight,
  IconCircleCheck,
  IconFolderDown,
  IconLayersIntersect,
  IconMessageCircle,
  IconPackageExport,
  IconPencil,
  IconSparkles,
} from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

const features = [
  {
    title: 'AI Precision',
    description: 'Generate high-quality app icons shaped around your brief.',
    icon: IconSparkles,
    accent: '#9b7bff',
  },
  {
    title: 'Multiple Styles',
    description:
      'Move from minimal to playful without losing your product idea.',
    icon: IconPencil,
    accent: '#ff6fc7',
  },
  {
    title: 'Pixel-Perfect Output',
    description: 'Review polished 1024px originals before you export.',
    icon: IconLayersIntersect,
    accent: '#c6ff5b',
  },
  {
    title: 'Developer-Ready Export',
    description:
      'Export Xcode AppIcon, Android adaptive and themed icons, macOS ICNS, favicons, and PWA assets.',
    icon: IconFolderDown,
    accent: '#6fc1ff',
  },
];

const steps = [
  {
    number: '1.',
    title: 'Describe',
    description: 'Share the product, icon subject, style, and color direction.',
    icon: IconMessageCircle,
  },
  {
    number: '2.',
    title: 'Generate',
    description: 'Compare four original directions made from your brief.',
    icon: IconSparkles,
  },
  {
    number: '3.',
    title: 'Pick',
    description:
      'Choose the strongest concept and prepare an HD master when needed.',
    icon: IconAdjustments,
  },
  {
    number: '4.',
    title: 'Export',
    description: 'Prepare PNG, appiconset, iconset, ICNS, or a project ZIP.',
    icon: IconPackageExport,
  },
];

const developerTools = [
  {
    href: '/app-icon-resizer',
    title: 'Free App Icon Resizer',
    description:
      'Resize one square icon into common 16–1024px PNG outputs locally.',
  },
  {
    href: '/ios-app-icon-generator',
    title: 'iOS App Icon Generator',
    description: 'Generate an icon and export a 1024px Xcode AppIcon package.',
  },
  {
    href: '/android-app-icon-generator',
    title: 'Android App Icon Generator',
    description: 'Adaptive, themed, legacy launcher, and Play Store assets.',
  },
  {
    href: '/android-mipmap-generator',
    title: 'Free Android Mipmap Tool',
    description:
      'Convert existing artwork into mipmap, adaptive, themed, and XML resources.',
  },
  {
    href: '/xcode-appiconset-generator',
    title: 'Free Xcode AppIcon Tool',
    description: 'Create AppIcon.appiconset with the icon and Contents.json.',
  },
  {
    href: '/favicon-generator',
    title: 'Free Favicon + PWA Tool',
    description: 'ICO, PNG favicons, Apple touch, PWA, and maskable icons.',
  },
] as const;

function HomeImage({
  avif,
  webp,
  alt,
  className,
  imageClassName,
}: {
  avif: string;
  webp: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <picture className={className}>
      <source srcSet={avif} type="image/avif" />
      <img src={webp} alt={alt} className={imageClassName} />
    </picture>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-center font-hand text-4xl tracking-wide sm:text-5xl">
      <span className="relative inline-block">
        {children}
        <span
          aria-hidden="true"
          className="brush-highlight absolute -bottom-1 left-[8%] h-3 w-[84%] -rotate-1 bg-[#9b7bff]/55"
        />
      </span>
    </h2>
  );
}

export function HomePage() {
  return (
    <div className="overflow-hidden bg-white">
      <section className="relative isolate flex min-h-[calc(100svh-72px)] w-full items-start justify-center overflow-hidden px-5 pb-20 pt-16 sm:pt-20 lg:min-h-[820px] lg:px-10 lg:pb-24 lg:pt-20">
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#b8a7ff] bg-[#f5f2ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f50ff] shadow-[0_2px_8px_rgba(111,80,255,0.08)]">
            <IconSparkles className="size-3.5" stroke={2} />
            Built for developers
          </div>

          <h1 className="mt-5 max-w-[780px] text-balance font-sans text-5xl font-black leading-[0.94] tracking-[-0.045em] text-[#151515] sm:text-6xl lg:text-[68px] xl:text-[76px]">
            <span className="block">AI App Icon</span>
            <span className="block">Generator for</span>
            <span className="block">iOS, Android</span>
            <span className="block">&amp; Web</span>
          </h1>

          <p className="mt-7 max-w-[650px] text-balance text-base leading-7 text-[#6d6d73] sm:text-lg sm:leading-8">
            Generate four focused concepts, pick the strongest direction, create
            an HD master when you need it, and export developer-ready icon
            assets in minutes.
          </p>

          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
            <Link
              to="/generate"
              className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#111] bg-[#bfff3f] px-7 py-3 text-base font-bold text-[#111] shadow-[0_3px_0_#111] transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-[#b3f532] hover:shadow-[0_5px_0_#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5cff] focus-visible:ring-offset-2 sm:w-auto"
            >
              Generate Your Icon
              <IconArrowRight className="size-4" stroke={2.2} />
            </Link>
            <Link
              to="/app-icon-resizer"
              className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-[#111] bg-white px-7 py-3 text-base font-bold text-[#111] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#f7f7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5cff] focus-visible:ring-offset-2 sm:w-auto"
            >
              Explore Free Tools
            </Link>
          </div>

          <ul className="mt-8 flex max-w-2xl flex-col items-center justify-center gap-3 text-sm font-semibold text-[#252525] sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3">
            {[
              '4 concept variations',
              'iOS · Android · Web · macOS',
              'Free PNG / WebP + Android / Web',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <IconCircleCheck className="size-5 shrink-0 fill-[#bfff3f] text-[#111]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 max-w-[620px] rounded-[22px] border border-[#deded8] bg-[#fbfbf6] px-5 py-4 text-left text-sm leading-6 text-[#707076] shadow-[0_8px_24px_rgba(0,0,0,0.03)] sm:px-6">
            <strong className="font-bold text-[#242424]">
              From idea to shipping asset:
            </strong>{' '}
            the generator and export tools are designed around a developer
            workflow, not a design-suite learning curve.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-10">
        <SectionTitle>BUILT FOR DEVELOPERS</SectionTitle>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <SketchFrame
                key={feature.title}
                color="#111111"
                className="bg-white p-7 text-center"
              >
                <Icon
                  className="mx-auto size-12"
                  style={{ color: feature.accent }}
                  stroke={2.2}
                />
                <h3 className="mt-5 font-hand text-2xl">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </SketchFrame>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-10">
        <SectionTitle>PLATFORM ICON TOOLS</SectionTitle>
        <p className="mx-auto mt-6 max-w-2xl text-center leading-7 text-muted-foreground">
          Start with AI generation or use the free browser-local utilities when
          you already have artwork. Every page maps to real export code, not a
          fake SEO tool.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {developerTools.map((tool) => (
            <a
              key={tool.href}
              href={tool.href}
              className="group border-2 border-black bg-white p-6 shadow-[3px_3px_0_#c6ff5b] transition-transform hover:-translate-y-1"
            >
              <h3 className="font-hand text-2xl">{tool.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {tool.description}
              </p>
              <span className="mt-5 inline-flex items-center text-sm font-bold underline decoration-2 underline-offset-4">
                Open tool page <IconArrowRight className="ml-1 size-4" />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-14 lg:px-10">
        <SectionTitle>HOW IT WORKS</SectionTitle>
        <div className="mt-14 grid gap-10 md:grid-cols-4 md:gap-5">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative text-center">
                {index < steps.length - 1 ? (
                  <IconArrowRight
                    aria-hidden="true"
                    className="absolute -right-5 top-10 hidden size-8 md:block"
                  />
                ) : null}
                <div className="mx-auto flex size-20 items-center justify-center rounded-full border-2 border-black bg-white shadow-[3px_3px_0_#9b7bff]">
                  <Icon className="size-9" />
                </div>
                <h3 className="mt-5 font-hand text-3xl">
                  <span className="text-[#83bd00]">{step.number}</span>{' '}
                  {step.title}
                </h3>
                <p className="mx-auto mt-3 max-w-52 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
        <SketchFrame
          color="#111111"
          className="relative grid min-h-72 overflow-hidden bg-white px-8 py-10 md:aspect-[1398/400] md:min-h-0 md:grid-cols-[0.42fr_1fr_auto] md:items-center md:gap-8 md:px-12"
        >
          <HomeImage
            avif="/home/pricing-bg.avif"
            webp="/home/pricing-bg.webp"
            alt=""
            className="absolute inset-3 z-0 block h-auto w-auto"
            imageClassName="h-full w-full object-contain object-left"
          />
          <div
            className="relative z-10 hidden h-full md:block"
            aria-hidden="true"
          />
          <div className="relative z-10">
            <p className="font-hand text-4xl leading-[0.95] sm:text-5xl">
              READY TO CREATE
              <br />
              ICONIC <span className="bg-[#c6ff5b] px-1">APP ICONS?</span>
            </p>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Create professional icons in seconds. Focus on your product, not
              the pixels.
            </p>
          </div>
          <Button
            render={<Link to="/pricing" />}
            className="relative z-10 mt-7 shrink-0 text-lg font-bold md:mt-0"
            style={{ minHeight: 64 }}
          >
            View Pricing <IconArrowRight className="ml-2 text-[#c6ff5b]" />
          </Button>
        </SketchFrame>
      </section>

      <section id="faqs" className="mx-auto max-w-7xl px-5 pb-24 lg:px-10">
        <div>
          <SectionTitle>{m.noddi_home_faq()}</SectionTitle>
          <div className="mx-auto mt-12 max-w-5xl space-y-3">
            {[
              {
                question: 'What is Sunburst AI?',
                answer:
                  'Sunburst AI is an AI app icon generator for developers. Start from a product brief, compare four icon directions, pick a favorite, prepare an HD master when needed, and export assets for shipping.',
              },
              {
                question: 'Do I need design skills to use Sunburst AI?',
                answer:
                  'No. Describe the app, icon subject, style, and color direction in plain language, then use the generated variations as your starting point.',
              },
              {
                question: 'Which platforms can I export for?',
                answer:
                  'Sunburst AI supports platform packages for iOS, Android, macOS, and Web in addition to single-image exports.',
              },
              {
                question: 'What does the iOS export include?',
                answer:
                  'The iOS workflow prepares Xcode AppIcon assets from a high-resolution master so the icon is ready for an Apple app project.',
              },
              {
                question: 'What does the Android export include?',
                answer:
                  'Android exports cover adaptive icons, themed assets, and Play Store-ready output for a complete mobile icon workflow.',
              },
              {
                question: 'What web assets are included?',
                answer:
                  'Web packages include favicon and PWA assets, including maskable icon output for modern web app manifests.',
              },
            ].map(({ question, answer }) => (
              <details
                key={question}
                className="group rounded-2xl border-2 border-[#8e8e8e] bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-lg font-semibold sm:px-8 sm:text-xl">
                  {question}
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-black text-3xl leading-none transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="border-t border-[#d8d6d0] px-6 py-5 leading-7 text-muted-foreground sm:px-8">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
