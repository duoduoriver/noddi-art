import { env } from 'cloudflare:workers';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getDb } from '@/db';
import {
  exportRecords,
  generationJobs,
  generatedAssets,
  projectVersions,
  projects,
  userFiles,
} from '@/db/app.schema';
import {
  getCreditSummary as getCreditSummaryForUser,
  hasPaidAccess,
  listCreditLedger as listCreditLedgerForUser,
} from '@/credits/service';
import { authApiMiddleware } from '@/middlewares/auth-middleware';
import {
  getImageChannels,
  ImageProviderError,
  moderatePrompt,
} from '@/image/openai-compat';
import { getOperationalSettings } from '@/generation/settings';
import {
  GenerationError,
  HD_MASTER_CREDIT_COST,
  type NoddiJobMessage,
} from '@/generation/types';

type QueueProducer = { send(message: NoddiJobMessage): Promise<void> };

const briefSchema = z.object({
  productDescription: z.string().min(4).max(1_500),
  iconSubject: z.string().min(2).max(300),
  style: z.string().min(2).max(300),
  primaryColor: z.string().min(2).max(100),
  background: z.string().min(2).max(300),
  avoid: z.string().max(500).default(''),
  notes: z.string().max(1_000).default(''),
  referenceFileIds: z.array(z.string().uuid()).max(4).default([]),
});

const requestIdSchema = z.string().uuid();
const candidateSchema = z.enum(['A', 'B', 'C', 'D']);
const qualitySchema = z.enum(['medium', 'high']);
const generationSettingsSchema = z.object({
  prompt: z.string().min(4).max(1_500),
  style: z.string().min(1).max(100),
  primaryColor: z.string().min(2).max(100),
  background: z.string().min(2).max(300),
  referenceFileIds: z.array(z.string().uuid()).max(4).default([]),
});

function queue() {
  const worker = env as unknown as { NODDI_JOBS?: QueueProducer };
  if (!worker.NODDI_JOBS) throw new GenerationError('PROVIDER_UNAVAILABLE');
  return worker.NODDI_JOBS;
}

function errorCode(error: unknown) {
  return error instanceof GenerationError ? error.code : 'PROVIDER_UNAVAILABLE';
}

function briefFromSettings(
  settings: z.infer<typeof generationSettingsSchema>,
  referenceFileIds: string[] = []
): z.infer<typeof briefSchema> {
  return {
    productDescription: settings.prompt,
    iconSubject: 'The icon subject described in the user prompt',
    style: settings.style,
    primaryColor: settings.primaryColor,
    background: settings.background,
    avoid: '',
    notes: '',
    referenceFileIds: [...new Set(referenceFileIds)].slice(0, 4),
  };
}

async function assertReferenceFiles(
  userId: string,
  referenceFileIds: string[]
) {
  const ids = [...new Set(referenceFileIds)].slice(0, 4);
  if (!ids.length) return ids;
  const rows = await getDb()
    .select({ id: userFiles.id })
    .from(userFiles)
    .where(and(eq(userFiles.userId, userId), inArray(userFiles.id, ids)));
  if (rows.length !== ids.length) throw new GenerationError('INVALID_IMAGE');
  return ids;
}

function projectNameFromPrompt(prompt: string) {
  const firstLine = prompt.trim().split(/\r?\n/, 1)[0] ?? 'Untitled icon';
  return firstLine.slice(0, 120);
}

function compilePrompt(brief: z.infer<typeof briefSchema>) {
  return [
    'Create an app icon concept sheet for noddi.',
    `Product or use: ${brief.productDescription}`,
    `Icon subject: ${brief.iconSubject}`,
    `Style: ${brief.style}`,
    `Primary color: ${brief.primaryColor}`,
    `Background preference: ${brief.background}`,
    brief.avoid ? `Avoid: ${brief.avoid}` : '',
    brief.notes ? `Additional direction: ${brief.notes}` : '',
    'Output exactly one 1024x1024 image divided into four equal 512x512 quadrants.',
    'Each quadrant must be a complete independent icon concept. No text, letters, watermarks, borders crossing quadrants, or shared elements.',
  ]
    .filter(Boolean)
    .join('\n');
}

