# Island Company 2.0 — site completo

Revisão local de 18/10/2026. Esta entrega não publica nem substitui o site online.

## Executar
1. Extraia o ZIP inteiro.
2. Instale Node.js 22.13 ou superior.
3. Na pasta extraída, execute `npm ci` e `npm run dev`.
4. Abra http://localhost:5173.

Para compilar: `npm run build`. Para servir a compilação local: `npm start` (use o endereço exibido no terminal).

Última atualização: Blur Reveal, carrossel ampliado, biografia e Testimonials demonstrativos. Consulte docs/website-2.0-blur-biografia.md.

## Conteúdo
Homepage com Topography, carrossel CircularCarousel, Spotlight Bento, Showcase Card e método ISLAND controlado pela rolagem. Código-fonte, imagens reais, fontes locais, capturas desktop/mobile do portfólio, dependências fixadas e componentes compilados estão incluídos.

Rotas: `/`, `/projetos`, `/jornada`, `/go`, `/privacidade`, `/base` e APIs existentes. `/go` redireciona ao HUB. A jornada original, Base e controles de autenticação foram preservados.

Este é um projeto React/Vinext com servidor, não um HTML para abrir por duplo clique. Para publicação com Base e gravação da jornada, mantenha a infraestrutura Sites/Cloudflare, D1 e autenticação existentes. Configure ISLAND_ADMIN_EMAIL no ambiente de hospedagem conforme `.env.example`. Segredos, banco com dados pessoais, node_modules e estados locais não fazem parte do pacote. Não basta enviar esta pasta a uma hospedagem exclusivamente estática.

## Validação desta revisão
Build de produção e TypeScript passaram. Navegação e interações conferidas no navegador; larguras 320, 390, 768 e 1440 sem transbordamento horizontal. Método verificado no início, etapas intermediárias, fim e retorno. Card do fundador testado por teclado. Validação visual em navegador desktop com tamanhos simulados, não em aparelhos físicos/Safari. Sem novo teste autenticado de ponta a ponta da Base nesta revisão.

9 projetos têm capturas reais e aparecem no portfólio. Os endereços Hugo e Island anterior retornaram 404 na auditoria de 18/10 e estão documentados como indisponíveis, sem imagens inventadas.

Detalhes em docs/website-2.0-topography-native.md. Capturas da revisão em revisao-visual/.
