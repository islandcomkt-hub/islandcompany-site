// Aplica drizzle/*.sql no Turso, em ordem, uma única vez cada (tabela __island_migrations).
// Sem TURSO_DATABASE_URL o script apenas avisa e segue (build local sem banco).
import { readFileSync } from 'node:fs';
import { createClient } from '@libsql/client/web';
const url = process.env.TURSO_DATABASE_URL;
if (!url) { console.warn('migrate: TURSO_DATABASE_URL ausente — migrações não aplicadas'); process.exit(0); }
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8'));
await db.execute('CREATE TABLE IF NOT EXISTS __island_migrations (tag TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
const done = new Set((await db.execute('SELECT tag FROM __island_migrations')).rows.map(r => r[0]));
for (const { tag } of journal.entries) {
  if (done.has(tag)) continue;
  const statements = readFileSync(`drizzle/${tag}.sql`, 'utf8').split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
  await db.batch([...statements.map(sql => ({ sql, args: [] })), { sql: 'INSERT INTO __island_migrations (tag, applied_at) VALUES (?, ?)', args: [tag, new Date().toISOString()] }], 'write');
  console.log('migrate: aplicada', tag);
}
console.log('migrate: banco em dia');
