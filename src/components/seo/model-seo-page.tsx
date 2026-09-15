import Container from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

type SeoSection = {
  title: string;
  body: string;
};

type RelatedLink = {
  href: string;
  label: string;
};

export function ModelSeoPage({
  eyebrow,
  title,
  description,
  points,
  sections,
  relatedLinks,
  ctaLabel = 'Generate an app icon',
}: {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  sections: SeoSection[];
  relatedLinks: RelatedLink[];
  ctaLabel?: string;
}) {
  return (
    <main className="sunburst-shell">
      <Container className="px-5 py-14 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="sunburst-eyebrow">{eyebrow}</p>
          <h1 className="sunburst-heading mt-5 max-w-4xl">{title}</h1>
          <p className="sunburst-copy mt-5 max-w-3xl">{description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              render={<Link to="/generate" />}
              className="min-h-12 font-bold"
            >
              {ctaLabel}
            </Button>
            <a
              href="#details"
              className="inline-flex min-h-12 items-center rounded-md border-2 border-black px-5 font-bold"
            >
              Read the workflow
            </a>
          </div>

          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {points.map((point) => (
              <li
                key={point}
                className="sunburst-card-strong p-5 text-sm leading-6"
              >
                {point}
              </li>
            ))}
          </ul>

          <p className="mt-8 rounded-2xl border border-[#d8d7dd] bg-[#fbfbf8] p-4 text-sm leading-6 text-muted-foreground">
            Sunburst AI is an independent developer tool and is not affiliated
            with OpenAI. Availability of specific underlying image models may
            vary by generation configuration.
          </p>

          <div id="details" className="mt-16 space-y-12">
            {sections.map((section) => (
              <section key={section.title} className="max-w-3xl">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {section.title}
                </h2>
                <p className="mt-4 text-base leading-8 text-muted-foreground">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          <section className="mt-16 border-t-2 border-black pt-8">
            <h2 className="text-xl font-bold">Related Sunburst AI pages</h2>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
              {relatedLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="underline underline-offset-4"
                >
                  {link.label} →
                </a>
              ))}
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}
