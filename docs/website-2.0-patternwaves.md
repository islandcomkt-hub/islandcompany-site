# Hero com PatternWaves e botão Uiverse — 19/10/2026

- Hero: Topography substituído por PatternWaves (preset silk, #7800ff sobre #120f17, pontos de 9 px, direção 20°, cursor 50/0.6, intro). Os 22 parâmetros enviados estão em effects/Hero.tsx.
- Origem do componente: o código-fonte original do PatternWaves não veio no pacote. effects/vendor/PatternWaves.engine.js é uma implementação própria em WebGL com a mesma API de props. Para usar o original, substitua PatternWaves.jsx mantendo as props.
- Carregamento: continua adiado por duplo requestAnimationFrame em effects/main.ts; o fundo #120f17 aparece antes do WebGL. Pausa fora da tela e com a aba oculta; DPR limitado a 1,75.
- Botões: estilo Uiverse (vinodjangid07) adaptado: pílula, sombra 5px, ícone à esquerda que gira 250° em 1,5 s no hover, escala 0,97 no clique. Ícone trocado de sino para bússola (máscara SVG em CSS). Primário laranja; secundário translúcido; LAB em ciano. Em telas sem hover o giro acontece no toque.
- Pendente: rodar npm run build para regenerar public/effects (o pacote traz o bundle antigo com Topography).

## Jornada (/jornada) — adendo
- Abertura da jornada com PatternWaves (mesmos parâmetros) em #pw-root; só aparece em body[data-view=hero]. Nas etapas e no resultado o oceano original volta e o efeito é ocultado (o motor pausa fora da tela).
- Botões .cta com o estilo Uiverse: bússola à esquerda que gira 250° no hover; setas de texto removidas. Campos do contato marcam aria-invalid ao errar.
- Nova entrada do bundle: effects/journey.ts (npm run build gera public/effects/journey.js).
- public/effects/journey.js e Hero-DmlsGg9r.js foram gerados à mão a partir do motor para o ZIP funcionar antes do build; o próximo `npm run build` os substitui pelos equivalentes oficiais.
- Não alterado de propósito: perguntas, content.json, validação do servidor, banco e classificação. Painel de leads, CRM, pontuação e jornada condicional exigem mudar esse contrato e migrações; ficam como próxima etapa.
