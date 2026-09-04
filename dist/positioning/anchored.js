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
export const WINDOW_PADDING = 8;
const OPPOSITE = {
    'block-start': 'block-end',
    'block-end': 'block-start',
    'inline-start': 'inline-end',
    'inline-end': 'inline-start',
};
/**
 * Places `surface` against `anchor`, flipping sides and shifting along the
 * cross axis to stay inside `viewport`. All rects are viewport relative.
 */
export function placeAnchored(anchor, surface, viewport, options = {}) {
    const { side: preferred = 'block-end', offset = 0, arrowSize = 0, viewportPadding = WINDOW_PADDING, arrowPadding = 0, } = options;
    const gap = offset + arrowSize;
    const onBlockAxis = preferred === 'block-start' || preferred === 'block-end';
    // Naming the two axes after the side, rather than branching four ways, keeps
    // one copy of the maths.
    const main = onBlockAxis
        ? {
            anchorStart: anchor.y,
            anchorSize: anchor.height,
            size: surface.height,
            viewport: viewport.innerHeight,
        }
        : {
            anchorStart: anchor.x,
            anchorSize: anchor.width,
            size: surface.width,
            viewport: viewport.innerWidth,
        };
    const cross = onBlockAxis
        ? {
            anchorStart: anchor.x,
            anchorSize: anchor.width,
            size: surface.width,
            viewport: viewport.innerWidth,
        }
        : {
            anchorStart: anchor.y,
            anchorSize: anchor.height,
            size: surface.height,
            viewport: viewport.innerHeight,
        };
    // Gap already taken out, so these compare against the surface's own size.
    const roomBefore = main.anchorStart - viewportPadding - gap;
    const roomAfter = main.viewport - viewportPadding - (main.anchorStart + main.anchorSize) - gap;
    const wantsBefore = preferred === 'block-start' || preferred === 'inline-start';
    let before = wantsBefore;
    let maxSize;
    if (main.size > (wantsBefore ? roomBefore : roomAfter)) {
        if (main.size <= (wantsBefore ? roomAfter : roomBefore)) {
            before = !wantsBefore;
        }
        else {
            // Take the roomier side and cap the surface to it, so it shrinks against
            // the anchor instead of detaching from it.
            before = roomBefore >= roomAfter;
            maxSize = Math.max(0, Math.max(roomBefore, roomAfter));
        }
    }
    const mainSize = maxSize !== null && maxSize !== void 0 ? maxSize : main.size;
    const mainPos = before
        ? main.anchorStart - gap - mainSize
        : main.anchorStart + main.anchorSize + gap;
    // Whatever the push back inside the viewport moved is what the arrow has to
    // give back to stay over the anchor.
    const centred = cross.anchorStart + (cross.anchorSize - cross.size) / 2;
    const lowest = viewportPadding;
    const highest = cross.viewport - viewportPadding - cross.size;
    let crossPos = centred;
    if (centred < lowest)
        crossPos = lowest;
    else if (centred > highest)
        crossPos = highest;
    const reach = Math.max(0, cross.size / 2 - arrowPadding);
    const arrowOffset = Math.max(-reach, Math.min(reach, centred - crossPos));
    return {
        x: onBlockAxis ? crossPos : mainPos,
        y: onBlockAxis ? mainPos : crossPos,
        side: before === wantsBefore ? preferred : OPPOSITE[preferred],
        arrowOffset,
        maxSize,
    };
}
