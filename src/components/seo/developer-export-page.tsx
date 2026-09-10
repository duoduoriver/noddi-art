import Container from '@/components/layout/container';
import { buttonVariants } from '@/components/ui/button';
import { IconArrowRight, IconCheck } from '@tabler/icons-react';
import type { ReactNode } from 'react';

type RelatedTool = {
  href: string;
  label: string;
  description: string;
};

type WorkflowStep = {
  title: string;
  description: string;
};

export function DeveloperExportPage({
  eyebrow,
  title,
  description,
  ctaHref,
  ctaLabel,
  requirement,
  deliverables,
  fileTree,
  workflow,
  notes,
  relatedTools,
  localTool,
}: {
  eyebrow: string;
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  requirement: string;
  deliverables: string[];
  fileTree: string[];
  workflow: WorkflowStep[];
  notes: string[];
  relatedTools: RelatedTool[];
  localTool?: ReactNode;
}) {
  return (
    <main className="bg-white text-[#111111]">
      <Container className="px-5 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <header className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#6548d8]">
                {eyebrow}
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
                {description}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href={ctaHref}
                  className={buttonVariants({
                    className: 'brush-button min-h-12 px-5 font-bold',
                  })}
                >
                  {ctaLabel}
                  <IconArrowRight className="ml-2 size-4 text-[#c6ff5b]" />
                </a>
                <span className="text-sm text-muted-foreground">
                  {requirement}
                </span>
              </div>
            </div>

            <aside className="border-2 border-black bg-[#f7f7f3] p-6 shadow-[5px_5px_0_#c6ff5b]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                What the export includes
              </p>
              <ul className="mt-5 space-y-3">
                {deliverables.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6">
                    <IconCheck className="mt-0.5 size-5 shrink-0 text-[#6548d8]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </header>

          {localTool}

          <section className="mt-20 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Output structure
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                Files you can actually ship
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
                These paths mirror the package Sunburst AI currently builds from
                the selected icon master, so this page describes the real export
                rather than a hypothetical feature list.
              </p>
            </div>
            <pre className="overflow-x-auto rounded-xl border-2 border-black bg-[#111111] p-5 text-sm leading-7 text-white shadow-[5px_5px_0_#9b7bff]">
              <code>{fileTree.join('\n')}</code>
            </pre>
          </section>

          <section className="mt-20">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Workflow
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              From brief to developer package
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {workflow.map((step, index) => (
                <article key={step.title} className="border-2 border-black p-6">
                  <span className="text-sm font-bold text-[#6548d8]">
                    0{index + 1}
                  </span>
                  <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-20 grid gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-[#d8d6d0] bg-[#f7f7f3] p-6">
              <h2 className="text-2xl font-bold">Before you ship</h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
                {notes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Related tools and guides</h2>
              <div className="mt-5 space-y-4">
                {relatedTools.map((tool) => (
                  <a
                    key={tool.href}
                    href={tool.href}
                    className="block rounded-xl border-2 border-black p-5 transition-transform hover:-translate-y-0.5"
                  >
                    <span className="font-bold underline decoration-2 underline-offset-4">
                      {tool.label}
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                      {tool.description}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}
