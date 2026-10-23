// Fundo PatternWaves da abertura da jornada (/jornada). Só a abertura usa o efeito;
// nas demais telas o CSS oculta #pw-root e o motor pausa sozinho (IntersectionObserver).
import { createPatternWaves } from './vendor/PatternWaves.engine.js';
const root = document.getElementById('pw-root');
if (root) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    try {
      createPatternWaves(root, {
        preset: 'silk', color: '#7800ff', backgroundColor: '#120f17', fade: 'edges',
        interactive: true, cursorSize: 50, cursorStrength: 0.6, pattern: 'dot', wave: 'silk',
        spacing: 9, markSize: 0.95, depth: 0.95, light: 0, shine: 0.8, contrast: 1.2,
        speed: 0.35, scale: 1, direction: 20, opacity: 1, fadeSize: 0.5,
        characters: '.:-=+*#%@', intro: true, paused: false,
      });
    } catch (error) { console.error('PatternWaves:', error); }
  }));
}
