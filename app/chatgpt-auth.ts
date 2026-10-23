// Mantém os nomes usados pela Island Base. Na Vercel o acesso é por Basic Auth
// (ISLAND_ADMIN_EMAIL + ISLAND_ADMIN_PASSWORD), validado também em proxy.ts.
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminFromAuthorization } from '../lib/admin-auth';

export type ChatGPTUser = { userId: string; displayName: string; email: string; fullName: string | null };

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const email = adminFromAuthorization((await headers()).get('authorization'));
  return email ? { userId: email, displayName: email, email, fullName: null } : null;
}
export async function requireChatGPTUser(_returnTo: string): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;
  redirect('/');
}
