import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ZodType } from 'zod';

const mocks = vi.hoisted(() => ({
  returning: vi.fn(),
  where: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  orderBy: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  limit: vi.fn(),
  send: vi.fn(),
  insert: vi.fn(),
  values: vi.fn(),
  innerJoin: vi.fn(),
}));

vi.mock('cloudflare:workers', () => ({
  env: { NODDI_JOBS: { send: mocks.send } },
}));
vi.mock('drizzle-orm', () => ({
  and: (...values: unknown[]) => values,
  desc: (value: unknown) => value,
  eq: (...values: unknown[]) => values,
  inArray: (...values: unknown[]) => values,
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings,
      values,
    }),
    { raw: (value: string) => value }
  ),
}));
vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    let schema: ZodType | undefined;
    const chain = {
      inputValidator(value: ZodType) {
        schema = value;
        return chain;
      },
      middleware: () => chain,
      handler: (handler: (args: unknown) => unknown) => ({ schema, handler }),
    };
    return chain;
  },
}));
vi.mock('@/db', () => ({
  getDb: () => ({
    update: mocks.update,
    select: mocks.select,
    insert: mocks.insert,
  }),
}));
vi.mock('@/db/app.schema', () => ({
  exportRecords: { id: 'export-id', status: 'export-status' },
  generationJobs: { createdAt: 'job-created-at', status: 'job-status' },
  generatedAssets: {},
  projectVersions: {},
  projects: {
    id: 'project-id',
    name: 'project-name',
    status: 'project-status',
    updatedAt: 'project-updated-at',
    userId: 'project-user-id',
  },
  userFiles: {},
  payment: {
    id: 'payment-id',
    priceId: 'price-id',
    type: 'type',
    scene: 'scene',
    status: 'status',
    paid: 'paid',
    createdAt: 'payment-created-at',
    userId: 'payment-user-id',
  },
}));
vi.mock('@/db/auth.schema', () => ({ user: {} }));
vi.mock('@/credits/service', () => ({
  getCreditSummary: vi.fn(),
  hasPaidAccess: vi.fn(),
  listCreditLedger: vi.fn(),
}));
vi.mock('@/middlewares/auth-middleware', () => ({ authApiMiddleware: {} }));
vi.mock('@/image/openai-compat', () => ({
  getImageChannels: vi.fn(),
  ImageProviderError: class extends Error {},
  moderatePrompt: vi.fn(),
}));
vi.mock('@/generation/settings', () => ({ getOperationalSettings: vi.fn() }));
vi.mock('@/generation/types', () => ({
  GenerationError: class extends Error {},
  HD_MASTER_CREDIT_COST: 40,
}));
vi.mock('@/payment', () => ({
  createCheckout: vi.fn(),
  createCustomerPortal: vi.fn(),
  getPaymentProvider: vi.fn(),
}));
vi.mock('@/config/website', () => ({
  websiteConfig: { payment: { enable: false } },
}));
vi.mock('@/lib/price-plan', () => ({
  findPlanByPlanId: vi.fn(),
  findPlanByPriceId: vi.fn(),
  findPriceInPlan: vi.fn(),
  getAllPricePlans: vi.fn(),
}));

import {
  deleteProject,
  listProjects,
  renameProject,
  queueExport,
} from '@/api/generation';
import { getPaymentHistory } from '@/api/payment';

type MockServerFunction = {
  schema: ZodType;
  handler: (args: {
    data?: { projectId: string; name?: string };
    context: { userId: string };
  }) => Promise<unknown>;
};
const rename = renameProject as unknown as MockServerFunction;
const remove = deleteProject as unknown as MockServerFunction;
const list = listProjects as unknown as MockServerFunction;
const history = getPaymentHistory as unknown as MockServerFunction;
const projectId = '00000000-0000-4000-8000-000000000000';
const context = { userId: 'owner-1' };
const projectScope = [
  ['project-id', projectId],
  ['project-user-id', context.userId],
  ['project-status', 'active'],
];

afterEach(() => vi.resetAllMocks());
beforeEach(() => {
  mocks.returning.mockResolvedValue([{ id: projectId, name: 'Renamed' }]);
  mocks.update.mockReturnValue({ set: mocks.set });
  mocks.set.mockReturnValue({ where: mocks.where });
  mocks.select.mockReturnValue({ from: mocks.from });
  mocks.from.mockReturnValue({
    where: mocks.where,
    innerJoin: mocks.innerJoin,
  });
  mocks.innerJoin.mockReturnValue({
    innerJoin: mocks.innerJoin,
    where: mocks.where,
  });
  mocks.insert.mockReturnValue({ values: mocks.values });
  mocks.values.mockResolvedValue(undefined);
  mocks.where.mockReturnValue({
    orderBy: mocks.orderBy,
    returning: mocks.returning,
    limit: mocks.limit,
  });
  mocks.orderBy.mockReturnValue({ limit: mocks.limit });
  mocks.limit.mockResolvedValue([]);
});

