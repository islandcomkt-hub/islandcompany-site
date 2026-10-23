import { createHash, timingSafeEqual } from 'node:crypto';
const digest = (value: string) => createHash('sha256').update(value).digest();
const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));
/** Retorna o e-mail do administrador se o cabeçalho Authorization (Basic) for válido. */
export function adminFromAuthorization(header: string | null): string | null {
  const email = process.env.ISLAND_ADMIN_EMAIL?.trim();
  const secret = process.env.ISLAND_ADMIN_PASSWORD;
  if (!email || !secret || !header?.startsWith('Basic ')) return null;
  let decoded: string;
  try { decoded = Buffer.from(header.slice(6), 'base64').toString('utf8'); } catch { return null; }
  const split = decoded.indexOf(':');
  if (split < 0) return null;
  const user = decoded.slice(0, split), pass = decoded.slice(split + 1);
  return same(user.toLowerCase(), email.toLowerCase()) && same(pass, secret) ? email : null;
}
export const adminConfigured = () => !!(process.env.ISLAND_ADMIN_EMAIL && process.env.ISLAND_ADMIN_PASSWORD);
