import { createRoot } from 'react-dom/client';
import PatternWaves from './vendor/PatternWaves';
function Hero() {
  return <PatternWaves preset="silk" color="#7800ff" backgroundColor="#120f17" fade="edges"
    interactive cursorSize={50} cursorStrength={0.6} pattern="dot" wave="silk" spacing={9}
    markSize={0.95} depth={0.95} light={0} shine={0.8} contrast={1.2} speed={0.35} scale={1}
    direction={20} opacity={1} fadeSize={0.5} characters=".:-=+*#%@" intro paused={false} />;
}
export function mountHero(element: HTMLElement) { createRoot(element).render(<Hero />); }
