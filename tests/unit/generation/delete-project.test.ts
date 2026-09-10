import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({
  db: undefined as unknown,
  keys: new Set<string>(),
  failed: false,
  deletes: [] as string[][],
  send: vi.fn(),
}));
vi.mock('cloudflare:workers', () => ({
  env: {
    NODDI_JOBS: { send: state.send },
    BUCKET: {
      list: vi.fn(
        async ({ prefix, cursor }: { prefix: string; cursor?: string }) => {
          const keys = [...state.keys]
            .filter(
              (key) => key.startsWith(prefix) && (!cursor || key > cursor)
            )
            .sort();
          const page = keys.slice(0, 1);
          return {
            objects: page.map((key) => ({ key })),
            truncated: keys.length > page.length,
            cursor: keys.length > page.length ? page[0] : undefined,
          };
        }
      ),
      delete: vi.fn(async (keys: string[]) => {
        if (state.failed) {
          state.failed = false;
          throw new Error('R2 unavailable');
        }
        state.deletes.push(keys);
        for (const key of keys) state.keys.delete(key);
      }),
    },
  },
}));
vi.mock('@/db', () => ({ getDb: () => state.db }));

import {
  processProjectDeletion,
  requeueProjectDeletions,
} from '@/generation/delete-project';

let sqlite: DatabaseSync;
beforeEach(() => {
  sqlite = new DatabaseSync(':memory:');
  for (const file of readdirSync('src/db/migrations')
    .filter((x) => x.endsWith('.sql'))
    .sort())
    sqlite.exec(readFileSync(`src/db/migrations/${file}`, 'utf8'));
  const execute = async (query: string, params: unknown[]) => ({
    rows: sqlite
      .prepare(query)
      .all(...(params as SQLInputValue[]))
      .map(Object.values),
  });
  state.db = drizzle(execute, async (queries) =>
    Promise.all(queries.map(({ sql, params }) => execute(sql, params)))
  );
  state.keys = new Set([
    'projects/owner-a/project-a/raw.png',
    'projects/owner-a/project-a/orphan.bin',
    'projects/owner-b/project-b/keep.png',
    'uploads/owner-a/reference.png',
  ]);
  state.failed = false;
  state.deletes = [];
  state.send.mockReset();
  for (const owner of ['owner-a', 'owner-b'])
    sqlite
      .prepare(
        'insert into user (id,name,email,created_at,updated_at) values (?,?,?,?,?)'
      )
      .run(owner, owner, `${owner}@x.test`, 1, 1);
  for (const [id, userId, status] of [
    ['project-a', 'owner-a', 'deleting'],
    ['project-b', 'owner-b', 'active'],
  ] as const)
    sqlite
      .prepare(
        'insert into projects (id,user_id,name,brief,status,created_at,updated_at) values (?,?,?,?,?,?,?)'
      )
      .run(id, userId, id, '{}', status, 1, 1);
  sqlite.exec(`
    insert into user_files (id,user_id,filename,original_name,content_type,size,r2_key,is_public,created_at,updated_at)
      values ('project-file','owner-a','x','x','image/png',1,'projects/owner-a/project-a/raw.png',0,1,1),
             ('reference','owner-a','r','r','image/png',1,'uploads/owner-a/reference.png',0,1,1);
    insert into project_versions (id,project_id,type,prompt_template_version,version_number,created_at)
      values ('version-a','project-a','concept_sheet','1',1,1);
    insert into generation_jobs (id,user_id,project_id,request_id,operation,credit_cost,status,created_at,updated_at)
      values ('job-a','owner-a','project-a','request-a','grid',2,'succeeded',1,1);
    insert into generation_attempts (id,job_id,channel,model,base_host,estimated_cost_micros,status,created_at)
      values ('attempt-a','job-a','primary','test','example.test',1,'succeeded',1);
    insert into generated_assets (id,version_id,job_id,user_file_id,role,width,height,sha256,status,created_at)
      values ('asset-a','version-a','job-a','project-file','candidate_A',512,512,'test','active',1);
    insert into exports (id,user_id,project_id,version_id,format,status,output_file_id,created_at,updated_at)
      values ('export-a','owner-a','project-a','version-a','png','succeeded','project-file',1,1);
    insert into download_events (id,export_id,user_id,downloaded_at)
      values ('download-a','export-a','owner-a',1);
    insert into payment (id,price_id,user_id,customer_id,type,status,paid,created_at,updated_at)
      values ('payment-a','test-pack','owner-a','test-customer','one_time','completed',1,1,1);
    insert into credit_ledger (id,operation_id,user_id,type,job_id,payment_id,created_at)
      values ('ledger-a','operation-a','owner-a','generation_debit','job-a','payment-a',1);
  `);
});
afterEach(() => sqlite.close());

