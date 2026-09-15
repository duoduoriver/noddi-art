import { hashPassword } from 'better-auth/crypto';
import { DatabaseSync } from 'node:sqlite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ACCOUNT_NAME = 'noddi Local Admin';
const d1Directory = resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');

function readPassword() {
  if (!process.stdin.isTTY) {
    throw new Error('Run this command from an interactive terminal.');
  }

  return new Promise<string>((resolvePassword, reject) => {
    let password = '';
    const finish = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      resolvePassword(password);
    };
    const onData = (buffer: Buffer) => {
      const character = buffer.toString('utf8');
      if (character === '\u0003') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        reject(new Error('Password reset cancelled.'));
      } else if (character === '\r' || character === '\n') {
        finish();
      } else if (character === '\u007f') {
        password = password.slice(0, -1);
      } else {
        password += character;
      }
    };

    process.stdout.write(`New password for ${ACCOUNT_NAME}: `);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', onData);
  });
}

function findLocalAccount() {
  const files = readdirSync(d1Directory).filter(
    (name) => name.endsWith('.sqlite') && name !== 'metadata.sqlite'
  );

  for (const file of files) {
    const database = new DatabaseSync(resolve(d1Directory, file));
    try {
      const tables = new Set(
        database
          .prepare("select name from sqlite_master where type = 'table'")
          .all()
          .map((row) => String(row.name))
      );
      if (!tables.has('user') || !tables.has('account')) continue;

      const account = database
        .prepare(
          `select user.id as userId
           from user
           inner join account on account.user_id = user.id
           where user.name = ? and account.provider_id = 'credential'
           limit 1`
        )
        .get(ACCOUNT_NAME) as { userId: string } | undefined;
      if (account) return { database, userId: account.userId };
    } catch {
      // Try the next local D1 database.
    }
    database.close();
  }

  throw new Error(`No local credential account named "${ACCOUNT_NAME}" found.`);
}

const password = await readPassword();
if (password.length < 8) {
  throw new Error('Choose a password with at least 8 characters.');
}

const { database, userId } = findLocalAccount();
try {
  const result = database
    .prepare(
      `update account
       set password = ?, updated_at = ?
       where user_id = ? and provider_id = 'credential'`
    )
    .run(await hashPassword(password), Date.now(), userId);
  if (result.changes !== 1) throw new Error('Local password update failed.');
  console.log(`Password reset for ${ACCOUNT_NAME}.`);
} finally {
  database.close();
}
