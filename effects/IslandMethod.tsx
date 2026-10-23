import { useLayoutEffect, useRef, useState } from 'react';
import { BlurText } from './RevealSections';
import { createRoot } from 'react-dom/client';
import { easeInOutCubic, easeOutCubic, clamp01 } from './vendor/framer/ScrollingWaveText';

const steps = ['Imersão', 'Segmentação', 'Lapidação', 'Ativação', 'Navegação', 'Desenvolvimento'];
const explanations = ['Entendemos seu negócio, seus desafios e objetivos.', 'Definimos o público e as oportunidades da marca.', 'Refinamos a mensagem, a identidade e a proposta de valor.', 'Colocamos campanhas e experiências em movimento.', 'Acompanhamos os sinais e ajustamos a direção.', 'Evoluímos a estrutura para apoiar os próximos passos.'];
const letters = 'ISLAND'.split('');

function IslandMethod() {
  const [reveals, setReveals] = useState([0,0,0,0,0,0]);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const stage = stageRef.current!;
    const panel = panelRef.current!;
    let width = 1, height = 1, fontSize = 1, widths: number[] = [];
    let frame = 0;
    const measure = () => {
      width = stage.clientWidth; height = stage.clientHeight;
      fontSize = parseFloat(getComputedStyle(letterRefs.current[0]!).fontSize);
      widths = letterRefs.current.map(letter => letter!.offsetWidth);
      requestPaint();
    };
    const paint = () => {
      frame = 0;
      const distance = Math.max(1, root.offsetHeight - height);
      const progress = clamp01((72 - root.getBoundingClientRect().top) / distance);
      // Original ScrollingWaveText expansion: 55% of one screen, scale .7 -> 1,
      // radius 80 -> 0, rise 10% of the stage, using its native cubic easing.
      const expandDistance = height * .55;
      const expand = easeInOutCubic(clamp01(progress * distance / expandDistance));
      panel.style.transform = `translateY(${height * .1 * (1-expand)}px) scale(${.7 + .3*expand})`;
      panel.style.borderRadius = `${80*(1-expand)}px`;
      const sequence = clamp01((progress * distance - expandDistance) / (distance-expandDistance-height*.3));
      const gap = fontSize * (.015 + .13*expand);
      const fullWidth = widths.reduce((sum, value) => sum+value, 0) + gap*5;
      let cursor = (width-fullWidth)/2;
      const targetFont = width < 600 ? 28 : 44;
      const targetX = Math.max(24,(width-700)/2);
      const targetY = height*(height<600?.23:.27);
      const rowHeight = Math.min(92,height*.105);
      const k = 2*Math.PI / (.62*width);
      const nextReveals:number[]=[];
      for (let index=0; index<6; index++) {
        const local = clamp01(sequence*6-index);
        const drop = easeInOutCubic(clamp01(local/.82));
        const entry = easeOutCubic(clamp01((local-.24)/.65));
        nextReveals.push(entry);
        const originY = height*.19;
        const waveY = .03*width*Math.sin(k*cursor)*Math.sin(Math.PI*drop);
        const slope = .03*width*k*Math.cos(k*cursor);
        const bank = Math.atan(slope)*180/Math.PI*Math.sin(Math.PI*drop);
        const x = cursor+(targetX-cursor)*drop;
        const y = originY+(targetY+index*rowHeight-originY)*drop+waveY;
        const size = 1+(targetFont/fontSize-1)*drop;
        const letter = letterRefs.current[index]!;
        letter.style.transform = `translate3d(${x}px,${y}px,0) rotate(${bank}deg) scale(${size})`;
        letter.style.color = drop>.5 ? '#FF7417' : '#F7F4F0';
        const label = labelRefs.current[index]!;
        label.style.transform = `translate3d(${targetX+targetFont*1.55+(1-entry)*130}px,${targetY+index*rowHeight}px,0)`;
        label.style.opacity = String(entry);
        cursor += widths[index]+gap;
      }
      setReveals(previous=>previous.every((v,i)=>Math.abs(v-nextReveals[i])<.005)?previous:nextReveals);
      root.dataset.progress = progress.toFixed(4);
      if (hintRef.current) hintRef.current.style.opacity=String(1-clamp01(sequence*2));
    };
    function requestPaint() { if (!frame) frame=requestAnimationFrame(paint); }
    const observer = new ResizeObserver(measure); observer.observe(stage);
    window.addEventListener('scroll',requestPaint,{passive:true});
    window.addEventListener('resize',measure,{passive:true});
    void document.fonts.ready.then(measure);
    measure(); paint();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('scroll',requestPaint);window.removeEventListener('resize',measure); };
  }, []);
  return <div className="method-sequence" ref={rootRef}>
    <div className="method-stage" ref={stageRef}>
      <div className="method-panel" ref={panelRef}>
        <h2 id="t5">Da descoberta à evolução</h2>
        <div className="method-letter-layer" aria-hidden="true">
          {letters.map((letter,index)=><span className="method-letter" key={index} ref={element=>{letterRefs.current[index]=element;}}>{letter}</span>)}
          {steps.map((step,index)=><span className="method-label" key={step} ref={element=>{labelRefs.current[index]=element;}}><BlurText progress={reveals[index]} text={`— ${step}: ${explanations[index]}`}/></span>)}
        </div>
        <ol className="sr-only">{steps.map(step=><li key={step}>{step}: {explanations[steps.indexOf(step)]}</li>)}</ol>
        <p className="method-scroll-hint" ref={hintRef}>Continue rolando para conhecer o método</p>
        <a className="method-skip" href="#island-lab">Continuar para o LAB <span aria-hidden="true">↓</span></a>
      </div>
    </div>
  </div>;
}
export function mountMethod(element: HTMLElement) { createRoot(element).render(<IslandMethod />); }
