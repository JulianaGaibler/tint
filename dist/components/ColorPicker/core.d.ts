import { type Color } from '../../color';
import type { ColorFormat, ValueFor } from './format';
/** Parse a format-typed value into the internal Color representation. */
export declare function valueToColor<F extends ColorFormat>(format: F, value: ValueFor<F>): Color;
/** Convert an internal Color to the format-typed value the consumer expects. */
export declare function colorToValue<F extends ColorFormat>(format: F, color: Color): ValueFor<F>;
export type EditorSpace = 'hsl' | 'oklch' | 'rgb';
/** Try-parse a CSS string. Returns null on parse failure. */
export declare function tryParseColor(input: string): Color | null;
/**
 * Which corner of the popover lands at the anchor. Also used as the
 * `transform-origin` for the open animation so the popover scales toward the
 * input it's attached to.
 *
 * Top-left popover sits BELOW the anchor, extending RIGHT top-right popover
 * sits BELOW the anchor, extending LEFT bottom-left popover sits ABOVE the
 * anchor, extending RIGHT bottom-right popover sits ABOVE the anchor, extending
 * LEFT
 */
export type PopoverPlacement = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
/**
 * Position a popover anchored to a trigger element. Decides vertical (above vs
 * below) and horizontal (extends right vs left) independently based on
 * available space. When neither side has full room vertically, picks the side
 * with more space and returns a `maxHeight` cap so the popover shrinks instead
 * of detaching from the anchor — the caller applies the cap and the popover's
 * internal content scrolls.
 *
 * Coordinates are viewport-relative — the popover is rendered in the top-layer
 * via `showPopover()`, whose containing block is the viewport.
 *
 * Modeled on the AUTOCOMPLETE branch of `menu/core/positioning.ts`.
 */
export declare function placePopover(anchor: DOMRect, popoverRect: DOMRect, windowDims: {
    innerWidth: number;
    innerHeight: number;
}): {
    x: number;
    y: number;
    placement: PopoverPlacement;
    maxHeight: number | undefined;
};
