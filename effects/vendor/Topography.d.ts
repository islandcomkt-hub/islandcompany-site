import type { CSSProperties, ComponentType } from 'react';
interface TopographyProps {
  color?: string; lineCount?: number; lineWidth?: number; elevation?: number;
  foreground?: number; tilt?: number; speed?: number; direction?: 'forward'|'backward'|'left'|'right';
  glow?: number; depthOfField?: number; fog?: number; hoverEffect?: 'lift'|'trace'|'light';
  clickEffect?: string; scale?: number; dpr?: number; style?: CSSProperties; className?: string;
}
declare const Topography: ComponentType<TopographyProps>;
export default Topography;
