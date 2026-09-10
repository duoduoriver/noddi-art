import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import type {
  PaymentScene,
  PaymentStatus,
  PaymentType,
  PlanInterval,
} from '@/payment/types';
import { user } from './auth.schema';

/** Payment provider record. Buyer PII is removed on account deletion. */
export const payment = sqliteTable(
  'payment',
  {
    id: text('id').primaryKey(),
    priceId: text('price_id').notNull(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    customerId: text('customer_id').notNull(),
    subscriptionId: text('subscription_id'),
    sessionId: text('session_id'),
    invoiceId: text('invoice_id').unique(),
    type: text('type').notNull().$type<PaymentType>(),
    scene: text('scene').$type<PaymentScene>(),
    interval: text('interval').$type<PlanInterval>(),
    status: text('status').notNull().$type<PaymentStatus>(),
    paid: integer('paid', { mode: 'boolean' }).notNull().default(false),
    periodStart: integer('period_start', { mode: 'timestamp_ms' }),
    periodEnd: integer('period_end', { mode: 'timestamp_ms' }),
    cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }),
    trialStart: integer('trial_start', { mode: 'timestamp_ms' }),
    trialEnd: integer('trial_end', { mode: 'timestamp_ms' }),
    subjectHash: text('subject_hash'),
    retainUntil: integer('retain_until', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('payment_user_id_idx').on(table.userId),
    index('payment_customer_id_idx').on(table.customerId),
    index('payment_subscription_id_idx').on(table.subscriptionId),
    index('payment_session_id_idx').on(table.sessionId),
    index('payment_invoice_id_idx').on(table.invoiceId),
    index('payment_paid_idx').on(table.paid),
    index('payment_user_paid_idx').on(table.userId, table.paid),
  ]
);

export const paymentRelations = relations(payment, ({ one }) => ({
  user: one(user, { fields: [payment.userId], references: [user.id] }),
}));

/** Metadata for private and public R2 objects. */
export const userFiles = sqliteTable(
  'user_files',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(),
    originalName: text('original_name').notNull(),
    contentType: text('content_type').notNull(),
    size: integer('size').notNull(),
    r2Key: text('r2_key').notNull(),
    isPublic: integer('is_public', { mode: 'boolean' }),
    description: text('description'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('user_files_user_id_idx').on(table.userId),
    uniqueIndex('user_files_r2_key_unique').on(table.r2Key),
  ]
);

export const userFilesRelations = relations(userFiles, ({ one }) => ({
  user: one(user, { fields: [userFiles.userId], references: [user.id] }),
}));

export const creditAccounts = sqliteTable(
  'credit_accounts',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    planBalance: integer('plan_balance').notNull().default(0),
    purchasedBalance: integer('purchased_balance').notNull().default(0),
    refundDebt: integer('refund_debt').notNull().default(0),
    planCode: text('plan_code').notNull().default('free'),
    planAllowance: integer('plan_allowance').notNull().default(2),
    periodEnd: integer('period_end', { mode: 'timestamp_ms' }),
    paidAccessAt: integer('paid_access_at', { mode: 'timestamp_ms' }),
    issuedTotal: integer('issued_total').notNull().default(0),
    consumedTotal: integer('consumed_total').notNull().default(0),
    version: integer('version').notNull().default(0),
    lastOperationId: text('last_operation_id'),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  }
);

export const creditLedger = sqliteTable(
  'credit_ledger',
  {
    id: text('id').primaryKey(),
    operationId: text('operation_id').notNull(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    subjectHash: text('subject_hash'),
    planDelta: integer('plan_delta').notNull().default(0),
    purchasedDelta: integer('purchased_delta').notNull().default(0),
    debtDelta: integer('debt_delta').notNull().default(0),
    type: text('type').notNull(),
    jobId: text('job_id'),
    paymentId: text('payment_id'),
    periodKey: text('period_key'),
    adminActionId: text('admin_action_id'),
    metadata: text('metadata'),
    retainUntil: integer('retain_until', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('credit_ledger_operation_unique').on(table.operationId),
    uniqueIndex('credit_ledger_job_type_unique').on(table.jobId, table.type),
    uniqueIndex('credit_ledger_payment_period_type_unique').on(
      table.paymentId,
      table.periodKey,
      table.type
    ),
    index('credit_ledger_user_created_idx').on(table.userId, table.createdAt),
  ]
);

export const paymentWebhooks = sqliteTable(
  'payment_webhooks',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id').notNull(),
    orderId: text('order_id'),
    paymentId: text('payment_id'),
    periodKey: text('period_key'),
    productId: text('product_id'),
    type: text('type').notNull(),
    payloadHash: text('payload_hash').notNull(),
    status: text('status').notNull(),
    errorSummary: text('error_summary'),
    subjectHash: text('subject_hash'),
    retainUntil: integer('retain_until', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('payment_webhooks_event_unique').on(table.eventId),
    index('payment_webhooks_order_idx').on(table.orderId),
  ]
);

export const usageDaily = sqliteTable(
  'usage_daily',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    utcDate: text('utc_date').notNull(),
    count: integer('count').notNull().default(0),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('usage_daily_user_date_unique').on(table.userId, table.utcDate)]
);

export const imageBudgetMonths = sqliteTable(
  'image_budget_months',
  {
    month: text('month').primaryKey(),
    budgetMicros: integer('budget_micros').notNull(),
    reservedMicros: integer('reserved_micros').notNull().default(0),
    version: integer('version').notNull().default(0),
    lastOperationId: text('last_operation_id'),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  }
);

export const systemSettings = sqliteTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
});

