import type { CSSProperties, ComponentType } from 'react';
interface PatternWavesProps {
  preset?: 'silk' | 'ripple' | 'grain'; color?: string; backgroundColor?: string;
  fade?: 'none' | 'edges' | 'center' | 'top' | 'bottom'; interactive?: boolean;
  cursorSize?: number; cursorStrength?: number; pattern?: 'dot' | 'square' | 'ascii';
  wave?: 'silk' | 'ripple' | 'grain'; spacing?: number; markSize?: number; depth?: number;
  light?: number; shine?: number; contrast?: number; speed?: number; scale?: number;
  direction?: number; opacity?: number; fadeSize?: number; characters?: string;
  intro?: boolean; paused?: boolean; dpr?: number; style?: CSSProperties; className?: string;
}
declare const PatternWaves: ComponentType<PatternWavesProps>;
export default PatternWaves;
