import { Button, buttonVariants } from '@/components/ui/button';
import { PLAN_CATALOG } from '@/credits/catalog';
import { HOME_FAQS } from '@/content/home-faqs';
import { cn } from '@/lib/utils';
import {
  IconArrowRight,
  IconBolt,
  IconBrandAndroid,
  IconBrandApple,
  IconCheck,
  IconCode,
  IconDeviceDesktop,
  IconDownload,
  IconPhoto,
  IconSparkles,
  IconWorld,
} from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';

const workflow = [
  {
    step: '01',
    title: 'Describe',
    copy: 'Tell us what the app does and the visual direction you want.',
    icon: IconCode,
    tone: 'bg-[#f1ebff]',
  },
  {
    step: '02',
    title: 'Generate 4 Concepts',
    copy: 'One generation gives you four distinct icon directions to compare.',
    icon: IconSparkles,
    tone: 'bg-[#f2ffd9]',
  },
  {
    step: '03',
    title: 'Pick Your Favorite',
    copy: 'Choose the strongest variation and keep iterating with references.',
    icon: IconCheck,
    tone: 'bg-[#f1ebff]',
  },
  {
    step: '04',
    title: 'HD Master & Export',
    copy: 'Create the 1024px master when needed, then ship platform-ready assets.',
    icon: IconDownload,
    tone: 'bg-[#f2ffd9]',
  },
] as const;

const exportCards = [
  {
    title: 'iOS',
    subtitle: '1024 HD master · Xcode-ready',
    icon: IconBrandApple,
    files: ['AppIcon.appiconset/', 'AppIcon-1024.png', 'Contents.json'],
  },
  {
    title: 'Android',
    subtitle: 'Adaptive · themed · Play Store',
    icon: IconBrandAndroid,
    files: ['res/mipmap-*/', 'ic_launcher.png', 'adaptive XML + layers'],
  },
  {
    title: 'Web',
    subtitle: 'favicon.ico · PWA · maskable',
    icon: IconWorld,
    files: ['favicon.ico', 'apple-touch-icon.png', 'manifest.webmanifest'],
  },
  {
    title: 'macOS',
    subtitle: 'ICNS · Xcode-ready',
    icon: IconDeviceDesktop,
    files: ['AppIcon.iconset/', 'AppIcon.icns', 'all required sizes'],
  },
] as const;

const freeTools = [
  {
    href: '/favicon-generator',
    title: 'Free Favicon Generator',
    copy: 'Build favicon.ico, Apple touch, PWA, and maskable icon assets.',
    icon: IconWorld,
  },
  {
    href: '/app-icon-resizer',
    title: 'App Icon Resizer',
    copy: 'Resize one square icon into the sizes you actually need.',
    icon: IconPhoto,
  },
  {
    href: '/xcode-appiconset-generator',
    title: 'Xcode AppIcon Generator',
    copy: 'Create a complete AppIcon.appiconset package in the browser.',
    icon: IconBrandApple,
  },
  {
    href: '/android-mipmap-generator',
    title: 'Android Mipmap Generator',
    copy: 'Generate launcher, adaptive, themed, and density assets.',
    icon: IconBrandAndroid,
  },
] as const;

const gallery = [
  ['Finance', '/gallery/finance.webp'],
  ['Productivity', '/gallery/productivity.webp'],
  ['Health', '/gallery/health.webp'],
  ['Music', '/gallery/music.webp'],
  ['Gaming', '/gallery/gaming.webp'],
  ['Nature', '/gallery/nature.webp'],
  ['Travel', '/gallery/travel.webp'],
  ['Education', '/gallery/education.webp'],
  ['Weather', '/gallery/weather.webp'],
] as const;

function PlanCard({
  name,
  price,
  description,
  features,
  popular,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}) {
  return (
    <article
      className={cn(
        'relative flex min-h-full flex-col rounded-2xl border bg-white p-6',
        popular
          ? 'border-2 border-[#7a5cff] shadow-[4px_4px_0_#c6ff5b]'
          : 'border-[#d8d7dd] shadow-[0_10px_30px_rgba(17,17,17,0.05)]'
      )}
    >
      {popular ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#7a5cff] px-4 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">
          Most popular
        </span>
      ) : null}
      <h3 className="text-xl font-extrabold">{name}</h3>
      <p className="mt-2 min-h-10 text-sm text-[#666]">{description}</p>
      <p className="mt-6 text-4xl font-extrabold tracking-[-0.04em]">
        {price}
        {price !== '$0' ? (
          <span className="ml-1 text-sm font-semibold tracking-normal text-[#666]">
            / month
          </span>
        ) : null}
      </p>
      <ul className="mt-6 space-y-3 text-sm">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <IconCheck className="mt-0.5 size-4 shrink-0 rounded-full bg-[#c6ff5b] p-0.5" />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        to="/pricing"
        className={cn(
          buttonVariants({ variant: popular ? 'default' : 'outline' }),
          'mt-7 w-full'
        )}
      >
        {name === 'Free' ? 'Get Started' : `Choose ${name}`}
      </Link>
    </article>
  );
}

