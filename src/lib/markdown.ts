import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeStringify from 'rehype-stringify';

export type MarkdownResult = {
  markup: string;
};

type HastNode = {
  type?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function mergeClassName(value: unknown, className: string): string | string[] {
  if (Array.isArray(value)) {
    return [...value.map(String), ...className.split(' ')];
  }
  if (typeof value === 'string' && value.length > 0) {
    return `${value} ${className}`;
  }
  return className;
}

function enhanceMarkdownHtml() {
  return (tree: HastNode) => {
    const visit = (node: HastNode) => {
      if (node.type === 'element') {
        node.properties = node.properties ?? {};
        if (node.tagName === 'a') {
          const href = node.properties.href;
          if (typeof href === 'string' && href.startsWith('/')) {
            node.properties.className = mergeClassName(
              node.properties.className,
              'underline-offset-4 hover:underline'
            );
          }
        }
        if (node.tagName === 'img') {
          node.properties.alt =
            typeof node.properties.alt === 'string' ? node.properties.alt : '';
          node.properties.loading = 'lazy';
          node.properties.decoding = 'async';
          node.properties.className = mergeClassName(
            node.properties.className,
            'rounded-lg shadow-md'
          );
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

/** Renders trusted repository markdown with the existing link and image enhancements. */
export async function renderMarkdown(content: string): Promise<MarkdownResult> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
      properties: { className: ['anchor'] },
    })
    .use(enhanceMarkdownHtml)
    .use(rehypeStringify)
    .process(content);

  return { markup: String(result) };
}
