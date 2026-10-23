import { createClient } from '@libsql/client/web';
import { createD1Compat, type LeadDb, type LibsqlLike } from '../lib/d1-compat';
let cached: LeadDb | undefined;
// Banco: Turso (libSQL/SQLite). Variáveis: TURSO_DATABASE_URL e TURSO_AUTH_TOKEN.
export function leadDb(): LeadDb {
  if (cached) return cached;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw Error('Storage unavailable');
  cached = createD1Compat(createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }) as unknown as LibsqlLike);
  return cached;
}
