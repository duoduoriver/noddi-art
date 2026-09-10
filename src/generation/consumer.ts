import { env } from 'cloudflare:workers';
import { and, eq, inArray, max } from 'drizzle-orm';
import { getDb } from '@/db';
import { processProjectDeletion } from '@/generation/delete-project';
import { processExport } from '@/export/process';
import {
  generationAttempts,
  generationJobs,
  generatedAssets,
  imageBudgetMonths,
  projectVersions,
  projects,
  usageDaily,
  userFiles,
} from '@/db/app.schema';
import {
  debitCredits,
  hasPaidAccess,
  refundGeneration,
} from '@/credits/service';
import { getOperationalSettings } from '@/generation/settings';
import { stylePromptDirection } from '@/generation/style-presets';
import { GenerationError, type NoddiJobMessage } from '@/generation/types';
import {
  editImage,
  generateImage,
  getImageChannels,
  type ImageChannel,
  type ImageCallResult,
  ImageProviderError,
} from '@/image/openai-compat';
import {
  cropQuadrants,
  decodePng,
  encodePng,
  normalizeToPng,
} from '@/image/png';

function id() {
  return crypto.randomUUID();
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function utcDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

async function sha256(bytes: Uint8Array) {
  const source = new Uint8Array(bytes).buffer;
  const digest = await crypto.subtle.digest('SHA-256', source);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function estimatedCost(
  settings: Awaited<ReturnType<typeof getOperationalSettings>>,
  channel: 'primary' | 'fallback',
  operation: string,
  quality: string | null
) {
  const prefix = channel === 'primary' ? 'primary' : 'fallback';
  if (operation === 'grid') return settings[`${prefix}GenerationLowMicros`];
  if (operation === 'revision' || quality === 'medium')
    return settings[`${prefix}EditMediumMicros`];
  return settings[`${prefix}EditHighMicros`];
}

async function reserveBudget(operationId: string, estimatedMicros: number) {
  const settings = await getOperationalSettings();
  const db = getDb();
  const month = monthKey();
  const updatedAt = new Date();
  await db
    .insert(imageBudgetMonths)
    .values({
      month,
      budgetMicros: settings.monthlyBudgetMicros,
      reservedMicros: 0,
      version: 0,
      updatedAt,
    })
    .onConflictDoNothing();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const [budget] = await db
      .select()
      .from(imageBudgetMonths)
      .where(eq(imageBudgetMonths.month, month))
      .limit(1);
    if (
      !budget ||
      budget.reservedMicros + estimatedMicros > budget.budgetMicros
    ) {
      throw new GenerationError('BUDGET_EXHAUSTED');
    }
    const changed = await db
      .update(imageBudgetMonths)
      .set({
        reservedMicros: budget.reservedMicros + estimatedMicros,
        version: budget.version + 1,
        lastOperationId: operationId,
        updatedAt,
      })
      .where(
        and(
          eq(imageBudgetMonths.month, month),
          eq(imageBudgetMonths.version, budget.version)
        )
      )
      .returning({ month: imageBudgetMonths.month });
    if (changed.length) return;
  }
  throw new GenerationError('BUDGET_EXHAUSTED');
}

async function reserveDailyQuota(userId: string) {
  const settings = await getOperationalSettings();
  if (settings.dailyLimit <= 0)
    throw new GenerationError('DAILY_LIMIT_REACHED');
  const db = getDb();
  const today = utcDay();
  await db
    .insert(usageDaily)
    .values({
      id: id(),
      userId,
      utcDate: today,
      count: 0,
      updatedAt: new Date(),
    })
    .onConflictDoNothing();
  const [usage] = await db
    .select()
    .from(usageDaily)
    .where(and(eq(usageDaily.userId, userId), eq(usageDaily.utcDate, today)))
    .limit(1);
  if (!usage || usage.count >= settings.dailyLimit)
    throw new GenerationError('DAILY_LIMIT_REACHED');
  const updated = await db
    .update(usageDaily)
    .set({ count: usage.count + 1, updatedAt: new Date() })
    .where(and(eq(usageDaily.id, usage.id), eq(usageDaily.count, usage.count)))
    .returning({ id: usageDaily.id });
  if (!updated.length) return reserveDailyQuota(userId);
}

async function storePrivatePng(
  userId: string,
  projectId: string,
  jobId: string,
  role: string,
  bytes: Uint8Array
) {
  const hash = await sha256(bytes);
  const fileId = id();
  const r2Key = `projects/${userId}/${projectId}/${jobId}/${role}.png`;
  await env.BUCKET.put(r2Key, bytes, {
    httpMetadata: { contentType: 'image/png' },
  });
  const timestamp = new Date();
  await getDb()
    .insert(userFiles)
    .values({
      id: fileId,
      userId,
      filename: `${role}.png`,
      originalName: `${role}.png`,
      contentType: 'image/png',
      size: bytes.byteLength,
      r2Key,
      isPublic: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  return { fileId, hash };
}

async function recordAttempt(
  jobId: string,
  channel: ImageChannel,
  estimatedCostMicros: number
) {
  const attemptId = id();
  await getDb()
    .insert(generationAttempts)
    .values({
      id: attemptId,
      jobId,
      channel: channel.name,
      model: channel.model,
      baseHost: new URL(channel.baseUrl).host,
      estimatedCostMicros,
      status: 'started',
      createdAt: new Date(),
    });
  return attemptId;
}

async function callProvider(
  job: typeof generationJobs.$inferSelect,
  channel: ImageChannel,
  settings: Awaited<ReturnType<typeof getOperationalSettings>>,
  prompt: string,
  references: Uint8Array[]
): Promise<ImageCallResult> {
  const cost = estimatedCost(
    settings,
    channel.name,
    job.operation,
    job.quality
  );
  if (cost <= 0) throw new GenerationError('BUDGET_EXHAUSTED');
  const attemptId = await recordAttempt(job.id, channel, cost);
  const started = performance.now();
  try {
    await reserveBudget(`attempt:${attemptId}`, cost);
    const output = references.length
      ? await editImage(
          channel,
          prompt,
          references,
          `job:${job.id}:${channel.name}:${attemptId}`
        )
      : await generateImage(
          channel,
          prompt,
          'low',
          `job:${job.id}:${channel.name}:${attemptId}`
        );
    await getDb()
      .update(generationAttempts)
      .set({
        status: 'succeeded',
        latencyMs: Math.round(performance.now() - started),
      })
      .where(eq(generationAttempts.id, attemptId));
    return output;
  } catch (error) {
    await getDb()
      .update(generationAttempts)
      .set({
        status: 'failed',
        httpStatus:
          error instanceof ImageProviderError ? (error.status ?? null) : null,
        latencyMs: Math.round(performance.now() - started),
        errorSummary:
          error instanceof Error
            ? error.message.slice(0, 500)
            : 'Unknown error',
      })
      .where(eq(generationAttempts.id, attemptId));
    throw error;
  }
}

async function readReference(r2Key: string) {
  const object = await env.BUCKET.get(r2Key);
  if (!object?.body) throw new GenerationError('INVALID_IMAGE');
  const bytes = new Uint8Array(await new Response(object.body).arrayBuffer());
  return (await normalizeToPng(bytes)).bytes;
}

async function getReferenceBytes(
  job: typeof generationJobs.$inferSelect,
  project: typeof projects.$inferSelect
) {
  if (job.operation === 'grid') {
    const brief = JSON.parse(project.brief) as { referenceFileIds?: string[] };
    const ids = [...new Set(brief.referenceFileIds ?? [])].slice(0, 4);
    if (!ids.length) return [];
    const rows = await getDb()
      .select({ id: userFiles.id, r2Key: userFiles.r2Key })
      .from(userFiles)
      .where(and(eq(userFiles.userId, job.userId), inArray(userFiles.id, ids)));
    if (rows.length !== ids.length) throw new GenerationError('INVALID_IMAGE');
    const byId = new Map(rows.map((row) => [row.id, row.r2Key]));
    return Promise.all(ids.map((id) => readReference(byId.get(id)!)));
  }
  if (!job.inputVersionId) return [];
  const role =
    job.operation === 'final' || job.operation === 'hd_master'
      ? `candidate_${job.candidate}`
      : 'final';
  const [asset] = await getDb()
    .select({ r2Key: userFiles.r2Key })
    .from(generatedAssets)
    .innerJoin(userFiles, eq(generatedAssets.userFileId, userFiles.id))
    .where(
      and(
        eq(generatedAssets.versionId, job.inputVersionId),
        eq(generatedAssets.role, role),
        eq(generatedAssets.status, 'active')
      )
    )
    .limit(1);
  if (!asset) throw new GenerationError('INVALID_IMAGE');
  return [await readReference(asset.r2Key)];
}

function promptForJob(
  job: typeof generationJobs.$inferSelect,
  project: typeof projects.$inferSelect
) {
  const brief = JSON.parse(project.brief) as Record<string, string | string[]>;
  if (job.operation === 'grid') {
    const references = Array.isArray(brief.referenceFileIds)
      ? brief.referenceFileIds.length
      : 0;
    const styleDirection = stylePromptDirection(brief.style);
    return `Create a 1024x1024 noddi concept sheet. Product: ${brief.productDescription}. Subject: ${brief.iconSubject}. Style preset: ${brief.style}. Style direction: ${styleDirection} Primary color: ${brief.primaryColor}. Background: ${brief.background}. Treat the selected style direction as a strong visual constraint while preserving the user's requested subject and concept. Avoid: ${brief.avoid ?? ''}.${references ? ` Use the ${references} supplied reference image${references === 1 ? '' : 's'} as visual direction while still creating four fresh variations.` : ''} Exactly four equal independent 512x512 quadrants, each containing one independent app-icon concept. Keep every concept recognizable at small sizes. No text, lettering, typography, or watermark.`;
  }
  if (job.operation === 'revision')
    return 'Revise the supplied noddi final icon using the stored user instruction. Keep it a single clean 1024x1024 icon with no text or watermark.';
  if (job.operation === 'hd_master')
    return 'Re-render the supplied app icon as one clean production-quality 1024x1024 icon. Preserve the original composition, shapes, colors, proportions, background, and visual identity as faithfully as possible. Do not redesign it, add details, add text, or add a watermark.';
  return `Turn the supplied candidate ${job.candidate} into one polished 1024x1024 noddi app icon. Product: ${brief.productDescription}. Keep the icon independent, without text or watermark.`;
}

async function saveOutput(
  job: typeof generationJobs.$inferSelect,
  output: ImageCallResult
) {
  const db = getDb();
  // A deletion can begin while the image provider is working. Check again
  // before writing any project-scoped object or metadata.
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, job.projectId),
        eq(projects.userId, job.userId),
        eq(projects.status, 'active')
      )
    )
    .limit(1);
  if (!project) throw new GenerationError('PROJECT_NOT_FOUND');
  const image = await decodePng(output.bytes);
  if (job.operation === 'hd_master') {
    if (!job.inputVersionId) throw new GenerationError('INVALID_IMAGE');
    const stored = await storePrivatePng(
      job.userId,
      job.projectId,
      job.id,
      'hd_master',
      output.bytes
    );
    await db.insert(generatedAssets).values({
      id: id(),
      versionId: job.inputVersionId,
      jobId: job.id,
      userFileId: stored.fileId,
      role: 'hd_master',
      width: image.width,
      height: image.height,
      sha256: stored.hash,
      status: 'active',
      createdAt: new Date(),
    });
    await db
      .update(generationJobs)
      .set({
        status: 'succeeded',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(generationJobs.id, job.id));
    return;
  }
  const raw = await storePrivatePng(
    job.userId,
    job.projectId,
    job.id,
    'raw',
    output.bytes
  );
  const [versionMax] = await db
    .select({ value: max(projectVersions.versionNumber) })
    .from(projectVersions)
    .where(eq(projectVersions.projectId, job.projectId));
  const versionId = id();
  const versionNumber = (versionMax?.value ?? 0) + 1;
  const versionType =
    job.operation === 'grid'
      ? 'concept_sheet'
      : job.operation === 'revision'
        ? 'revision'
        : 'final';
  await db.insert(projectVersions).values({
    id: versionId,
    projectId: job.projectId,
    type: versionType,
    parentVersionId: job.inputVersionId,
    parentFinalId: job.operation === 'revision' ? job.inputVersionId : null,
    candidate: job.candidate,
    quality: job.quality,
    promptTemplateVersion: 'noddi-v1',
    versionNumber,
    createdAt: new Date(),
  });
  await db.insert(generatedAssets).values({
    id: id(),
    versionId,
    jobId: job.id,
    userFileId: raw.fileId,
    role: 'raw',
    width: image.width,
    height: image.height,
    sha256: raw.hash,
    status: 'active',
    createdAt: new Date(),
  });
  if (job.operation === 'grid') {
    const quadrants = cropQuadrants(image);
    for (const [candidate, crop] of Object.entries(quadrants) as Array<
      [string, ReturnType<typeof cropQuadrants>['A']]
    >) {
      const bytes = await encodePng(crop);
      const stored = await storePrivatePng(
        job.userId,
        job.projectId,
        job.id,
        `candidate_${candidate}`,
        bytes
      );
      await db.insert(generatedAssets).values({
        id: id(),
        versionId,
        jobId: job.id,
        userFileId: stored.fileId,
        role: `candidate_${candidate}`,
        width: 512,
        height: 512,
        sha256: stored.hash,
        status: 'active',
        createdAt: new Date(),
      });
    }
  } else {
    const role = job.operation === 'revision' ? 'revision' : 'final';
    await db.insert(generatedAssets).values({
      id: id(),
      versionId,
      jobId: job.id,
      userFileId: raw.fileId,
      role,
      width: 1024,
      height: 1024,
      sha256: raw.hash,
      status: 'active',
      createdAt: new Date(),
    });
  }
  await db
    .update(projects)
    .set({ activeVersionId: versionId, updatedAt: new Date() })
    .where(eq(projects.id, job.projectId));
  await db
    .update(generationJobs)
    .set({
      status: 'succeeded',
      outputVersionId: versionId,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(generationJobs.id, job.id));
}

async function processGeneration(jobId: string) {
  const db = getDb();
  const claimed = await db
    .update(generationJobs)
    .set({ status: 'processing', claimedAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(generationJobs.id, jobId), eq(generationJobs.status, 'queued'))
    )
    .returning();
  const job = claimed[0];
  if (!job) return;
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, job.projectId),
          eq(projects.userId, job.userId),
          eq(projects.status, 'active')
        )
      )
      .limit(1);
    if (!project) throw new GenerationError('PROJECT_NOT_FOUND');
    if (
      ['final', 'revision'].includes(job.operation) &&
      !(await hasPaidAccess(job.userId))
    )
      throw new GenerationError('PAID_ACCESS_REQUIRED');
    await reserveDailyQuota(job.userId);
    const debit = await debitCredits(
      job.userId,
      `generation-debit:${job.id}`,
      job.creditCost,
      job.id
    );
    if (!debit) throw new GenerationError('INSUFFICIENT_CREDITS');
    await db
      .update(generationJobs)
      .set({
        planDebited: debit.planDebited,
        purchasedDebited: debit.purchasedDebited,
        updatedAt: new Date(),
      })
      .where(eq(generationJobs.id, job.id));
    const settings = await getOperationalSettings();
    const channels = getImageChannels();
    const prompt = promptForJob(job, project);
    const references = await getReferenceBytes(job, project);
    let output: ImageCallResult;
    try {
      output = await callProvider(
        job,
        channels.primary,
        settings,
        prompt,
        references
      );
    } catch (primaryError) {
      if (
        !(primaryError instanceof ImageProviderError) ||
        !primaryError.retryable ||
        !channels.fallback
      )
        throw primaryError;
      output = await callProvider(
        job,
        channels.fallback,
        settings,
        prompt,
        references
      );
    }
    await saveOutput(job, output);
  } catch (error) {
    const code =
      error instanceof GenerationError
        ? error.code
        : error instanceof ImageProviderError
          ? 'PROVIDER_UNAVAILABLE'
          : 'PROVIDER_UNAVAILABLE';
    const [fresh] = await db
      .select()
      .from(generationJobs)
      .where(eq(generationJobs.id, jobId))
      .limit(1);
    if (fresh && fresh.planDebited + fresh.purchasedDebited > 0) {
      await refundGeneration(
        fresh.userId,
        fresh.id,
        fresh.planDebited,
        fresh.purchasedDebited
      );
      await db
        .update(generationJobs)
        .set({
          status: 'refunded',
          failureCode: code,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(generationJobs.id, jobId));
    } else {
      await db
        .update(generationJobs)
        .set({
          status: 'failed',
          failureCode: code,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(generationJobs.id, jobId));
    }
  }
}

export async function consumeNoddiJobs(batch: {
  messages: Array<{ body: NoddiJobMessage; ack(): void; retry(): void }>;
}) {
  for (const message of batch.messages) {
    try {
      if (message.body.type === 'generation')
        await processGeneration(message.body.jobId);
      if (message.body.type === 'export')
        await processExport(message.body.exportId);
      if (message.body.type === 'delete_project')
        await processProjectDeletion(message.body.projectId);
      // Unknown cleanup message types must not be acknowledged as success.
      if (
        message.body.type !== 'generation' &&
        message.body.type !== 'export' &&
        message.body.type !== 'delete_project'
      )
        throw new Error(`Unsupported Noddi job: ${message.body.type}`);
      message.ack();
    } catch (error) {
      console.error('Noddi queue job will retry', {
        type: message.body.type,
        error: error instanceof Error ? error.message : 'Unknown queue failure',
      });
      message.retry();
    }
  }
}
