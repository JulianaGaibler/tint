import type { Color } from '../../color';
export type { RgbValue, HslValue, OklchValue, OklabValue, P3Value, } from '../../color';
import type { RgbValue, HslValue, OklchValue, OklabValue, P3Value } from '../../color';
export type ColorFormat = 'hex' | 'css' | 'rgb' | 'hsl' | 'oklch' | 'oklab' | 'p3' | 'color';
export type ValueFor<F extends ColorFormat> = F extends 'hex' ? string : F extends 'css' ? string : F extends 'rgb' ? RgbValue : F extends 'hsl' ? HslValue : F extends 'oklch' ? OklchValue : F extends 'oklab' ? OklabValue : F extends 'p3' ? P3Value : F extends 'color' ? Color : never;
export type ContrastCategory = 'body' | 'large' | 'ui';
export interface ContrastOptions {
    /** The counterpart CSS color string to check against. */
    against: string;
    /** Whether the picked color is foreground or background. Default 'foreground'. */
    role?: 'foreground' | 'background';
    /** Opaque CSS color to α-blend against when picked has alpha < 1. */
    backdrop?: string;
    /**
     * Initial WCAG 2 category used by the contrast row's tune menu. body: body
     * text (AA ≥ 4.5, AAA ≥ 7) large: large text (AA ≥ 3, AAA ≥ 4.5) ui: UI
     * components / non-text (≥ 3) Default 'body'.
     */
    category?: ContrastCategory;
}
export type WideGamutMode = 'auto' | 'srgb' | 'p3';
