import { createFileRoute } from '@tanstack/react-router';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/auth/auth';
import { getDb } from '@/db';
import {
  downloadEvents,
  exportRecords,
  generatedAssets,
  projectVersions,
  userFiles,
} from '@/db/app.schema';
import { getFile } from '@/storage';

export const Route = createFileRoute('/api/exports/$exportId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const session = await auth.api.getSession({
          headers: getRequestHeaders(),
        });
        if (!session?.user)
          return new Response('Unauthorized', { status: 401 });
        const db = getDb();
        const [record] = await db
          .select({ export: exportRecords, file: userFiles })
          .from(exportRecords)
          .innerJoin(userFiles, eq(exportRecords.outputFileId, userFiles.id))
          .where(
            and(
              eq(exportRecords.id, params.exportId),
              eq(exportRecords.userId, session.user.id),
              eq(exportRecords.status, 'succeeded')
            )
          )
          .limit(1);
        if (!record) return new Response('Not Found', { status: 404 });
        const [asset] = await db
          .select({ status: generatedAssets.status })
          .from(generatedAssets)
          .innerJoin(
            projectVersions,
            eq(generatedAssets.versionId, projectVersions.id)
          )
          .where(
            and(
              eq(projectVersions.id, record.export.versionId),
              eq(generatedAssets.status, 'active')
            )
          )
          .limit(1);
        if (!asset) return new Response('Not Found', { status: 404 });
        const file = await getFile(record.file.r2Key);
        if (!file) return new Response('Not Found', { status: 404 });
        await db.insert(downloadEvents).values({
          id: crypto.randomUUID(),
          exportId: record.export.id,
          userId: session.user.id,
          downloadedAt: new Date(),
        });
        return new Response(file.body, {
          headers: {
            'Content-Type': record.file.contentType,
            'Content-Disposition': `attachment; filename="${record.file.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      },
    },
  },
});
