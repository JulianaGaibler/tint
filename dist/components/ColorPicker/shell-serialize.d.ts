import type { ColorFormat, ValueFor } from './format';
/** Convert a format-typed value to a CSS color string. */
export declare function shellToCss<F extends ColorFormat>(format: F, value: ValueFor<F>): string;
