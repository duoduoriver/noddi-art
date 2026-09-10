import { env } from 'cloudflare:workers';
import { and, asc, eq, inArray, lt, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import {
  exportRecords,
  generationJobs,
  projects,
  userFiles,
} from '@/db/app.schema';

const busyStatuses = ['queued', 'processing'];

/** Recover lost/exhausted queue deliveries using the existing daily cron. */
export async function requeueProjectDeletions() {
  const db = getDb();
  const stale = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.status, 'deleting'),
        lt(projects.updatedAt, new Date(Date.now() - 5 * 60_000))
      )
    )
    .orderBy(asc(projects.updatedAt))
    .limit(50);
  for (const project of stale) {
    await env.NODDI_JOBS.send({
      type: 'delete_project',
      projectId: project.id,
    });
    await db
      .update(projects)
      .set({ updatedAt: new Date() })
      .where(and(eq(projects.id, project.id), eq(projects.status, 'deleting')));
  }
}

/**
 * Permanently remove a project after the API has put it in the deleting state.
 * The queue's at-least-once delivery makes absence (or a completed deletion)
 * deliberately successful.
 */
export async function processProjectDeletion(projectId: string) {
  const db = getDb();
  const [project] = await db
    .select({ id: projects.id, userId: projects.userId })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.status, 'deleting')))
    .limit(1);
  if (!project) return;

  // Do not race an output writer: it will observe deleting and finish/fail,
  // then the next queue delivery can safely perform this cleanup.
  const [[generationInFlight], [exportInFlight]] = await Promise.all([
    db
      .select({ id: generationJobs.id })
      .from(generationJobs)
      .where(
        and(
          eq(generationJobs.projectId, project.id),
          inArray(generationJobs.status, busyStatuses)
        )
      )
      .limit(1),
    db
      .select({ id: exportRecords.id })
      .from(exportRecords)
      .where(
        and(
          eq(exportRecords.projectId, project.id),
          inArray(exportRecords.status, busyStatuses)
        )
      )
      .limit(1),
  ]);
  if (generationInFlight || exportInFlight)
    throw new Error('PROJECT_WORK_IN_PROGRESS');

  // The database owner, not queue data, defines the only permitted R2 scope.
  const prefix = `projects/${project.userId}/${project.id}/`;
  let cursor: string | undefined;
  do {
    const page = await env.BUCKET.list({ prefix, cursor });
    // list() is cursor based: an empty but truncated page is still not done.
    for (let offset = 0; offset < page.objects.length; offset += 1000) {
      const keys = page.objects
        .slice(offset, offset + 1000)
        .map((object) => object.key)
        .filter((key) => key.startsWith(prefix));
      if (keys.length) await env.BUCKET.delete(keys);
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor !== undefined);

  // Only project-scoped files are removed. Reference uploads use another key
  // namespace and therefore survive even when listed in a project's brief.
  await db.batch([
    db
      .delete(userFiles)
      .where(
        and(
          eq(userFiles.userId, project.userId),
          sql`substr(${userFiles.r2Key}, 1, ${prefix.length}) = ${prefix}`
        )
      ),
    // FK cascades remove versions, jobs/attempts/assets, exports and downloads.
    // Payments and credit_ledger do not reference projects and are retained.
    db
      .delete(projects)
      .where(and(eq(projects.id, project.id), eq(projects.status, 'deleting'))),
  ]);
}
