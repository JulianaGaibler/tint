/**
 * Placement for a surface that hangs off an anchor and points at it.
 *
 * Shared by the `tooltip` action and `Callout`, the two surfaces with an arrow
 * to keep over the anchor. `Menu` and the colour picker's popover have their
 * own placement, built around submenu depth and corner alignment.
 *
 * The inline axis is treated as running left to right, as it is in every other
 * positioner here. Real writing mode support is a change to all of them.
 */
/** Distance every surface keeps from the edge of the viewport. */
export declare const WINDOW_PADDING = 8;
/** Which side of the anchor the surface sits on. */
export type AnchoredSide = 'block-start' | 'block-end' | 'inline-start' | 'inline-end';
export interface AnchoredOptions {
    /** Preferred side. Flips to the opposite side when that side cannot fit. */
    side?: AnchoredSide;
    /** Gap between the anchor and the surface, before the arrow is added. */
    offset?: number;
    /** How far the arrow reaches out of the surface. Added to `offset`. */
    arrowSize?: number;
    /** Distance kept from the viewport edge. */
    viewportPadding?: number;
    /**
     * How far the arrow stays from the surface's cross axis edges. A rounded
     * surface needs at least its corner radius, or a shifted arrow lands on the
     * curve.
     */
    arrowPadding?: number;
}
export interface AnchoredPlacement {
    /** Viewport relative, so a document positioned caller adds its own scroll. */
    x: number;
    y: number;
    /** The side actually used, which is not the requested side after a flip. */
    side: AnchoredSide;
    /**
     * How far the arrow moves along the cross axis to stay over the anchor's
     * centre after a viewport edge shifted the surface off it. The axis it moves
     * on follows `side`: horizontal for a block side, vertical for an inline
     * one.
     */
    arrowOffset: number;
    /**
     * Cap on the surface along the side's own axis, set only when neither side
     * had room for it. The caller applies it and lets the content scroll.
     */
    maxSize: number | undefined;
}
/**
 * Places `surface` against `anchor`, flipping sides and shifting along the
 * cross axis to stay inside `viewport`. All rects are viewport relative.
 */
export declare function placeAnchored(anchor: DOMRect, surface: DOMRect, viewport: {
    innerWidth: number;
    innerHeight: number;
}, options?: AnchoredOptions): AnchoredPlacement;
