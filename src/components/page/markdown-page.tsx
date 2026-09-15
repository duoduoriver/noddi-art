import { Markdown } from '@/components/markdown/markdown';
import { Card, CardContent } from '@/components/ui/card';
import type { PageDoc } from '@/lib/pages';
import type { MarkdownResult } from '@/lib/markdown';

export function MarkdownPage({
  page,
  markdown,
}: {
  page: PageDoc;
  markdown: MarkdownResult;
}) {
  const { title, description } = page;

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-4">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <span className="sunburst-eyebrow mx-auto">Sunburst AI · Legal</span>
        <h1 className="text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="text-lg leading-8 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <Card className="border-[#dedde3] bg-white shadow-[0_14px_40px_rgba(17,17,17,0.06)]">
        <CardContent className="p-6 sm:p-8 lg:p-10">
          <Markdown
            markup={markdown.markup}
            className="prose prose-neutral max-w-none prose-headings:font-extrabold prose-headings:tracking-[-0.025em] prose-a:text-[#6548d8]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
