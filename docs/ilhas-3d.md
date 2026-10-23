# Explorador de ilhas 3D (seção "Diferentes especialidades / Uma direção")

Substitui o Spotlight Bento (`#specialties-root`) em `app/home.html`. Como o elemento não existe mais, `effects/main.ts` simplesmente não monta o bento (nenhum rebuild de efeitos necessário).

Arquivos: `public/islands/` (islands.css, islands.js, scene3d.js, islands-data.js, vendor/three.module.min.js, samuel-felipe.webp).
Conteúdo editável em `islands-data.js` (textos, mensagens de WhatsApp, Samuel Felipe/Instagram). Depois de editar `app/home.html`, rode `node scripts/build-html.mjs` (o `npm run build` já faz isso).

- Cena Three.js r160 procedural, sem modelos externos. Sem WebGL ou sem JavaScript: lista estática das seis ilhas com os mesmos CTAs.
- Entrada por scroll, texto palavra por palavra no zoom, card por ilha e card 3D do Samuel na Island Media; `prefers-reduced-motion` desliga tudo.
- Classes próprias (`isl-*`, `p3-*`, `isw`) para não colidir com `.w`, `.btn`, `.rv` do island-v2.css.
