# Island Base e refinamentos — 03/10/2026

## Acesso e registros

Área interna em `/base`, protegida pelo login ChatGPT e pela comparação de e-mail com `ISLAND_ADMIN_EMAIL`. O site público não fornece acesso de leitura aos diagnósticos. A API interna exige a mesma autorização em toda consulta e alteração; gravações também exigem origem igual à do site.

Os registros continuam no banco D1 do mesmo Site. `leads` conserva as submissões; `lead_management` acompanha a jornada e `lead_events` mantém o histórico interno. O painel lista apenas a submissão mais recente por jornada. Revisões anteriores não são apagadas. Uma nova jornada, mesmo de um contato repetido, é um registro separado; não há fusão automática por telefone.

Busca por nome, empresa, e-mail, telefone ou referência. Filtros por etapa comercial, prioridade sugerida, área e contatos vencidos/previstos para hoje. Paginação de 50 registros e exportação CSV da página apresentada. As datas de acompanhamento usam o dia de São Paulo. Agendamento é um campo da Base; não envia lembretes automáticos.

Etapas: Novo, Em contato, Reunião, Proposta, Ganho, Perdido e Nutrição. As observações são internas e preservadas em histórico. Gravações concorrentes têm controle de revisão e não substituem silenciosamente mudanças de outra aba.

## Interpretação comercial

O diagnóstico apresenta objetivo, investimento declarado, início e processo decisório, além das respostas originais, comentário e UTMs de primeira/última origem. Não presume origem paga ou orgânica quando faltam parâmetros. A prioridade mantém a regra existente: investimento a partir da faixa de R$ 5 mil e início em até duas semanas. O motivo aparece no painel; não equivale a aprovação comercial nem escore oculto. A faixa de investimento não distingue mídia e honorários porque o formulário original não pergunta isso.

As dez etapas, opções, perguntas, multiseleção, revisão e navegação foram preservadas. Os testes comparam literalmente o conteúdo e a implementação da superfície do formulário com a versão anterior.

## WhatsApp e identificação

Destinatário: `5531988690118`. Link direto `wa.me`, sem diálogo de copiar/enviar. O visitante ainda confirma o envio dentro do WhatsApp.

Mensagem: “Olá, Island! Sou {primeiro nome}, da {empresa}. Concluí o diagnóstico e quero conversar sobre {objetivos}. Minha referência: {referência}”.

Referência curta: primeiro nome + primeira palavra da empresa (normalizados e limitados a dez caracteres cada) + seis caracteres finais do UUID. Exemplo fictício: `ANA-AURORA-A1B2C3`. A referência facilita a consulta, mas o UUID continua sendo a identidade única da jornada. Não é chave de autenticação nem permite consultar dados publicamente.

## Bússola

Ativação automática e silenciosa somente quando a localização já está autorizada e o navegador entrega orientação confiável. Nenhum pedido de permissão, botão de ativação ou aviso visível. Na ausência dessas condições, a bússola permanece inativa. O norte magnético é corrigido localmente pela declinação WMM 2025; coordenadas não são armazenadas nem transmitidas. Modelo válido de 2025 a 2029. Revogação de permissão, leitura ruim ou ausente e suspensão da página interrompem a função. A precisão depende dos sensores físicos e da calibração.

Fontes: https://developer.apple.com/documentation/webkitjs/deviceorientationevent/1804777-webkitcompassheading ; https://www.w3.org/TR/orientation-event/ ; https://www.ncei.noaa.gov/products/world-magnetic-model ; https://github.com/cristianob/geomagnetism

Para reconstruir o arquivo cliente após editar `lib/compass-browser.js`: `node node_modules/esbuild/bin/esbuild lib/compass-browser.js --bundle --minify --format=esm --outfile=public/assets/compass.js`. Licença distribuída em `/assets/compass-LICENSE.txt`.

## Movimento e visual

HERO: entrada 24 ms/caractere, saída 12 ms/caractere, permanência de 2 s e intervalo de 140 ms. Título e frase mais próximos. Controle visível de movimento removido; preferência do dispositivo continua respeitada.

Institucional preserva a identidade Dark Purple, com títulos segmentados em roxo, verde e laranja, ícones do sistema existente, entradas curtas e ondulações discretas. Ondulações pausam fora da área visível ou com a aba oculta. Conteúdo permanece legível sem animação. Os avisos do detector sobre textos e tracking do onboarding foram mantidos por restrição explícita de preservar essa superfície; o recorte do mapa é intencional. A Base usa corpo e rótulos de pelo menos 12 px.

## Verificação

Teste local com dados fictícios: dez etapas, falha/reenvio sem perder respostas, idempotência, WhatsApp direto e referência, consulta protegida, filtros, acompanhamento persistente, histórico e conflito de edições. Responsividade em 320, 390, 768 e 1440 px. Bússola verificada com sensores simulados e localização de teste; não substitui validação física em iPhone/Android. Não foram criados clientes fictícios em produção.

## Atualização marítima e privacidade

Nenhum link público aponta para /base. O endereço privado exige a conta autorizada também na API. Ocultar o link não substitui autenticação.

Duas imagens marítimas geradas para esta composição, sem logos ou pessoas, em WebP (aproximadamente 250 KB combinados). Cenas de farol e veleiro com áreas negativas para texto, cards de especialidades e painéis de trabalho. Textos institucionais preservados. Ondulação SVG contínua no desktop e celular, pausada com a aba oculta e desativada por preferência de movimento reduzido do sistema. Títulos principais centralizados no mobile; informações secundárias da entrada ocultas. Perguntas e opções mantidas.

Verificação adicional: permissões granted/prompt/denied/unsupported, zero solicitações, revogação; ondas e transição de barco nos dois tamanhos; zero erros JS, autorização da Base, conteúdo das perguntas idêntico. Sensores simulados, sem afirmar validação física.

## Revisão final — 04/10/2026

Substitui as decisões anteriores de ondas e bússola: ícone funcional e carregamento de sensores removidos; SVGs de ondulação desativados. Fundo usa MP4 fornecido pelo proprietário, mudo, inline e em loop; pausa com aba oculta ou movimento reduzido. Retrato recortado com transparência a partir da foto fornecida, sem ilha na seção do fundador. ISLAND desdobrado em Imersão, Segmentação, Lapidação, Ativação, Navegação e Desenvolvimento. Resultado usa cards translúcidos. Entrada mobile centraliza o conjunto e enquadra três ilhas em 100svh. Revelações observam os textos, com limite inferior de 35% da viewport. Base e regras do formulário preservadas. QA em 360×640, 390×740 e 1440×900, vídeo, formulário, cards, autorização e erros JS. Paleta roxa mantida por instrução expressa; tracking reservado ao acrônimo e rótulos.

Desktop atualizado com composição centralizada e mesmos refinamentos de conteúdo, cards e animações do mobile. Fundo desktop é JPG fornecido pelo usuário; MP4 só recebe source em viewport mobile, pausando ao mudar para desktop. Retrato v2 preserva tatuagem YHWH. Verificado desktop sem download/reprodução de vídeo, mobile reproduzindo, formulário e proteção da Base.
