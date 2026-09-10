import { env } from 'cloudflare:workers';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import {
  exportRecords,
  generatedAssets,
  projectVersions,
  projects,
  userFiles,
} from '@/db/app.schema';
import { buildExport } from '@/export/build';

function sourceAssetId(value: string) {
  try {
    const parsed = JSON.parse(value) as { sourceAssetId?: unknown };
    return typeof parsed.sourceAssetId === 'string'
      ? parsed.sourceAssetId
      : null;
  } catch {
    return null;
  }
}

export async function processExport(exportId: string) {
  const db = getDb();
  const [record] = await db
    .update(exportRecords)
    .set({ status: 'processing', updatedAt: new Date() })
    .where(
      and(eq(exportRecords.id, exportId), eq(exportRecords.status, 'queued'))
    )
    .returning();
  if (!record) return;

  try {
    const assetId = sourceAssetId(record.format);
    const [source] = await db
      .select({
        asset: generatedAssets,
        file: userFiles,
        version: projectVersions,
        project: projects,
      })
      .from(generatedAssets)
      .innerJoin(userFiles, eq(generatedAssets.userFileId, userFiles.id))
      .innerJoin(
        projectVersions,
        eq(generatedAssets.versionId, projectVersions.id)
      )
      .innerJoin(projects, eq(projectVersions.projectId, projects.id))
      .where(
        and(
          assetId
            ? eq(generatedAssets.id, assetId)
            : eq(generatedAssets.versionId, record.versionId),
          eq(generatedAssets.status, 'active'),
          eq(projects.id, record.projectId),
          eq(projects.userId, record.userId),
          eq(projects.status, 'active')
        )
      )
      .limit(1);
    if (
      !source ||
      (!source.asset.role.startsWith('candidate_') &&
        !['final', 'revision', 'raw', 'hd_master'].includes(source.asset.role))
    )
      throw new Error('INVALID_IMAGE');
    const object = await env.BUCKET.get(source.file.r2Key);
    if (!object?.body) throw new Error('INVALID_IMAGE');
    const bytes = new Uint8Array(await new Response(object.body).arrayBuffer());
    const output = await buildExport(record.format, bytes, {
      projectId: record.projectId,
      versionId: record.versionId,
      sourceSha256: source.asset.sha256,
      brief: JSON.parse(source.project.brief),
      revisionInstruction: source.version.userInstruction,
      quality: source.version.quality,
      generatedAt: source.version.createdAt.toISOString(),
      exportedAt: new Date().toISOString(),
    });
    const fileId = crypto.randomUUID();
    const r2Key = `projects/${record.userId}/${record.projectId}/exports/${record.id}/${output.filename}`;
    await env.BUCKET.put(r2Key, output.bytes, {
      httpMetadata: { contentType: output.contentType },
    });
    const timestamp = new Date();
    await db.insert(userFiles).values({
      id: fileId,
      userId: record.userId,
      filename: output.filename,
      originalName: output.filename,
      contentType: output.contentType,
      size: output.bytes.byteLength,
      r2Key,
      isPublic: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await db
      .update(exportRecords)
      .set({ status: 'succeeded', outputFileId: fileId, updatedAt: timestamp })
      .where(eq(exportRecords.id, record.id));
  } catch (error) {
    await db
      .update(exportRecords)
      .set({
        status: 'failed',
        failureCode:
          error instanceof Error
            ? error.message.slice(0, 120)
            : 'PROVIDER_UNAVAILABLE',
        updatedAt: new Date(),
      })
      .where(eq(exportRecords.id, exportId));
  }
}
