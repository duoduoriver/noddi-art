import Container from '@/components/layout/container';
import { buttonVariants } from '@/components/ui/button';
import { IconArrowRight, IconExternalLink } from '@tabler/icons-react';

type GuideTable = {
  headers: string[];
  rows: string[][];
};

type GuideSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  code?: string;
};

type GuideLink = {
  href: string;
  label: string;
  description?: string;
  external?: boolean;
};

export function GuidePage({
  eyebrow,
  title,
  description,
  updated,
  quickFacts,
  table,
  tableTitle,
  sections,
  cta,
  sources,
  related,
}: {
  eyebrow: string;
  title: string;
  description: string;
  updated: string;
  quickFacts: Array<{ label: string; value: string }>;
  table?: GuideTable;
  tableTitle?: string;
  sections: GuideSection[];
  cta: { href: string; label: string; description: string };
  sources: GuideLink[];
  related: GuideLink[];
}) {
  return (
    <main className="sunburst-shell">
      <Container className="px-5 py-14 lg:px-10 lg:py-20">
        <article className="mx-auto max-w-5xl">
          <header>
            <p className="sunburst-eyebrow">{eyebrow}</p>
            <h1 className="sunburst-heading mt-5 max-w-4xl">{title}</h1>
            <p className="sunburst-copy mt-5 max-w-3xl">{description}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Updated {updated}
            </p>
          </header>

          <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickFacts.map((fact) => (
              <div
                key={fact.label}
                className="rounded-2xl border border-[#d8d7dd] bg-[#fbfbf8] p-4 shadow-[0_8px_22px_rgba(17,17,17,0.04)]"
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {fact.label}
                </p>
                <p className="mt-2 text-lg font-bold">{fact.value}</p>
              </div>
            ))}
          </section>

          <section className="mt-12 rounded-2xl border-2 border-black bg-[#111111] p-6 text-white shadow-[4px_4px_0_#c6ff5b] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c6ff5b]">
              Use the tool
            </p>
            <h2 className="mt-3 text-2xl font-bold">{cta.label}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              {cta.description}
            </p>
            <a
              href={cta.href}
              className={buttonVariants({
                className:
                  'mt-6 min-h-12 bg-white px-5 font-bold text-black hover:bg-[#f1f1ed]',
              })}
            >
              Open free tool
              <IconArrowRight className="ml-2 size-4" />
            </a>
          </section>

          {table ? (
            <section className="mt-16">
              <h2 className="text-3xl font-bold tracking-tight">
                {tableTitle ?? 'Size reference'}
              </h2>
              <div className="mt-6 overflow-x-auto rounded-2xl border border-[#d8d7dd] bg-white shadow-[0_10px_28px_rgba(17,17,17,0.05)]">
                <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                  <thead className="bg-[#f6f5f2]">
                    <tr>
                      {table.headers.map((header) => (
                        <th
                          key={header}
                          className="border-b border-[#d8d7dd] px-4 py-3 font-bold"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, rowIndex) => (
                      <tr
                        key={`${rowIndex}-${row.join('-')}`}
                        className="border-b border-[#d8d6d0] last:border-b-0"
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={`${cellIndex}-${cell}`}
                            className="px-4 py-3 align-top leading-6"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <div className="mt-16 space-y-14">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-3xl font-bold tracking-tight">
                  {section.title}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 leading-8 text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mt-5 space-y-3 leading-7 text-muted-foreground">
                    {section.bullets.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="font-bold text-[#6548d8]">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.code ? (
                  <pre className="mt-6 overflow-x-auto rounded-2xl border-2 border-black bg-[#111111] p-5 text-sm leading-7 text-white shadow-[3px_3px_0_#9b7bff]">
                    <code>{section.code}</code>
                  </pre>
                ) : null}
              </section>
            ))}
          </div>

          <section className="mt-16 grid gap-8 border-t-2 border-black pt-10 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-bold">Official references</h2>
              <div className="mt-4 space-y-3">
                {sources.map((source) => (
                  <a
                    key={source.href}
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-2 text-sm font-semibold underline decoration-2 underline-offset-4"
                  >
                    <span>{source.label}</span>
                    <IconExternalLink className="mt-0.5 size-4 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold">Related tools and guides</h2>
              <div className="mt-4 space-y-4">
                {related.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="sunburst-card block p-4 transition-transform hover:-translate-y-0.5 hover:border-black"
                  >
                    <span className="font-bold underline decoration-2 underline-offset-4">
                      {item.label}
                    </span>
                    {item.description ? (
                      <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </span>
                    ) : null}
                  </a>
                ))}
              </div>
            </div>
          </section>
        </article>
      </Container>
    </main>
  );
}
