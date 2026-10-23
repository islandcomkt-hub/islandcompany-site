import { useEffect, useRef } from 'react';
import { createPatternWaves } from './PatternWaves.engine.js';

/*
 * PatternWaves — mesma API de props do componente React Bits.
 * O container deve ter altura definida (ou ser absolutamente posicionado).
 */
export default function PatternWaves({ style, className, ...props }) {
  const ref = useRef(null);
  const engine = useRef(null);
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    engine.current = createPatternWaves(ref.current, latest.current);
    return () => { engine.current && engine.current.destroy(); engine.current = null; };
  }, []);

  const key = JSON.stringify(props);
  useEffect(() => { engine.current && engine.current.update(latest.current); }, [key]);

  return <div ref={ref} className={className} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }} aria-hidden="true" />;
}