async function moderate(prompt: string, requestId: string) {
  const channels = getImageChannels();
  try {
    const primary = await moderatePrompt(
      channels.primary,
      prompt,
      `moderation:${requestId}:primary`
    );
    if (primary === 'flagged') throw new GenerationError('CONTENT_POLICY');
    if (primary === 'clear' || !channels.fallback) return;
  } catch (error) {
    if (error instanceof GenerationError) throw error;
    if (
      !(error instanceof ImageProviderError) ||
      !error.retryable ||
      !channels.fallback
    ) {
      throw new GenerationError('MODERATION_UNAVAILABLE');
    }
  }
  if (!channels.fallback) return;
  try {
    const fallback = await moderatePrompt(
      channels.fallback,
      prompt,
      `moderation:${requestId}:fallback`
    );
    if (fallback === 'flagged') throw new GenerationError('CONTENT_POLICY');
  } catch (error) {
    if (error instanceof GenerationError) throw error;
    throw new GenerationError('MODERATION_UNAVAILABLE');
  }
}

async function assertGenerationCanStart(
  _userId: string,
  prompt: string,
  requestId: string
) {
  const settings = await getOperationalSettings();
  if (
    !settings.generationEnabled ||
    settings.dailyLimit <= 0 ||
    settings.monthlyBudgetMicros <= 0
  ) {
    throw new GenerationError('BUDGET_EXHAUSTED');
  }
  await moderate(prompt, requestId);
  return settings;
}

async function enqueue(jobId: string) {
  try {
    await queue().send({ type: 'generation', jobId });
  } catch {
    await getDb()
      .update(generationJobs)
      .set({
        status: 'failed',
        failureCode: 'PROVIDER_UNAVAILABLE',
        updatedAt: new Date(),
      })
      .where(eq(generationJobs.id, jobId));
    throw new GenerationError('PROVIDER_UNAVAILABLE');
  }
}

export const startProject = createServerFn({ method: 'POST' })
  .inputValidator(
    generationSettingsSchema.extend({
      requestId: requestIdSchema,
    })
  )
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(generationJobs)
      .where(
        and(
          eq(generationJobs.userId, context.userId),
          eq(generationJobs.requestId, data.requestId)
        )
      )
      .limit(1);
    if (existing) return { projectId: existing.projectId, job: existing };
    const referenceFileIds = await assertReferenceFiles(
      context.userId,
      data.referenceFileIds
    );
    const brief = briefFromSettings(data, referenceFileIds);
    const prompt = compilePrompt(brief);
    const settings = await assertGenerationCanStart(
      context.userId,
      prompt,
      data.requestId
    );
    const timestamp = new Date();
    const projectId = crypto.randomUUID();
    const jobId = crypto.randomUUID();
    await db.insert(projects).values({
      id: projectId,
      userId: context.userId,
      name: projectNameFromPrompt(data.prompt),
      brief: JSON.stringify(brief),
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await db.insert(generationJobs).values({
      id: jobId,
      userId: context.userId,
      projectId,
      requestId: data.requestId,
      operation: 'grid',
      creditCost: settings.gridCost,
      status: 'queued',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await enqueue(jobId);
    return { projectId, job: { id: jobId, status: 'queued' } };
  });

export const generateVersion = createServerFn({ method: 'POST' })
  .inputValidator(
    generationSettingsSchema.extend({
      projectId: z.string().uuid(),
      requestId: requestIdSchema,
    })
  )
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(generationJobs)
      .where(
        and(
          eq(generationJobs.userId, context.userId),
          eq(generationJobs.requestId, data.requestId)
        )
      )
      .limit(1);
    if (existing) return existing;
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, data.projectId),
          eq(projects.userId, context.userId),
          eq(projects.status, 'active')
        )
      )
      .limit(1);
    if (!project) throw new GenerationError('PROJECT_NOT_FOUND');
    const referenceFileIds = await assertReferenceFiles(
      context.userId,
      data.referenceFileIds
    );
    const brief = briefFromSettings(data, referenceFileIds);
    const settings = await assertGenerationCanStart(
      context.userId,
      compilePrompt(brief),
      data.requestId
    );
    const timestamp = new Date();
    const job = {
      id: crypto.randomUUID(),
      userId: context.userId,
      projectId: project.id,
      requestId: data.requestId,
      operation: 'grid' as const,
      creditCost: settings.gridCost,
      status: 'queued',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db
      .update(projects)
      .set({ brief: JSON.stringify(brief), updatedAt: timestamp })
      .where(eq(projects.id, project.id));
    await db.insert(generationJobs).values(job);
    await enqueue(job.id);
    return job;
  });

