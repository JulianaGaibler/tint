import type { Color } from './types';
/** Render a Color as a CSS string in its native space (or as hex for sRGB). */
export declare function toCss(c: Color): string;
/** Render a Color as #RRGGBB or #RRGGBBAA. Out-of-sRGB colors are clipped. */
export declare function toHex(c: Color): string;