test('requeues only stale deletions, retaining retry eligibility on queue failure', async () => {
  state.send.mockRejectedValueOnce(new Error('Queue unavailable'));
  await expect(requeueProjectDeletions()).rejects.toThrow('Queue unavailable');
  expect(
    sqlite.prepare("select updated_at from projects where id='project-a'").get()
  ).toEqual({ updated_at: 1 });
  await requeueProjectDeletions();
  expect(state.send).toHaveBeenLastCalledWith({
    type: 'delete_project',
    projectId: 'project-a',
  });
  expect(state.send).toHaveBeenCalledTimes(2);
  await requeueProjectDeletions();
  expect(state.send).toHaveBeenCalledTimes(2);
});

test('paginates project prefix, retries R2 failure, and cascades only deleting project metadata', async () => {
  state.failed = true;
  await expect(processProjectDeletion('project-a')).rejects.toThrow(
    'R2 unavailable'
  );
  expect(
    sqlite.prepare("select status from projects where id='project-a'").get()
  ).toBeTruthy();
  await processProjectDeletion('project-a');
  await processProjectDeletion('project-a'); // duplicate queue delivery
  expect(state.keys).toEqual(
    new Set([
      'projects/owner-b/project-b/keep.png',
      'uploads/owner-a/reference.png',
    ])
  );
  expect(
    sqlite.prepare("select id from projects where id='project-a'").get()
  ).toBeUndefined();
  expect(
    sqlite.prepare("select id from projects where id='project-b'").get()
  ).toBeTruthy();
  expect(
    sqlite.prepare("select id from user_files where id='reference'").get()
  ).toBeTruthy();
  expect(
    sqlite.prepare("select id from user_files where id='project-file'").get()
  ).toBeUndefined();
  for (const table of [
    'project_versions',
    'generation_jobs',
    'generation_attempts',
    'generated_assets',
    'exports',
    'download_events',
  ]) {
    expect(
      sqlite.prepare(`select count(*) as count from ${table}`).get()
    ).toEqual({ count: 0 });
  }
  expect(
    sqlite.prepare("select id from payment where id='payment-a'").get()
  ).toEqual({ id: 'payment-a' });
  expect(
    sqlite.prepare("select id from credit_ledger where id='ledger-a'").get()
  ).toEqual({ id: 'ledger-a' });
});

test('does not delete active projects or a deleting project with work in flight', async () => {
  await processProjectDeletion('project-b');
  expect(
    sqlite.prepare("select id from projects where id='project-b'").get()
  ).toBeTruthy();
  sqlite
    .prepare(
      'insert into generation_jobs (id,user_id,project_id,request_id,operation,credit_cost,status,created_at,updated_at) values (?,?,?,?,?,?,?,?,?)'
    )
    .run(
      'busy',
      'owner-a',
      'project-a',
      'request-busy',
      'grid',
      1,
      'processing',
      1,
      1
    );
  await expect(processProjectDeletion('project-a')).rejects.toThrow(
    'PROJECT_WORK_IN_PROGRESS'
  );
  expect(
    sqlite.prepare("select id from projects where id='project-a'").get()
  ).toBeTruthy();
  expect(state.deletes).toHaveLength(0);
});

test.each([
  'queued',
  'processing',
])('waits for %s exports before removing any file', async (status) => {
  sqlite.prepare("update exports set status=? where id='export-a'").run(status);
  await expect(processProjectDeletion('project-a')).rejects.toThrow(
    'PROJECT_WORK_IN_PROGRESS'
  );
  expect(state.deletes).toHaveLength(0);
  expect(
    sqlite.prepare("select id from projects where id='project-a'").get()
  ).toBeTruthy();
});