export const generateFinal = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      projectId: z.string().uuid(),
      conceptSheetId: z.string().uuid(),
      candidate: candidateSchema,
      quality: qualitySchema,
      requestId: requestIdSchema,
    })
  )
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    if (!(await hasPaidAccess(context.userId)))
      throw new GenerationError('PAID_ACCESS_REQUIRED');
    const db = getDb();
    const [existing] = await db
      .select()
      .from(generationJobs)
      .where(
        and(
          eq(generationJobs.userId, context.userId),
          eq(generationJobs.requestId, data.requestId)
        )
      )
      .limit(1);
    if (existing) return existing;
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, data.projectId),
          eq(projects.userId, context.userId),
          eq(projects.status, 'active')
        )
      )
      .limit(1);
    const [sheet] = await db
      .select()
      .from(projectVersions)
      .where(
        and(
          eq(projectVersions.id, data.conceptSheetId),
          eq(projectVersions.projectId, data.projectId),
          eq(projectVersions.type, 'concept_sheet')
        )
      )
      .limit(1);
    if (!project || !sheet) throw new GenerationError('PROJECT_NOT_FOUND');
    const settings = await assertGenerationCanStart(
      context.userId,
      `Create one polished app icon from candidate ${data.candidate}.\n${compilePrompt(JSON.parse(project.brief))}`,
      data.requestId
    );
    const timestamp = new Date();
    const cost =
      data.quality === 'high'
        ? settings.finalHighCost
        : settings.finalMediumCost;
    const job = {
      id: crypto.randomUUID(),
      userId: context.userId,
      projectId: data.projectId,
      requestId: data.requestId,
      operation: 'final' as const,
      inputVersionId: data.conceptSheetId,
      candidate: data.candidate,
      quality: data.quality,
      creditCost: cost,
      status: 'queued',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db.insert(generationJobs).values(job);
    await enqueue(job.id);
    return job;
  });

export const reviseFinal = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      projectId: z.string().uuid(),
      finalId: z.string().uuid(),
      instruction: z.string().min(3).max(1_000),
      requestId: requestIdSchema,
    })
  )
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    if (!(await hasPaidAccess(context.userId)))
      throw new GenerationError('PAID_ACCESS_REQUIRED');
    const db = getDb();
    const [existing] = await db
      .select()
      .from(generationJobs)
      .where(
        and(
          eq(generationJobs.userId, context.userId),
          eq(generationJobs.requestId, data.requestId)
        )
      )
      .limit(1);
    if (existing) return existing;
    const [final] = await db
      .select()
      .from(projectVersions)
      .innerJoin(projects, eq(projectVersions.projectId, projects.id))
      .where(
        and(
          eq(projectVersions.id, data.finalId),
          eq(projectVersions.projectId, data.projectId),
          eq(projects.userId, context.userId),
          eq(projectVersions.type, 'final')
        )
      )
      .limit(1);
    if (!final) throw new GenerationError('PROJECT_NOT_FOUND');
    const [revision] = await db
      .select({ id: projectVersions.id })
      .from(projectVersions)
      .where(eq(projectVersions.parentFinalId, data.finalId))
      .limit(1);
    if (revision) throw new GenerationError('REVISION_ALREADY_EXISTS');
    const settings = await assertGenerationCanStart(
      context.userId,
      data.instruction,
      data.requestId
    );
    const timestamp = new Date();
    const job = {
      id: crypto.randomUUID(),
      userId: context.userId,
      projectId: data.projectId,
      requestId: data.requestId,
      operation: 'revision' as const,
      inputVersionId: data.finalId,
      quality: 'medium',
      creditCost: settings.revisionCost,
      status: 'queued',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db.insert(generationJobs).values(job);
    await enqueue(job.id);
    return job;
  });

