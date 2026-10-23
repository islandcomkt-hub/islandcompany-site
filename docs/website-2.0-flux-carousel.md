> Histórico: esta revisão foi substituída por website-2.0-topography-native.md.

# Island Company 2.0 — FluxLines e CircularCarousel

18/10/2026. Implementado e validado localmente; não publicado.

## Entrega

- Hero com FluxLines oficial do React Bits, cores #6200be, #2c00a1, #9502ff e os parâmetros fornecidos pelo usuário. Texto e links permanecem HTML acessível, independente do efeito. Altura mínima 600px, adaptada à tela e ao conteúdo; no celular, mínima 700px para não sobrepor controles.
- CircularCarousel oficial, preset cylinder, intro rise, cards 220px, aspectRatio 1, speed 14, gap 25, tilt -5, curve 1, perspective 2500, drift à esquerda, momentum 0.6, snap, pauseOnHover, focusOnClick, draggable, parallax 0.3, stretch 0.5, fadeColor #000000, depthFade 0.55, innerShade 0.6 e raio 12. Área 560px desktop, 360px mobile.
- Nove projetos disponíveis com capturas reais. Clique seleciona e pausa; link abaixo abre o projeto correspondente em nova aba. Conteúdo alternativo oferece os nove links se JavaScript não carregar.
- Neiden utilizada como referência de escala tipográfica, contraste e composição editorial. Identidade, logo, foto, textos factuais e contato da Island preservados.
- Configurações completas em effects/Hero.tsx e effects/Portfolio.tsx. Código oficial e licença em effects/vendor. Não há novas dependências.

## Impeccable e otimização

- Inspeção do design existente, playbooks optimize/polish, craft floor, detector e validação em navegador.
- Miniaturas próprias: 157.182 bytes versus 785.036 bytes das nove capturas desktop originais, redução de 80%. As capturas completas continuam em /projetos.
- Carrossel e seu JavaScript carregados apenas a 300px da seção. Fundos inferiores também são adiados. Hero antiga deixou de baixar sua imagem de fundo.
- Fonte Archivo local (34.928 bytes), com licença OFL; nenhuma requisição ao Google Fonts nas páginas novas. Documento de privacidade atualizado.
- WebGL limitado a DPR 1. Componentes interrompem trabalho quando fora da tela/aba oculta. Pausa explícita e preferência de movimento reduzido; teclado pausa o autoplay durante foco.
- Ajuste do componente oficial para não reiniciar o snap quando já alinhado e para aplicar seleção sem mola/inércia com movimento reduzido.
- JavaScript dos efeitos: entrada ~1,00 KB gzip; React compartilhado ~59,89 KB; hero ~4,77 KB; carrossel adiado ~8,41 KB. Os efeitos acrescentam processamento e JS. A redução das imagens não deve ser interpretada como prova de ganho global de velocidade.
- Medição local desktop sem cache: FCP observado 948ms, sem simulação de rede móvel. Valor de laboratório, não Core Web Vitals de produção. Baseline anterior de 372ms teve condições distintas; não serve como comparação de desempenho.
- Detector apontou um aviso de hierarquia plana porque não resolveu /island-v2.css a partir de app/home.html. Verificação real: H1 96px e texto da hero 19,2px em desktop, fonte carregada. Nenhum erro de console observado.

## Verificação

- Build final e TypeScript sem erros.
- Homepage e /projetos: 320, 390, 768 e 1440px, sem overflow ou títulos cortados. Correção aplicada à seção Sobre em 320px após detectar 2px de excesso com a fonte final.
- Pausar/ativar hero, pausar carrossel, navegação por Home/End/setas, arraste e menu mobile/Escape verificados.
- Movimento reduzido: rotação estável e zero animações CSS em execução; navegação de projetos continua funcionando.
- HTTP 200: /, /projetos, /jornada, /privacidade, sitemap e entrada dos efeitos. /go retorna 307 com parâmetros preservados; /api/base retorna 403 anônimo.
- HTML original da jornada, APIs, autorização e robots sem alterações.
- Capturas e evidências em deliverables/island-2-flux-carousel, no pacote de revisão.

## Limites reais

- Não publicado. O domínio público não recebeu esta revisão.
- Hugo Ferreira e Island anterior permanecem fora do carrossel: na auditoria dos 11 endereços retornaram 404 DEPLOYMENT_NOT_FOUND. Não se inventou conteúdo substituto.
- Testes em Chromium com viewports emulados, sem aparelho físico/Safari, auditoria completa WCAG/Lighthouse, envio de lead ou novo E2E autenticado.
- Prévia: npm run dev. Produção: npm run build. Ambos recompilam as ilhas React; não editar os bundles de public/effects manualmente.
- O gerador histórico deliverables/build_island_v2.py pertence à revisão anterior e não deve sobrescrever o código atual. Fonte canônica: island-production.