export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    brief: text('brief').notNull(),
    activeVersionId: text('active_version_id'),
    status: text('status').notNull().default('active'),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('projects_user_updated_idx').on(table.userId, table.updatedAt)]
);

export const projectVersions = sqliteTable(
  'project_versions',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    parentVersionId: text('parent_version_id'),
    parentFinalId: text('parent_final_id'),
    candidate: text('candidate'),
    quality: text('quality'),
    userInstruction: text('user_instruction'),
    promptTemplateVersion: text('prompt_template_version').notNull(),
    versionNumber: integer('version_number').notNull(),
    qualityWarnings: text('quality_warnings'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('project_versions_project_number_unique').on(
      table.projectId,
      table.versionNumber
    ),
    uniqueIndex('project_versions_one_revision_per_final').on(table.parentFinalId),
    index('project_versions_project_created_idx').on(table.projectId, table.createdAt),
  ]
);

export const generationJobs = sqliteTable(
  'generation_jobs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    requestId: text('request_id').notNull(),
    operation: text('operation').notNull(),
    inputVersionId: text('input_version_id'),
    candidate: text('candidate'),
    quality: text('quality'),
    creditCost: integer('credit_cost').notNull(),
    status: text('status').notNull().default('queued'),
    planDebited: integer('plan_debited').notNull().default(0),
    purchasedDebited: integer('purchased_debited').notNull().default(0),
    failureCode: text('failure_code'),
    outputVersionId: text('output_version_id'),
    claimedAt: integer('claimed_at', { mode: 'timestamp_ms' }),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('generation_jobs_user_request_unique').on(table.userId, table.requestId),
    index('generation_jobs_project_created_idx').on(table.projectId, table.createdAt),
    index('generation_jobs_status_idx').on(table.status),
  ]
);

export const generationAttempts = sqliteTable(
  'generation_attempts',
  {
    id: text('id').primaryKey(),
    jobId: text('job_id')
      .notNull()
      .references(() => generationJobs.id, { onDelete: 'cascade' }),
    channel: text('channel').notNull(),
    model: text('model').notNull(),
    baseHost: text('base_host').notNull(),
    estimatedCostMicros: integer('estimated_cost_micros').notNull(),
    status: text('status').notNull(),
    httpStatus: integer('http_status'),
    latencyMs: integer('latency_ms'),
    errorSummary: text('error_summary'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('generation_attempts_job_created_idx').on(table.jobId, table.createdAt)]
);

export const generatedAssets = sqliteTable(
  'generated_assets',
  {
    id: text('id').primaryKey(),
    versionId: text('version_id').references(() => projectVersions.id, {
      onDelete: 'cascade',
    }),
    jobId: text('job_id').references(() => generationJobs.id, { onDelete: 'cascade' }),
    userFileId: text('user_file_id')
      .notNull()
      .references(() => userFiles.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    sha256: text('sha256').notNull(),
    status: text('status').notNull().default('active'),
    purgeAfter: integer('purge_after', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('generated_assets_version_idx').on(table.versionId)]
);

export const exportRecords = sqliteTable(
  'exports',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    versionId: text('version_id')
      .notNull()
      .references(() => projectVersions.id, { onDelete: 'cascade' }),
    format: text('format').notNull(),
    status: text('status').notNull().default('queued'),
    manifestSchemaVersion: integer('manifest_schema_version').notNull().default(1),
    outputFileId: text('output_file_id').references(() => userFiles.id, {
      onDelete: 'set null',
    }),
    failureCode: text('failure_code'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('exports_user_created_idx').on(table.userId, table.createdAt)]
);

export const downloadEvents = sqliteTable(
  'download_events',
  {
    id: text('id').primaryKey(),
    exportId: text('export_id')
      .notNull()
      .references(() => exportRecords.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    downloadedAt: integer('downloaded_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('download_events_export_idx').on(table.exportId)]
);

export const adminCases = sqliteTable(
  'admin_cases',
  {
    id: text('id').primaryKey(),
    status: text('status').notNull().default('open'),
    type: text('type').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    summary: text('summary').notNull(),
    assignedTo: text('assigned_to').references(() => user.id, { onDelete: 'set null' }),
    resolvedBy: text('resolved_by').references(() => user.id, { onDelete: 'set null' }),
    resolvedAt: integer('resolved_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('admin_cases_status_created_idx').on(table.status, table.createdAt)]
);

export const adminActions = sqliteTable(
  'admin_actions',
  {
    id: text('id').primaryKey(),
    adminUserId: text('admin_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    caseId: text('case_id').references(() => adminCases.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    metadata: text('metadata'),
    subjectHash: text('subject_hash'),
    retainUntil: integer('retain_until', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('admin_actions_target_created_idx').on(table.targetId, table.createdAt)]
);
