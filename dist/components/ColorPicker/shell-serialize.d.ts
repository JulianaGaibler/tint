import type { ColorFormat, ValueFor } from './format';
/** Convert a format-typed value to a CSS color string. */
export declare function shellToCss<F extends ColorFormat>(format: F, value: ValueFor<F>): string;
/**
 * Canonicalize an arbitrary CSS color string for **comparison** (not display).
 * Same DOM-based normalization as the display path, then upper-cased and with
 * any fully-opaque alpha stripped so `#ff0000` ↔ `#FF0000FF` ↔ `hsl(0 100%
 * 50%)` collapse to the same key. Inputs the browser can't parse fall through
 * unchanged.
 *
 * Kept here (instead of in palette.ts) so the always-loaded ColorPicker shell
 * can match the current value against a palette without pulling in the
 * `@lib/color` engine — that engine still loads with the popover.
 */
export declare function canonicalCss(value: string): string;
