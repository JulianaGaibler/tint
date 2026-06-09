export type ColorSpace = 'srgb' | 'srgb-linear' | 'hsl' | 'display-p3' | 'display-p3-linear' | 'oklab' | 'oklch' | 'xyz-d65';
export type Components = readonly [number, number, number];
export interface Color {
    readonly space: ColorSpace;
    readonly components: Components;
    readonly alpha: number;
    readonly missing: {
        c0?: boolean;
        c1?: boolean;
        c2?: boolean;
        alpha?: boolean;
    };
    readonly legacy?: boolean;
}
export declare class ColorParseError extends Error {
    input: string;
    constructor(input: string, message: string);
}
export declare function makeColor(space: ColorSpace, components: Components, alpha?: number, opts?: {
    missing?: Color['missing'];
    legacy?: boolean;
}): Color;