describe('account API ownership and lifecycle predicates', () => {
  test('failed export enqueue marks only the unclaimed export failed', async () => {
    mocks.limit.mockResolvedValueOnce([
      {
        assetId: 'asset-a',
        versionId: 'version-a',
        role: 'candidate_A',
        width: 512,
      },
    ]);
    mocks.send.mockRejectedValueOnce(new Error('Queue unavailable'));
    const exportHandler = queueExport as unknown as {
      handler: (args: {
        context: typeof context;
        data: {
          kind: string;
          projectId: string;
          sourceAssetId: string;
          rasterFormat: string;
          size: number;
        };
      }) => Promise<unknown>;
    };
    await expect(
      exportHandler.handler({
        context,
        data: {
          kind: 'image',
          projectId,
          sourceAssetId: 'asset-a',
          rasterFormat: 'png',
          size: 512,
        },
      })
    ).rejects.toThrow('PROVIDER_UNAVAILABLE');
    const exportId = mocks.values.mock.calls[0][0].id;
    expect(mocks.where).toHaveBeenLastCalledWith([
      ['export-id', exportId],
      ['export-status', 'queued'],
    ]);
    expect(mocks.set).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: 'failed',
        failureCode: 'PROVIDER_UNAVAILABLE',
      })
    );
  });
  test('rejects blank and overlong names and trims valid names', () => {
    expect(rename.schema.safeParse({ projectId, name: '   ' }).success).toBe(
      false
    );
    expect(
      rename.schema.safeParse({ projectId, name: 'x'.repeat(121) }).success
    ).toBe(false);
    expect(rename.schema.parse({ projectId, name: '  New name  ' })).toEqual({
      projectId,
      name: 'New name',
    });
  });

  test('rename requires matching project ID, owner and active status', async () => {
    await rename.handler({ data: { projectId, name: 'Renamed' }, context });
    expect(mocks.where).toHaveBeenCalledWith(projectScope);
  });

  test('rename rejects a project outside the owner scope', async () => {
    mocks.returning.mockResolvedValueOnce([]);
    await expect(
      rename.handler({ data: { projectId, name: 'Renamed' }, context })
    ).rejects.toThrow('PROJECT_NOT_FOUND');
  });

  test('list filters by authenticated owner and active status', async () => {
    await list.handler({ context });
    expect(mocks.where).toHaveBeenCalledWith([
      ['project-user-id', context.userId],
      ['project-status', 'active'],
    ]);
    expect(mocks.orderBy).toHaveBeenCalledWith('project-updated-at');
  });

  test('deletion claims only active projects and restores only deleting ones after a queue failure', async () => {
    mocks.send.mockRejectedValueOnce(new Error('Queue unavailable'));
    await expect(
      remove.handler({ data: { projectId }, context })
    ).rejects.toThrow('Queue unavailable');
    expect(mocks.where).toHaveBeenNthCalledWith(1, projectScope);
    expect(mocks.where).toHaveBeenNthCalledWith(2, [
      ['project-id', projectId],
      ['project-user-id', context.userId],
      ['project-status', 'deleting'],
    ]);
    expect(mocks.set).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'active', deletedAt: null })
    );
  });

  test('an already deleted or concurrently claimed project is not queued or restored', async () => {
    mocks.returning.mockResolvedValueOnce([]);
    await expect(
      remove.handler({ data: { projectId }, context })
    ).rejects.toThrow('PROJECT_NOT_FOUND');
    expect(mocks.where).toHaveBeenCalledExactlyOnceWith(projectScope);
    expect(mocks.set).toHaveBeenCalledTimes(1);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  test('orders are owner-scoped, bounded and expose only approved fields', async () => {
    await history.handler({ context });
    expect(mocks.where).toHaveBeenCalledWith([
      'payment-user-id',
      context.userId,
    ]);
    expect(mocks.orderBy).toHaveBeenCalledWith('payment-created-at');
    expect(mocks.limit).toHaveBeenCalledWith(50);
    expect(Object.keys(mocks.select.mock.calls[0][0]).sort()).toEqual([
      'createdAt',
      'id',
      'paid',
      'priceId',
      'scene',
      'status',
      'type',
    ]);
  });
});
