# Jornada reduzida e recomendações — 05/10/2026

## Jornada v2
Seis telas: contato, momento, objetivos, investimento, prazo e revisão/consentimento. Nome e WhatsApp são obrigatórios. Empresa/@Instagram é opcional. Cadastro não pergunta cargo, e-mail ou cidade. Objetivos: até três, com opção exclusiva “Ainda não sei”. Site/sistema identifica Tech explicitamente. Escolha única avança após 250 ms de destaque e travessia de aproximadamente 1 segundo; voltar não dispara avanço. Revisão permite edição. Falha de envio conserva respostas; registro somente ao concluir com consentimento.

Pergunta centralizada, controles disponíveis e opções compactas; rolagem apenas dentro da área de respostas quando a tela/teclado/tamanho de fonte exigir. Fundo atenuado nas perguntas. Desktop usa imagem, mobile vídeo, preferência de movimento reduzido respeitada. Navegação por teclado tem foco visível.

Registros antigos preservados. API aceita formulário legado; consultas calculam recomendações sem alterar respostas históricas. Rascunho v1 reaproveita apenas contato e atribuição em nova jornada v2, pois perguntas e opções mudaram. Campos não perguntados ficam “Não coletado”.

## Regras de indicação v1
Implementação em lib/recommendation.ts. Ordem dos pesos: Performance, Branding, Conteúdo, Tech, Estratégia.

| Objetivo | Pesos |
|---|---|
| Atrair clientes | 5,0,2,0,1 |
| Vender mais | 5,0,1,0,2 |
| Fortalecer marca | 0,5,3,0,1 |
| Presença digital | 1,2,5,0,1 |
| Organizar marketing | 1,0,2,0,5 |
| Site/sistema | 0,0,0,5,2 |
| Preciso de direção | 0,0,0,0,5 |

Começando: +1 em Estratégia. Principal: >=4 pontos e >=60% da maior pontuação. Complementar: >=3 e não principal. Pontos não são probabilidade nem garantia. Investimento, origem e prazo não alteram serviços. Prioridade comercial: faixa a partir de R$5 mil e “Agora” (ou imediato/até duas semanas no legado); “próximas semanas” não presume duas semanas.

Base exibe todas as pontuações/motivos e permite indicação manual separada, salva com controle de revisão e histórico. Filtro usa indicação manual quando presente, senão recomendação persistida em novos registros; nos registros antigos sem recomendação persistida, usa áreas de interesse declaradas. Exportação inclui recomendações, indicação comercial e origem.

## Atribuição
Primeira origem da jornada e última origem identificada, no mesmo navegador. Acesso sem sinal novo não apaga a última origem conhecida. Referrer externo também atualiza último toque. Sem rastreamento entre dispositivos nem recuperação retroativa de dados ausentes. UTMs são rótulos fornecidos pelo link, não prova auditada pela plataforma. fbclid sozinho não determina mídia paga. Referrer Google sem parâmetros é “provável busca orgânica”. Sem sinais: direto ou não identificado. Não há pixels de anúncios adicionados.

Links para uso externo (não foram alterados perfis ou anúncios):

- Bio: https://islandcompany.space/?utm_source=instagram&utm_medium=organic_social&utm_campaign=perfil&utm_content=bio
- Anúncio Instagram: https://islandcompany.space/?utm_source=instagram&utm_medium=paid_social&utm_campaign=captacao&utm_content=video_01
- Google Ads: https://islandcompany.space/?utm_source=google&utm_medium=cpc&utm_campaign=captacao&utm_content=anuncio_01
- WhatsApp: https://islandcompany.space/?utm_source=whatsapp&utm_medium=referral&utm_campaign=atendimento

## Validação
Regras unitárias para pesos, exclusividade, campos opcionais, entradas inválidas, registros legados e origem incerta. Fluxo completo local em 360x640,390x740,1440x900: autoavanço, voltar, edição, seleção múltipla, erro/reenvio, envio ao banco local, recomendação/origem, ajuste manual, persistência, conflito e autorização. Nenhum lead fictício enviado à produção. Migração aditiva 0003 acrescenta recommended_islands; não modifica ou apaga registros anteriores.

## Link padrão da bio
Novas jornadas marcam o link padrão como Bio do Instagram (presumido) quando não há outra origem identificada. UTMs, identificadores de clique e referências externas prevalecem. Registros antigos sem a marca não são reclassificados como bio. Esta identificação é associada ao lead enviado; não é um contador de todos os cliques ou visitantes anônimos.
