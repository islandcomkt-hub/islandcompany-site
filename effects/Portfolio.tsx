import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import CircularCarousel from './vendor/CircularCarousel';
import manifest from '../public/assets/projects/manifest.json';

const projects = manifest.projects;
const items = projects.map(project => ({src: `/assets/projects/${project.id}-carousel.webp`,
  alt: `Captura real do site ${project.name}`, title: project.name, subtitle: project.label}));
function Portfolio() {
  const [cardWidth, setCardWidth] = useState(Math.min(400, innerWidth * .76));
  useEffect(() => { const resize = () => setCardWidth(Math.min(400, innerWidth * .76)); addEventListener("resize", resize); return () => removeEventListener("resize", resize); }, []);
  return <>
    <div className="carousel-stage">
      <CircularCarousel items={items} preset="cylinder" intro="rise" cardWidth={cardWidth} aspectRatio={1}
        speed={14} captions={false} gap={25} tilt={-5} curve={1} perspective={2500}
        autoplay="drift" interval={3} direction="left" momentum={0.6}
        snap pauseOnHover focusOnClick draggable parallax={0.3} stretch={0.5} fadeColor="#000000"
        depthFade={0.55} innerShade={0.6} cornerRadius={12} />
    </div>
    <div className="carousel-details w">
      <p className="carousel-gallery-note">Veja também as capturas completas em desktop e mobile.</p>
      <a className="btn p" href="/projetos">Ver portfólio completo <i aria-hidden="true">→</i></a>
    </div>
  </>;
}
export function mountPortfolio(element: HTMLElement) { createRoot(element).render(<Portfolio />); }