export const getGenerationJob = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ jobId: z.string().uuid() }))
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const [job] = await getDb()
      .select()
      .from(generationJobs)
      .where(
        and(
          eq(generationJobs.id, data.jobId),
          eq(generationJobs.userId, context.userId)
        )
      )
      .limit(1);
    if (!job) throw new GenerationError('PROJECT_NOT_FOUND');
    return job;
  });

export const listProjects = createServerFn({ method: 'GET' })
  .middleware([authApiMiddleware])
  .handler(({ context }) =>
    // Correlated subqueries keep the card metadata in one query, rather than
    // issuing a jobs/assets query for every project.
    getDb()
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        updatedAt: projects.updatedAt,
        latestJobStatus: sql<string | null>`(
          select status from generation_jobs
          where project_id = ${sql.raw('"projects"."id"')}
          order by created_at desc limit 1
        )`,
        thumbnailKey: sql<string | null>`(
          select uf.r2_key from generated_assets ga
          join project_versions pv on pv.id = ga.version_id
          join user_files uf on uf.id = ga.user_file_id
          where pv.project_id = ${sql.raw('"projects"."id"')}
            and ga.status = 'active' and ga.role in ('candidate_A', 'final', 'revision', 'hd_master')
          order by pv.version_number desc, ga.created_at desc limit 1
        )`,
      })
      .from(projects)
      .where(
        and(eq(projects.userId, context.userId), eq(projects.status, 'active'))
      )
      .orderBy(desc(projects.updatedAt))
  );

export const renameProject = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      projectId: z.string().uuid(),
      name: z.string().trim().min(1).max(120),
    })
  )
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const result = await getDb()
      .update(projects)
      .set({ name: data.name, updatedAt: new Date() })
      .where(
        and(
          eq(projects.id, data.projectId),
          eq(projects.userId, context.userId),
          eq(projects.status, 'active')
        )
      )
      .returning({ id: projects.id, name: projects.name });
    if (!result.length) throw new GenerationError('PROJECT_NOT_FOUND');
    return result[0];
  });

export const getProject = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ projectId: z.string().uuid() }))
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, data.projectId),
          eq(projects.userId, context.userId)
        )
      )
      .limit(1);
    if (!project) throw new GenerationError('PROJECT_NOT_FOUND');
    const versions = await db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.projectId, project.id))
      .orderBy(desc(projectVersions.versionNumber));
    const jobs = await db
      .select()
      .from(generationJobs)
      .where(eq(generationJobs.projectId, project.id))
      .orderBy(desc(generationJobs.createdAt));
    const assets = await db
      .select({ asset: generatedAssets, file: userFiles })
      .from(generatedAssets)
      .innerJoin(
        projectVersions,
        eq(generatedAssets.versionId, projectVersions.id)
      )
      .innerJoin(userFiles, eq(generatedAssets.userFileId, userFiles.id))
      .where(eq(projectVersions.projectId, project.id));
    const storedBrief = JSON.parse(project.brief) as Record<string, unknown>;
    const referenceFileIds = Array.isArray(storedBrief.referenceFileIds)
      ? storedBrief.referenceFileIds
          .filter((value): value is string => typeof value === 'string')
          .slice(0, 4)
      : [];
    const referenceFiles = referenceFileIds.length
      ? await db
          .select()
          .from(userFiles)
          .where(
            and(
              eq(userFiles.userId, context.userId),
              inArray(userFiles.id, referenceFileIds)
            )
          )
      : [];
    const referenceById = new Map(
      referenceFiles.map((file) => [file.id, file])
    );
    return {
      project,
      versions,
      jobs,
      assets,
      referenceFiles: referenceFileIds
        .map((id) => referenceById.get(id))
        .filter((file): file is NonNullable<typeof file> => Boolean(file)),
    };
  });

