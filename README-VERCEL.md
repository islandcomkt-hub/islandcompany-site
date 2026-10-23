# Island Company — publicação na Vercel

Este pacote é a versão do site preparada para a Vercel (Next.js 16). A versão Cloudflare/Sites continua no ZIP anterior.

## O que mudou em relação à versão Cloudflare
- Banco: D1 → **Turso** (SQLite/libSQL). O SQL e as tabelas são os mesmos; as migrações em `drizzle/` rodam sozinhas no deploy (`scripts/migrate.mjs`).
- Island Base (`/base`): login do ChatGPT → **usuário e senha** (Basic Auth), validados em `proxy.ts`. Usuário = `ISLAND_ADMIN_EMAIL`, senha = `ISLAND_ADMIN_PASSWORD`. Sem essas variáveis a Base responde 503 (fecha por segurança).
- Páginas HTML são embutidas por `scripts/build-html.mjs` (gera `lib/html-pages.generated.ts`) em vez de `?raw` do Vite.
- Removidos: Vinext, plugins Cloudflare, Wrangler, scripts de pré-visualização.

## Passo a passo
1. **Turso**: crie o banco (`turso db create island`) e o token (`turso db tokens create island`). Anote a URL `libsql://...` e o token.
2. **GitHub**: extraia o ZIP, suba a pasta para um repositório (o `.gitignore` já exclui `node_modules`, `.env` e `.next`).
3. **Vercel**: Add New → Project → importe o repositório. Framework: Next.js (detectado). O `vercel.json` já define o comando de build.
4. **Variáveis de ambiente** (Settings → Environment Variables, em Production e Preview): `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `ISLAND_ADMIN_EMAIL`, `ISLAND_ADMIN_PASSWORD`.
5. **Deploy**. O build roda as migrações, gera os efeitos (`public/effects`) e compila o Next.
6. **Domínio**: Settings → Domains → adicione `islandcompany.space`. Os subdomínios dos projetos (`*.islandcompany.space`) continuam apontando para os projetos atuais; altere só o registro do domínio raiz/`www` se for migrar o site principal.

## Rotas
`/` home · `/jornada` onboarding · `/projetos` · `/privacidade` · `/go` (redireciona ao HUB) · `/base` (restrito) · `POST /api/journeys` · `/api/base` (restrito).

## Testar localmente
`npm install` → copie `.env.example` para `.env.local` e preencha → `npm run dev`. Sem `TURSO_DATABASE_URL` o site abre, mas o envio da jornada responde 503.

## Limites conhecidos
- Esta versão não foi compilada nem testada num ambiente com internet (sem `npm install`/`next build`). O adaptador do banco, as migrações, o SQL da Base e a autenticação foram testados contra SQLite local; a primeira build na Vercel é a validação final.
- Dados de leads já existentes no D1 não migram sozinhos: exporte do D1 e importe no Turso se precisar deles.
- O limite de envios por IP usa o cabeçalho de IP da Vercel.
