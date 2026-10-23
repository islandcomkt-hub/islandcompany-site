import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig, UnframerProvider } from 'unframer';
import SpotlightBentoGrid from './vendor/framer/SpotlightBentoGrid';
import ShowcaseCard from './vendor/framer/ShowcaseCard';
import 'unframer/styles/framer.css';

function NativeEnvironment({children}: {children: React.ReactNode}) {
  return <UnframerProvider><MotionConfig reducedMotion="never">{children}</MotionConfig></UnframerProvider>;
}
function Specialties() {
  const [mobile, setMobile] = useState(matchMedia('(max-width:700px)').matches);
  useEffect(() => {
    const query = matchMedia('(max-width:700px)');
    const update = () => setMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return <NativeEnvironment><SpotlightBentoGrid key={String(mobile)}
    className="island-bento" style={{width:'100%'}} variant={mobile ? 'Tablet/Phone' : 'Default'}
    cardOneHeading="Aquisição" cardOneSupportingText="Tráfego pago, campanhas, funis e conversão"
    cardTwoHeading="Marca & conteúdo" cardTwoSupportingText="Branding, identidade, design, criativos e vídeos"
    cardThreeHeading="Experiências digitais" cardThreeSupportingText="Sites, landing pages, e-commerce e aplicações"
    cardFourHeading="Sistemas & estratégia" cardFourSupportingText="Diagnóstico, automações, processos, dados e inteligência artificial"
    cardOneImage={{src:'/assets/v2/01_horizonte.webp',alt:''}}
    cardTwoImage={{src:'/assets/v2/02_arquipelago.webp',alt:''}}
    cardThreeImage={{src:'/assets/v2/03_tecnologia.webp',alt:''}}
    cardFourImage={{src:'/assets/v2/04_farol.webp',alt:''}} /></NativeEnvironment>;
}
function Founder() {
  return <NativeEnvironment><div className="founder-popout"><ShowcaseCard className="island-showcase" style={{width:'100%'}}
    projectThumbnail={{src:'/assets/johanes-cutout-v3.webp',alt:'Johanes Caldeira, fundador da Island Company',positionY:'18%',positionX:'50%'}}
    projectName="Johannes Caldeira" projectCategory="Fundador · Island Company"
    projectOverview="Uma visão. Múltiplas possibilidades."
    projectDescription="Sou Johannes Victor Silva Caldeira, tenho 25 anos e mais de 8 anos de atuação no mercado. Minha trajetória passa por identidade visual, criação de posts e gestão de perfis no Instagram, sites, landing pages e tráfego pago. Também trabalho com edição de vídeo, do básico ao avançado, e estruturação de estratégias comerciais. Na Island, conecto essas experiências para pensar a comunicação e a presença digital de cada negócio como um todo."
    clientName="Estratégia · Criação" projectDuration="Tecnologia · Desenvolvimento" toolsUsed="Tráfego pago"
    link="https://wa.me/5531988690118" /></div></NativeEnvironment>;
}
export function mountSpecialties(element: HTMLElement) { createRoot(element).render(<Specialties />); }
export function mountFounder(element: HTMLElement) { createRoot(element).render(<Founder />); }
