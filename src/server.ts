// DO NOT DELETE THIS FILE!!!
// This file is a good smoke test to make sure the custom server entry is working
import handler from '@tanstack/react-start/server-entry';
import type { consumeNoddiJobs } from '@/generation/consumer';

/**
 * TanStack Start server entry
 * https://github.com/backpine/tanstack-start-on-cloudflare/blob/main/src/server.ts
 */
console.log("[server-entry]: using custom server entry in 'src/server.ts'");

export default {
  async fetch(request: Request) {
    const resolve = (currentRequest: Request) =>
      handler.fetch(currentRequest, { context: { fromFetch: true } });
    if (import.meta.env.DEV) return resolve(request);
    const { localeMiddleware } = await import('@/locale/middleware');
    return localeMiddleware(request, resolve);
  },
  async queue(batch: Parameters<typeof consumeNoddiJobs>[0]) {
    // Keep image codecs and queue-only dependencies off the HTTP dev path.
    const { consumeNoddiJobs } = await import('@/generation/consumer');
    return consumeNoddiJobs(batch);
  },
  // Recover user-requested deletions whose queue deliveries were lost or
  // exhausted. Cleanup still refuses to race any in-flight output writer.
  async scheduled() {
    const { requeueProjectDeletions } = await import(
      '@/generation/delete-project'
    );
    return requeueProjectDeletions();
  },
};