export function SunburstHomePage() {
  return (
    <main className="sunburst-shell overflow-hidden">
      <section className="relative isolate flex min-h-[760px] items-center overflow-hidden px-5 py-16 sm:min-h-[820px] sm:px-8 lg:min-h-[850px] lg:py-20">
        <img
          src="/home/hero-background.webp"
          alt=""
          aria-hidden="true"
          width={1663}
          height={895}
          decoding="async"
          fetchPriority="high"
          className="pointer-events-none absolute inset-0 z-0 size-full object-cover object-center"
        />
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <span className="sunburst-eyebrow">
            <IconBolt className="mr-1.5 size-3.5" /> Built for developers
          </span>

          <h1 className="mt-5 max-w-[760px] text-balance text-[2.9rem] font-extrabold leading-[0.98] tracking-[-0.05em] text-[#111] sm:text-[3.9rem] lg:text-[4.6rem]">
            AI App Icon Generator for Developers
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-[#6a6a72] sm:text-lg sm:leading-8">
            Generate four focused concepts, pick the strongest direction, create
            an HD master when you need it, and export developer-ready icon
            assets in minutes.
          </p>

          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <Button
              render={<Link to="/generate" />}
              size="lg"
              className="min-w-[220px] rounded-2xl px-7 shadow-none"
            >
              Generate Your Icon <IconArrowRight className="ml-1 size-4" />
            </Button>
            <Button
              render={<Link to="/app-icon-resizer" />}
              size="lg"
              variant="outline"
              className="min-w-[210px] rounded-2xl border-2 border-black bg-white px-7 shadow-none hover:bg-[#f7f7f4]"
            >
              Explore Free Tools
            </Button>
          </div>

          <div className="mt-8 flex max-w-3xl flex-col items-center justify-center gap-x-8 gap-y-3 text-sm font-bold sm:flex-row sm:flex-wrap">
            {[
              '4 concept variations',
              'iOS · Android · Web · macOS',
              'Free PNG / WebP + Android / Web',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-left">
                <IconCheck className="size-4 shrink-0 rounded-full bg-[#c6ff5b] p-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 max-w-xl rounded-[22px] border border-[#dedde3] bg-white/80 px-5 py-4 text-left text-sm leading-6 text-[#686870] backdrop-blur-sm sm:px-6">
            <span className="font-extrabold text-black">
              From idea to shipping asset:
            </span>{' '}
            the generator and export tools are designed around a developer
            workflow, not a design-suite learning curve.
          </div>
        </div>
      </section>

      <section className="border-y border-[#e6e5e9] bg-[#fbfbf8]">
        <div className="sunburst-section py-16 lg:py-20">
          <div className="text-center">
            <span className="sunburst-eyebrow mx-auto">Simple workflow</span>
            <h2 className="sunburst-section-title mt-4">
              From idea to icon in 4 simple steps
            </h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            {workflow.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.step}
                  className={cn(
                    'relative rounded-2xl border border-[#dedde3] p-6',
                    item.tone
                  )}
                >
                  {index < workflow.length - 1 ? (
                    <IconArrowRight className="absolute -right-5 top-1/2 z-10 hidden size-6 -translate-y-1/2 text-[#7a5cff] lg:block" />
                  ) : null}
                  <div className="flex items-center justify-between">
                    <Icon className="size-7" />
                    <span className="text-xs font-extrabold text-[#7a5cff]">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#666]">
                    {item.copy}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sunburst-section">
        <div className="text-center">
          <h2 className="sunburst-section-title">Developer-Ready Exports</h2>
          <p className="sunburst-copy mx-auto mt-3 max-w-2xl">
            Platform packages are organized the way your project expects them,
            with no manual resizing spreadsheet required.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {exportCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="sunburst-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl border border-[#d8d7dd] bg-[#fbfbf8]">
                    <Icon className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold">{card.title}</h3>
                    <p className="text-xs text-[#666]">{card.subtitle}</p>
                  </div>
                </div>
                <div className="mt-5 rounded-xl border border-[#dedde3] bg-[#f8f8fb] p-4 font-mono text-[11px] leading-6 text-[#51515a]">
                  {card.files.map((file, index) => (
                    <div
                      key={file}
                      className={index === 0 ? 'font-bold text-black' : 'pl-3'}
                    >
                      {index ? '└ ' : ''}
                      {file}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="tools"
        className="sunburst-soft-band border-y border-[#e3dfff]"
      >
        <div className="sunburst-section py-16 lg:py-20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="sunburst-eyebrow">No signup required</span>
              <h2 className="sunburst-section-title mt-4">
                Free Developer Icon Tools
              </h2>
              <p className="mt-2 text-[#666]">
                Useful utilities for when you already have artwork.
              </p>
            </div>
            <span className="text-sm font-extrabold text-[#6548d8]">
              100% browser-local where supported
            </span>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {freeTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  to={tool.href}
                  className="group sunburst-card flex min-h-52 flex-col p-6 transition-transform hover:-translate-y-1"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl border border-[#d8d7dd] bg-white">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold">{tool.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#666]">
                    {tool.copy}
                  </p>
                  <span className="mt-auto pt-5 text-sm font-extrabold text-[#6548d8]">
                    Open Tool{' '}
                    <IconArrowRight className="ml-1 inline size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="gallery" className="sunburst-section">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="sunburst-eyebrow">Style playground</span>
            <h2 className="sunburst-section-title mt-4">Icon Gallery</h2>
            <p className="mt-2 text-[#666]">
              Real examples from the Sunburst AI icon gallery.
            </p>
          </div>
          <Link
            to="/generate"
            className={buttonVariants({ variant: 'outline' })}
          >
            Create yours <IconArrowRight className="ml-1 size-4" />
          </Link>
        </div>
        <div className="mt-9 grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-9">
          {gallery.map(([label, src]) => (
            <figure key={label} className="space-y-2 text-center">
              <img
                src={src}
                alt={`${label} app icon example`}
                width={256}
                height={256}
                loading="lazy"
                decoding="async"
                className="mx-auto aspect-square w-full max-w-24 rounded-[26%] border border-black/10 object-cover shadow-[0_12px_24px_rgba(17,17,17,0.13)]"
              />
              <figcaption className="text-[11px] font-extrabold text-[#303038]">
                {label}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="faqs" className="sunburst-section">
        <div className="mx-auto max-w-3xl">
          <span className="sunburst-eyebrow">FAQ</span>
          <h2 className="sunburst-section-title mt-4">
            App icon generator questions
          </h2>
          <p className="mt-2 text-[#666]">
            What developers usually ask before generating and exporting icons.
          </p>
          <div className="mt-8 space-y-3">
            {HOME_FAQS.map((item) => (
              <details
                key={item.question}
                className="group sunburst-card overflow-hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-base font-extrabold">
                  {item.question}
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-black text-xl leading-none transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="border-t border-[#eceaf3] px-5 py-4 text-sm leading-7 text-[#666]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e6e5e9] bg-[#fbfbf8]">
        <div className="sunburst-section py-16 lg:py-20">
          <div className="text-center">
            <span className="sunburst-eyebrow mx-auto">
              Simple, fair pricing
            </span>
            <h2 className="sunburst-section-title mt-4">
              Plans for every kind of builder
            </h2>
            <p className="mt-2 text-[#666]">
              Start free, then upgrade when HD and Apple exports matter.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
            <PlanCard
              name="Free"
              price="$0"
              description="Enough to try the concept workflow and ship lightweight assets."
              features={[
                '2 signup credits',
                '4 concepts in one generation',
                'PNG / WebP up to 512px',
                'Android / Web packages',
              ]}
            />
            <PlanCard
              name="Pro"
              price={`$${PLAN_CATALOG.pro.cents / 100}`}
              description="For indie developers shipping apps regularly."
              features={[
                '100 credits / month',
                '1024px HD master',
                'iOS + macOS export',
                'All free export formats',
              ]}
              popular
            />
            <PlanCard
              name="Studio"
              price={`$${PLAN_CATALOG.studio.cents / 100}`}
              description="More monthly credits for teams and launch-heavy workflows."
              features={[
                '400 credits / month',
                'Everything in Pro',
                'More room for iteration',
                'Built for heavier usage',
              ]}
            />
          </div>
        </div>
      </section>

      <section className="sunburst-section py-14 lg:py-16">
        <div className="overflow-hidden rounded-3xl border-2 border-[#111111] bg-gradient-to-r from-[#6847f2] to-[#8b63ff] px-7 py-10 text-white shadow-[5px_5px_0_#c6ff5b] sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
              Create a better app icon in minutes
            </h2>
            <p className="mt-2 text-white/75">
              Start with two free credits and keep the export workflow
              developer-friendly.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <Button render={<Link to="/generate" />} size="lg">
              Start Free <IconArrowRight className="ml-1 size-4" />
            </Button>
            <a
              href="/#gallery"
              className="inline-flex h-12 items-center justify-center px-4 text-sm font-extrabold text-white underline underline-offset-4"
            >
              See Example Icons
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
