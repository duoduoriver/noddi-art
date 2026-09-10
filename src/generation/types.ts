export const GENERATION_ERROR_CODES = [
  'TURNSTILE_FAILED',
  'MODERATION_UNAVAILABLE',
  'CONTENT_POLICY',
  'DAILY_LIMIT_REACHED',
  'BUDGET_EXHAUSTED',
  'INSUFFICIENT_CREDITS',
  'PAID_ACCESS_REQUIRED',
  'EXPORT_FROZEN',
  'HD_MASTER_REQUIRED',
  'REVISION_ALREADY_EXISTS',
  'PROVIDER_UNAVAILABLE',
  'INVALID_IMAGE',
  'PROJECT_NOT_FOUND',
] as const;

export type GenerationErrorCode = (typeof GENERATION_ERROR_CODES)[number];
export type GenerationOperation = 'grid' | 'final' | 'revision' | 'hd_master';
export const HD_MASTER_CREDIT_COST = 1;
export type GenerationQuality = 'medium' | 'high';
export type GenerationJobMessage = {
  type: 'generation';
  jobId: string;
};
export type ExportJobMessage = { type: 'export'; exportId: string };
export type DeleteProjectMessage = {
  type: 'delete_project';
  projectId: string;
};
export type DeleteAccountMessage = { type: 'delete_account'; userId: string };
export type PurgeAssetMessage = { type: 'purge_asset'; assetId: string };
export type NoddiJobMessage =
  | GenerationJobMessage
  | ExportJobMessage
  | DeleteProjectMessage
  | DeleteAccountMessage
  | PurgeAssetMessage;

export class GenerationError extends Error {
  constructor(public readonly code: GenerationErrorCode) {
    super(code);
    this.name = 'GenerationError';
  }
}

export const isTerminalJobStatus = (status: string) =>
  ['succeeded', 'failed', 'refunded'].includes(status);
