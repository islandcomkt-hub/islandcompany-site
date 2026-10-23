import type { ComponentType, CSSProperties } from 'react';
interface Image { src:string; alt?:string; }
interface Props {
  className?:string; style?:CSSProperties; variant?:string;
  cardOneHeading:string; cardOneSupportingText:string; cardOneImage:Image;
  cardTwoHeading:string; cardTwoSupportingText:string; cardTwoImage:Image;
  cardThreeHeading:string; cardThreeSupportingText:string; cardThreeImage:Image;
  cardFourHeading:string; cardFourSupportingText:string; cardFourImage:Image;
}
declare const Component:ComponentType<Props>;
export default Component;