export const setProjectReferences = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      projectId: z.string().uuid(),
      referenceFileIds: z.array(z.string().uuid()).max(4),
    })
  )
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, data.projectId),
          eq(projects.userId, context.userId),
          eq(projects.status, 'active')
        )
      )
      .limit(1);
    if (!project) throw new GenerationError('PROJECT_NOT_FOUND');
    const referenceFileIds = await assertReferenceFiles(
      context.userId,
      data.referenceFileIds
    );
    const current = JSON.parse(project.brief) as Record<string, unknown>;
    await db
      .update(projects)
      .set({
        brief: JSON.stringify({ ...current, referenceFileIds }),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id));
    return { referenceFileIds };
  });

export const setActiveVersion = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ projectId: z.string().uuid(), versionId: z.string().uuid() })
  )
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const [version] = await getDb()
      .select({ id: projectVersions.id })
      .from(projectVersions)
      .innerJoin(projects, eq(projectVersions.projectId, projects.id))
      .where(
        and(
          eq(projects.id, data.projectId),
          eq(projects.userId, context.userId),
          eq(projectVersions.id, data.versionId)
        )
      )
      .limit(1);
    if (!version) throw new GenerationError('PROJECT_NOT_FOUND');
    await getDb()
      .update(projects)
      .set({ activeVersionId: data.versionId, updatedAt: new Date() })
      .where(eq(projects.id, data.projectId));
  });

export const deleteProject = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ projectId: z.string().uuid() }))
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    const result = await db
      .update(projects)
      .set({ status: 'deleting', deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(projects.id, data.projectId),
          eq(projects.userId, context.userId),
          eq(projects.status, 'active')
        )
      )
      .returning({ id: projects.id });
    if (result.length === 0) throw new GenerationError('PROJECT_NOT_FOUND');
    try {
      await queue().send({ type: 'delete_project', projectId: data.projectId });
    } catch (error) {
      // A queue outage must not make a project silently disappear. Restore it
      // so the user can retry the confirmed deletion.
      await db
        .update(projects)
        .set({ status: 'active', deletedAt: null, updatedAt: new Date() })
        .where(
          and(
            eq(projects.id, data.projectId),
            eq(projects.userId, context.userId),
            eq(projects.status, 'deleting')
          )
        );
      throw error;
    }
  });

export const getCreditSummary = createServerFn({ method: 'GET' })
  .middleware([authApiMiddleware])
  .handler(({ context }) => getCreditSummaryInternal(context.userId));

async function getCreditSummaryInternal(userId: string) {
  return getCreditSummaryForUser(userId);
}

export const listCreditLedger = createServerFn({ method: 'GET' })
  .middleware([authApiMiddleware])
  .handler(({ context }) => listCreditLedgerInternal(context.userId));

async function listCreditLedgerInternal(userId: string) {
  const entries = await listCreditLedgerForUser(userId);
  const jobIds = entries.flatMap((entry) => (entry.jobId ? [entry.jobId] : []));
  const linkedProjects = jobIds.length
    ? await getDb()
        .select({
          jobId: generationJobs.id,
          projectId: projects.id,
          projectName: projects.name,
        })
        .from(generationJobs)
        .innerJoin(projects, eq(generationJobs.projectId, projects.id))
        .where(
          and(
            inArray(generationJobs.id, jobIds),
            eq(generationJobs.userId, userId),
            eq(projects.userId, userId),
            eq(projects.status, 'active')
          )
        )
    : [];
  const byJob = new Map(
    linkedProjects.map((project) => [project.jobId, project])
  );
  return entries.map((entry) => ({
    id: entry.id,
    type: entry.type,
    planDelta: entry.planDelta,
    purchasedDelta: entry.purchasedDelta,
    createdAt: entry.createdAt,
    project: entry.jobId ? (byJob.get(entry.jobId) ?? null) : null,
  }));
}

