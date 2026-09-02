import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getPaginatedPosts, getPostBySlug, toPostDetail } from '@/lib/blog';
import { getChangelogReleases } from '@/lib/changelog';
import { getPageBySlug, toPageDetail } from '@/lib/pages';

export const getBlogPosts = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ page: z.number().int().positive().optional() }))
  .handler(async ({ data }) => getPaginatedPosts(data.page ?? 1));

export const getBlogPost = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const post = getPostBySlug(data.slug);
    return post ? toPostDetail(post) : null;
  });

export const getPageContent = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const page = getPageBySlug(data.slug);
    return page ? toPageDetail(page) : null;
  });

export const getChangelogContent = createServerFn({ method: 'GET' }).handler(
  async () => getChangelogReleases()
);
