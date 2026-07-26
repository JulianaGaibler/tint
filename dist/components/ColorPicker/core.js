// Format ↔ Color round-trip helpers used inside the lazy popover.
// Imports the full color/ module (parsing, serialization, conversion).
import { ColorParseError, convert, makeColor, parseColor, toCss, toHex, } from '../../color';
const SPACE_FOR_FORMAT = {
    rgb: 'srgb',
    hsl: 'hsl',
    oklch: 'oklch',
    oklab: 'oklab',
    p3: 'display-p3',
};
/** Parse a format-typed value into the internal Color representation. */
export function valueToColor(format, value) {
    var _a, _b, _c, _d, _e;
    if (value == null || (typeof value === 'string' && value === '')) {
        return makeColor('srgb', [0, 0, 0], 1, { legacy: true });
    }
    if (format === 'hex' || format === 'css') {
        return parseColor(value);
    }
    if (format === 'color') {
        return value;
    }
    const space = SPACE_FOR_FORMAT[format];
    if (format === 'rgb') {
        const v = value;
        return makeColor(space, [v.r / 255, v.g / 255, v.b / 255], (_a = v.alpha) !== null && _a !== void 0 ? _a : 1);
    }
    if (format === 'hsl') {
        const v = value;
        return makeColor(space, [v.h, v.s, v.l], (_b = v.alpha) !== null && _b !== void 0 ? _b : 1);
    }
    if (format === 'oklch') {
        const v = value;
        return makeColor(space, [v.l, v.c, v.h], (_c = v.alpha) !== null && _c !== void 0 ? _c : 1);
    }
    if (format === 'oklab') {
        const v = value;
        return makeColor(space, [v.l, v.a, v.b], (_d = v.alpha) !== null && _d !== void 0 ? _d : 1);
    }
    if (format === 'p3') {
        const v = value;
        return makeColor(space, [v.r, v.g, v.b], (_e = v.alpha) !== null && _e !== void 0 ? _e : 1);
    }
    throw new Error(`[tint/color] unknown format "${String(format)}"`);
}
/** Convert an internal Color to the format-typed value the consumer expects. */
export function colorToValue(format, color) {
    if (format === 'hex')
        return toHex(color);
    if (format === 'css')
        return toCss(color);
    if (format === 'color')
        return color;
    const target = SPACE_FOR_FORMAT[format];
    const c = color.space === target ? color : convert(color, target);
    if (format === 'rgb') {
        return {
            r: c.components[0] * 255,
            g: c.components[1] * 255,
            b: c.components[2] * 255,
            alpha: c.alpha,
        };
    }
    if (format === 'hsl') {
        return {
            h: c.components[0],
            s: c.components[1],
            l: c.components[2],
            alpha: c.alpha,
        };
    }
    if (format === 'oklch') {
        return {
            l: c.components[0],
            c: c.components[1],
            h: c.components[2],
            alpha: c.alpha,
        };
    }
    if (format === 'oklab') {
        return {
            l: c.components[0],
            a: c.components[1],
            b: c.components[2],
            alpha: c.alpha,
        };
    }
    if (format === 'p3') {
        return {
            r: c.components[0],
            g: c.components[1],
            b: c.components[2],
            alpha: c.alpha,
        };
    }
    throw new Error(`[tint/color] unknown format "${String(format)}"`);
}
/** Try-parse a CSS string. Returns null on parse failure. */
export function tryParseColor(input) {
    try {
        return parseColor(input);
    }
    catch (e) {
        if (e instanceof ColorParseError)
            return null;
        throw e;
    }
}
const WINDOW_PADDING = 8;
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
export function placePopover(anchor, popoverRect, windowDims) {
    const PAD = WINDOW_PADDING;
    const popW = popoverRect.width;
    // Available space in each direction, measured from the anchor's edge to
    // the corresponding viewport edge minus padding. Already PAD-net — the
    // shrink branch below uses these as-is without subtracting PAD again.
    const spaceBelow = windowDims.innerHeight - PAD - (anchor.y + anchor.height);
    const spaceAbove = anchor.y - PAD;
    // "extends right" means the popover's left edge is anchored at the
    // anchor's left edge, so it can grow to the right.
    const spaceRight = windowDims.innerWidth - PAD - anchor.x;
    // "extends left" means the popover's right edge is anchored at the
    // anchor's right edge, so it can grow to the left.
    const spaceLeft = anchor.x + anchor.width - PAD;
    // Vertical: prefer below, fall back to above. When neither side fits the
    // full popover, pick the side with more room AND cap the popover's
    // height to that side's space — by construction the popover then fits
    // on that side and doesn't need a hard clamp.
    const naturalH = popoverRect.height;
    let yAnchor;
    let popH;
    let maxHeight;
    if (naturalH <= spaceBelow) {
        yAnchor = 'top';
        popH = naturalH;
    }
    else if (naturalH <= spaceAbove) {
        yAnchor = 'bottom';
        popH = naturalH;
    }
    else {
        yAnchor = spaceBelow >= spaceAbove ? 'top' : 'bottom';
        maxHeight = Math.max(spaceBelow, spaceAbove);
        popH = maxHeight;
    }
    // Horizontal: prefer right (anchor's left edge → popover's left edge),
    // fall back to left, then to whichever side has more room.
    const fitsRight = popW <= spaceRight;
    const fitsLeft = popW <= spaceLeft;
    let xAnchor;
    if (fitsRight)
        xAnchor = 'left';
    else if (fitsLeft)
        xAnchor = 'right';
    else
        xAnchor = spaceRight >= spaceLeft ? 'left' : 'right';
    let x;
    if (xAnchor === 'left')
        x = anchor.x;
    else
        x = anchor.x + anchor.width - popW;
    let y;
    if (yAnchor === 'top')
        y = anchor.y + anchor.height;
    else
        y = anchor.y - popH;
    // Horizontal safety clamp for popovers wider than the viewport. Vertical
    // overflow can't happen here: `popH` is capped to whichever side has the
    // most space, so the popover fits in its anchored direction by
    // construction.
    if (x + popW > windowDims.innerWidth - PAD) {
        x = windowDims.innerWidth - popW - PAD;
    }
    if (x < PAD)
        x = PAD;
    const placement = yAnchor === 'top'
        ? xAnchor === 'left'
            ? 'top-left'
            : 'top-right'
        : xAnchor === 'left'
            ? 'bottom-left'
            : 'bottom-right';
    return {
        x,
        y,
        placement,
        maxHeight,
    };
}
