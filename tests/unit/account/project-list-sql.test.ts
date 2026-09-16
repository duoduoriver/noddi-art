import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({ db: undefined as unknown }));
vi.mock('cloudflare:workers', () => ({ env: {} }));
vi.mock('@/db', () => ({ getDb: () => state.db }));
vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    const chain = {
      inputValidator: () => chain,
      middleware: () => chain,
      handler: (handler: unknown) => handler,
    };
    return chain;
  },
}));
vi.mock('@/credits/service', () => ({
  getCreditSummary: vi.fn(),
  hasPaidAccess: vi.fn(),
  listCreditLedger: vi.fn(),
}));
vi.mock('@/middlewares/auth-middleware', () => ({ authApiMiddleware: {} }));
vi.mock('@/image/openai-compat', () => ({
  getImageChannels: vi.fn(),
  ImageProviderError: class extends Error {},
}));
vi.mock('@/generation/settings', () => ({ getOperationalSettings: vi.fn() }));

import { listProjects } from '@/api/generation';

let sqlite: DatabaseSync;
beforeEach(() => {
  sqlite = new DatabaseSync(':memory:');
  for (const name of readdirSync('src/db/migrations')
    .filter((file) => file.endsWith('.sql'))
    .sort()) {
    sqlite.exec(readFileSync(`src/db/migrations/${name}`, 'utf8'));
  }
  state.db = drizzle(async (query, params) => ({
    rows: sqlite
      .prepare(query)
      .all(...(params as SQLInputValue[]))
      .map(Object.values),
  }));
  for (const owner of ['owner-a', 'owner-b']) {
    sqlite
      .prepare(
        'insert into user (id,name,email,created_at,updated_at) values (?,?,?,?,?)'
      )
      .run(owner, owner, `${owner}@example.test`, 1, 1);
  }
  for (const [id, owner, status, updated] of [
    ['project-a', 'owner-a', 'active', 3],
    ['project-b', 'owner-b', 'active', 2],
    ['project-deleted', 'owner-a', 'deleted', 4],
    ['project-deleting', 'owner-a', 'deleting', 5],
  ] as const) {
    sqlite
      .prepare(
        'insert into projects (id,user_id,name,brief,status,created_at,updated_at) values (?,?,?,?,?,?,?)'
      )
      .run(id, owner, id, '{}', status, 1, updated);
  }
  for (const [owner, project, status] of [
    ['owner-a', 'project-a', 'succeeded'],
    ['owner-b', 'project-b', 'failed'],
  ]) {
    sqlite
      .prepare(
        'insert into generation_jobs (id,user_id,project_id,request_id,operation,credit_cost,status,created_at,updated_at) values (?,?,?,?,?,?,?,?,?)'
      )
      .run(
        `job-${project}`,
        owner,
        project,
        `request-${project}`,
        'grid',
        2,
        status,
        1,
        1
      );
  }
  sqlite.exec(`
    insert into project_versions (id,project_id,type,prompt_template_version,version_number,created_at)
      values ('version-a','project-a','concept_sheet','1',1,1);
    insert into user_files (id,user_id,filename,original_name,content_type,size,r2_key,is_public,created_at,updated_at)
      values ('file-a','owner-a','icon.png','icon.png','image/png',1,'private/owner-a/icon.png',0,1,1);
    insert into generated_assets (id,version_id,user_file_id,role,width,height,sha256,status,created_at)
      values ('asset-a','version-a','file-a','candidate_A',512,512,'test','active',1);
  `);
});
afterEach(() => sqlite.close());

test('actual SQL returns only owned active projects with their own latest job and thumbnail', async () => {
  const handler = listProjects as unknown as (args: {
    context: { userId: string };
  }) => ReturnType<typeof listProjects>;
  const result = await handler({ context: { userId: 'owner-a' } });
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({
    id: 'project-a',
    latestJobStatus: 'succeeded',
    thumbnailKey: 'private/owner-a/icon.png',
  });
  const other = await handler({ context: { userId: 'owner-b' } });
  expect(other).toHaveLength(1);
  expect(other[0]).toMatchObject({
    id: 'project-b',
    latestJobStatus: 'failed',
    thumbnailKey: null,
  });
});