async function findHdMasterAsset({
  userId,
  projectId,
  inputVersionId,
  candidate,
}: {
  userId: string;
  projectId: string;
  inputVersionId: string;
  candidate: z.infer<typeof candidateSchema>;
}) {
  const [master] = await getDb()
    .select({
      assetId: generatedAssets.id,
      versionId: generatedAssets.versionId,
      width: generatedAssets.width,
      height: generatedAssets.height,
      jobId: generationJobs.id,
    })
    .from(generatedAssets)
    .innerJoin(generationJobs, eq(generatedAssets.jobId, generationJobs.id))
    .where(
      and(
        eq(generationJobs.userId, userId),
        eq(generationJobs.projectId, projectId),
        eq(generationJobs.operation, 'hd_master'),
        eq(generationJobs.inputVersionId, inputVersionId),
        eq(generationJobs.candidate, candidate),
        eq(generationJobs.status, 'succeeded'),
        eq(generatedAssets.role, 'hd_master'),
        eq(generatedAssets.status, 'active'),
        eq(generatedAssets.width, 1024),
        eq(generatedAssets.height, 1024)
      )
    )
    .limit(1);
  return master ?? null;
}

export const ensureHdMaster = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      projectId: z.string().uuid(),
      sourceAssetId: z.string().uuid(),
    })
  )
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    const [source] = await db
      .select({
        versionId: projectVersions.id,
        role: generatedAssets.role,
      })
      .from(generatedAssets)
      .innerJoin(
        projectVersions,
        eq(generatedAssets.versionId, projectVersions.id)
      )
      .innerJoin(projects, eq(projectVersions.projectId, projects.id))
      .where(
        and(
          eq(generatedAssets.id, data.sourceAssetId),
          eq(generatedAssets.status, 'active'),
          eq(projects.id, data.projectId),
          eq(projects.userId, context.userId),
          eq(projects.status, 'active')
        )
      )
      .limit(1);
    if (!source || !source.role.startsWith('candidate_'))
      throw new GenerationError('PROJECT_NOT_FOUND');

    const candidate = candidateSchema.parse(source.role.slice(-1));
    const master = await findHdMasterAsset({
      userId: context.userId,
      projectId: data.projectId,
      inputVersionId: source.versionId,
      candidate,
    });
    if (master)
      return {
        status: 'ready' as const,
        masterAssetId: master.assetId,
        creditCost: 0,
      };

    const matchingJobs = await db
      .select()
      .from(generationJobs)
      .where(
        and(
          eq(generationJobs.userId, context.userId),
          eq(generationJobs.projectId, data.projectId),
          eq(generationJobs.operation, 'hd_master'),
          eq(generationJobs.inputVersionId, source.versionId),
          eq(generationJobs.candidate, candidate)
        )
      )
      .orderBy(desc(generationJobs.createdAt));
    const active = matchingJobs.find((job) =>
      ['queued', 'processing'].includes(job.status)
    );
    if (active)
      return {
        status: 'queued' as const,
        jobId: active.id,
        creditCost: HD_MASTER_CREDIT_COST,
      };

    await assertGenerationCanStart(
      context.userId,
      'Prepare a faithful 1024x1024 production master from an existing generated app icon.',
      crypto.randomUUID()
    );
    const credit = await getCreditSummaryForUser(context.userId);
    if (credit.planBalance + credit.purchasedBalance < HD_MASTER_CREDIT_COST)
      throw new GenerationError('INSUFFICIENT_CREDITS');

    const attempt = matchingJobs.length + 1;
    const requestId = `hd-master:${data.sourceAssetId}:${attempt}`;
    const timestamp = new Date();
    const job = {
      id: crypto.randomUUID(),
      userId: context.userId,
      projectId: data.projectId,
      requestId,
      operation: 'hd_master' as const,
      inputVersionId: source.versionId,
      candidate,
      quality: 'medium',
      creditCost: HD_MASTER_CREDIT_COST,
      status: 'queued',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const inserted = await db
      .insert(generationJobs)
      .values(job)
      .onConflictDoNothing()
      .returning();
    const queued =
      inserted[0] ??
      (
        await db
          .select()
          .from(generationJobs)
          .where(
            and(
              eq(generationJobs.userId, context.userId),
              eq(generationJobs.requestId, requestId)
            )
          )
          .limit(1)
      )[0];
    if (!queued) throw new GenerationError('PROVIDER_UNAVAILABLE');
    if (inserted.length) await enqueue(job.id);
    return {
      status: 'queued' as const,
      jobId: queued.id,
      creditCost: HD_MASTER_CREDIT_COST,
    };
  });

