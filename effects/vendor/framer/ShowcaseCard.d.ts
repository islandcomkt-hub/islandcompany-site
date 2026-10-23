import type { ComponentType, CSSProperties } from 'react';
interface Props {
  className?:string; style?:CSSProperties; variant?:string;
  projectThumbnail:{src:string;alt?:string;positionX?:string;positionY?:string};
  projectName:string;projectCategory:string;projectOverview:string;projectDescription:string;
  clientName:string;projectDuration:string;toolsUsed:string;link:string;
}
declare const Component:ComponentType<Props>;
export default Component;
