import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getChangelogReleases } from '@/lib/changelog';
import { getPageBySlug, toPageDetail } from '@/lib/pages';

export const getPageContent = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const page = getPageBySlug(data.slug);
    return page ? toPageDetail(page) : null;
  });

export const getChangelogContent = createServerFn({ method: 'GET' }).handler(
  async () => getChangelogReleases()
);