export const queueExport = createServerFn({ method: 'POST' })
  .inputValidator(
    z.discriminatedUnion('kind', [
      z.object({
        kind: z.literal('image'),
        projectId: z.string().uuid(),
        sourceAssetId: z.string().uuid(),
        rasterFormat: z.enum(['png', 'webp', 'avif', 'jpg']),
        size: z.number().int().min(16).max(1024),
      }),
      z.object({
        kind: z.literal('packages'),
        projectId: z.string().uuid(),
        sourceAssetId: z.string().uuid(),
        platforms: z
          .array(z.enum(['android', 'ios', 'web', 'macos']))
          .min(1)
          .max(4),
      }),
    ])
  )
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    const [source] = await db
      .select({
        assetId: generatedAssets.id,
        versionId: projectVersions.id,
        role: generatedAssets.role,
        width: generatedAssets.width,
      })
      .from(generatedAssets)
      .innerJoin(
        projectVersions,
        eq(generatedAssets.versionId, projectVersions.id)
      )
      .innerJoin(projects, eq(projectVersions.projectId, projects.id))
      .where(
        and(
          eq(generatedAssets.id, data.sourceAssetId),
          eq(generatedAssets.status, 'active'),
          eq(projects.id, data.projectId),
          eq(projects.userId, context.userId),
          eq(projects.status, 'active')
        )
      )
      .limit(1);
    if (
      !source ||
      (!source.role.startsWith('candidate_') &&
        !['final', 'revision', 'hd_master'].includes(source.role))
    )
      throw new GenerationError('PROJECT_NOT_FOUND');

    const requiresHd =
      (data.kind === 'image' && data.size > 512) ||
      (data.kind === 'packages' &&
        data.platforms.some(
          (platform) => platform === 'ios' || platform === 'macos'
        ));
    let resolvedSource = source;
    if (requiresHd && source.width < 1024) {
      if (!source.role.startsWith('candidate_'))
        throw new GenerationError('HD_MASTER_REQUIRED');
      const candidate = candidateSchema.parse(source.role.slice(-1));
      const master = await findHdMasterAsset({
        userId: context.userId,
        projectId: data.projectId,
        inputVersionId: source.versionId,
        candidate,
      });
      if (!master) throw new GenerationError('HD_MASTER_REQUIRED');
      resolvedSource = {
        assetId: master.assetId,
        versionId: master.versionId ?? source.versionId,
        role: 'hd_master',
        width: master.width,
      };
    }

    const timestamp = new Date();
    const exportId = crypto.randomUUID();
    await db.insert(exportRecords).values({
      id: exportId,
      userId: context.userId,
      projectId: data.projectId,
      versionId: resolvedSource.versionId,
      format: JSON.stringify(
        data.kind === 'image'
          ? {
              kind: 'image',
              sourceAssetId: resolvedSource.assetId,
              format: data.rasterFormat,
              size: data.size,
            }
          : {
              kind: 'packages',
              sourceAssetId: resolvedSource.assetId,
              platforms: [...new Set(data.platforms)],
            }
      ),
      manifestSchemaVersion: 2,
      status: 'queued',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    try {
      await queue().send({ type: 'export', exportId });
    } catch {
      // A record with no queue message must not block project cleanup forever.
      // Do not overwrite an export that a consumer has already claimed.
      await db
        .update(exportRecords)
        .set({
          status: 'failed',
          failureCode: 'PROVIDER_UNAVAILABLE',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(exportRecords.id, exportId),
            eq(exportRecords.status, 'queued')
          )
        );
      throw new GenerationError('PROVIDER_UNAVAILABLE');
    }
    return { id: exportId, status: 'queued' };
  });

export const getExportStatus = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ exportId: z.string().uuid() }))
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const [record] = await getDb()
      .select()
      .from(exportRecords)
      .where(
        and(
          eq(exportRecords.id, data.exportId),
          eq(exportRecords.userId, context.userId)
        )
      )
      .limit(1);
    if (!record) throw new GenerationError('PROJECT_NOT_FOUND');
    return record;
  });

export const generationErrorCode = errorCode;
