> Histórico: esta revisão foi substituída por website-2.0-topography-native.md.

# Island Company 2.0 — entrega para revisão

Data: 18/10/2026. Implementação local; ainda não publicada.

## Origem e escopo

- Referência: HTML fornecido pelo usuário em `OneDrive/Área de Trabalho/Island Company — Homepage 2.0 (rascunho para revisão).html`. O arquivo original foi mantido intacto.
- Identidade, textos principais e estrutura do rascunho mantidos. Logo aproximada substituída por `island-logo.webp`; foto substituída por `johanes-cutout-v3.webp`, ambos já existentes no projeto.
- Fundos provenientes de `Downloads/ISLAND_VISUAIS_REVISADOS.zip`, sem imagens novas inventadas.
- WhatsApp reaproveitado do site e da documentação existentes: `5531988690118`.

## Rotas

- `/`: homepage 2.0 com FluxLines na hero, contato real e CircularCarousel com nove projetos.
- `/projetos`: nove endereços disponíveis com capturas desktop/mobile, filtros e rótulo de protótipo para Marinelli. Os dois endereços indisponíveis são registrados separadamente, sem imagens fictícias ou botões que prometam um site funcionando.
- `/jornada`: aplicação original preservada byte a byte em `app/island.html`. A nova rota serve esse HTML, ajustando apenas canonical e og:url na resposta.
- `/go`: redirecionamento temporário 307 para o HUB existente em `https://landingpage.islandcompany.space/`; preserva parâmetros da URL.
- `/privacidade`: texto da jornada existente, mais informação sobre arquivos locais e navegação para outros sites.
- Sitemap inclui homepage, projetos, jornada e privacidade. Não inclui o redirecionamento `/go`, a Base ou APIs.

## Verificação dos 11 endereços

Cada endereço foi aberto no navegador em 1440×1000 e 390×844. As capturas são do primeiro viewport, não da página inteira. Data da observação: 18/10/2026.

| Projeto | Endereço | Evidência |
|---|---|---|
| Landingpage / Island HUB | https://landingpage.islandcompany.space | Conteúdo carregado |
| Trilha Motos | https://trilha.islandcompany.space | Catálogo carregado |
| Trilha LP | https://trilhalp.islandcompany.space | Landing page carregada |
| TM | https://tm.islandcompany.space | Apresentação da identidade Trilha carregada |
| Brothers | https://brothers.islandcompany.space | Site de som e acessórios automotivos carregado |
| Marinelli | https://marinelli.islandcompany.space | Site carregado; portfólio mantém classificação de protótipo |
| Duhype HUB | https://duhype.islandcompany.space | HUB streetwear carregado |
| Hugo Ferreira | https://hugo-ffereiro.islandcompany.space | 404 DEPLOYMENT_NOT_FOUND |
| Clínica | https://clinica.islandcompany.space | Página Dra. Caticilene Botelho carregada |
| Supra | https://supra.islandcompany.space | HUB Supranet carregado |
| Island anterior | https://v0-island-hazel.vercel.app | 404 DEPLOYMENT_NOT_FOUND |

Há 22 capturas originais: 18 de conteúdo e quatro das telas de erro. Os 18 assets do portfólio foram convertidos para WebP (cerca de 1,1 MB no total). O manifesto público registra URLs, dimensões, data e categorias. Não foram executados pedidos, compras, contatos ou fluxos autenticados nos sites externos. Disponibilidade futura não é garantida pela captura.

## Validação

- TypeScript sem erros e JavaScript com sintaxe válida.
- Build de produção concluído com as oito rotas esperadas, incluindo Base e APIs existentes.
- HTTP local 200 para homepage, projetos, jornada, privacidade e sitemap.
- `/go?utm_source=instagram&utm_campaign=teste`: 307 com ambos os parâmetros preservados no destino correto.
- `/api/base` anônima: 403. Código de autorização, APIs, robots.txt e HTML da jornada sem alterações.
- Homepage, projetos, privacidade e jornada sem overflow horizontal nas larguras 320, 390, 768 e 1440. Letras cortadas nos títulos da homepage em 320 foram identificadas e corrigidas; confirmação final sem `.ln` com conteúdo excedente.
- Menu mobile abre, fecha e responde a Escape. Navegação para o portfólio testada.
- Filtro Identidade retorna uma entrega; filtro Todos restaura nove. Alternância Mobile atualiza o formato das capturas.
- Emulação de movimento normal confirmou animações de entrada, FluxLines e carrossel circular. Movimento reduzido confirmou zero animações em execução e zero elementos de entrada pendentes/ocultos.
- Entrada da jornada testada até a primeira etapa. Nenhum lead criado ou enviado.
- Um H1 e um canonical por página; JSON-LD parseável; assets locais referenciados existentes; sem placeholders `href="#"` nas novas páginas.
- Detector visual: alertas de hierarquia tipográfica eram limitados pela resolução incorreta do CSS absoluto na ferramenta; o navegador confirmou H1 96px e corpo 17px no desktop. O salto H1→H3 do portfólio foi corrigido para H2.

## Limites e pendências

- Não publicado: o domínio continua na versão 9 até a publicação da nova versão.
- Hugo Ferreira e Island anterior precisam de correção da implantação ou de URLs válidas. Nenhum DNS ou projeto externo foi alterado.
- Marinelli não foi apresentado como contrato fechado ou resultado comercial comprovado.
- Não houve teste em aparelho físico, Safari, envio real de WhatsApp, auditoria completa WCAG/Lighthouse ou nova validação ponta a ponta do banco de dados. A jornada e suas APIs foram preservadas.
- Conteúdo permanece visível se JavaScript estiver indisponível; nesse caso filtros e alternância de prévias não funcionam, e os nove projetos continuam visíveis.

## Operação local

No diretório do projeto, `npm run dev` inicia a prévia em `http://localhost:5173`. `npm run build` gera a versão de produção. Não substituir o projeto por uma exportação somente estática: jornada e Base dependem das rotas de servidor existentes.

Publicação futura deve usar o mesmo projeto Sites `appgprj_6ac0fd4521b0819196333ae58d617e21`, preservar a audiência pública e manter a Base protegida. O pacote de revisão não contém credenciais, `.env`, banco local ou `node_modules`.
