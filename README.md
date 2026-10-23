
Para publicar na Vercel, leia README-VERCEL.md.
# Entrega atual

Consulte [LEIA-ME-SITE-COMPLETO.md](LEIA-ME-SITE-COMPLETO.md) para executar a revisão 2.0 com Topography e os componentes nativos.

# Island Company — publicação

Site público com jornada de dez etapas, mapa animado, WhatsApp +55 31 98869-0118 e Island Base em /base.

## Operação
- Hospedagem: Sites; DNS próprio pode continuar na Vercel
- Site registrado: appgprj_6ac0fd4521b0819196333ae58d617e21
- Interface preservada do protótipo V2 aprovado
- Respostas finais: banco D1, tabela leads; rascunho: navegador
- /base exige login ChatGPT e e-mail igual ao segredo ISLAND_ADMIN_EMAIL
- Nenhuma rota pública permite listar ou consultar diagnósticos
- Contatos só são enviados ao finalizar com confirmação explícita
- Cada combinação de jornada e respostas normalizadas possui chave única; uma repetição não duplica o envio, uma revisão fica registrada como outro diagnóstico da mesma jornada
- Classificação por regras transparente e sujeita a revisão humana; não aparece para o lead
- UTMs, gclid e fbclid são registrados se presentes; nenhum pixel de mídia foi instalado
- Abertura do WhatsApp não envia a mensagem automaticamente

## Desenvolvimento
Node 22.13+; npm install; node scripts/run-framework.mjs dev
Build: node scripts/run-framework.mjs build
Schema: db/schema.ts; migrações: drizzle/; nunca reescrever uma migração já publicada
A configuração local .env é ignorada. Segredos da publicação devem ser configurados na hospedagem

## Validação em 03/10/2026
Jornada completa em celular, gravação D1, retomada após falha simulada, repetição sem duplicação, rejeição de consentimento ausente e origem externa, link WhatsApp, dados na Base, larguras 320/390/768/1440 sem transbordamento. Worker compilado respondeu 200 na raiz, 307 para login na Base anônima e 405 para leitura pública do endpoint de diagnósticos. WebMCP de leitura de progresso é opcional; contexto nativo compatível indisponível para validação.

Dados de teste ficaram somente no banco local e não compõem a publicação. Domínio personalizado depende da validação dos registros DNS retornados por Sites.
