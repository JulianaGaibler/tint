// WCAG 2 contrast.
//
// WCAG 2.x relative luminance is defined for sRGB only
// (https://www.w3.org/TR/WCAG21/#dfn-relative-luminance), so wide-gamut
// inputs are per-channel-clipped to sRGB before luminance is computed.
// The `clipped` flag on the result lets callers flag this in the UI.
import { convert, srgbToLinear } from './convert';
import { clipTo } from './gamut';
const FAIL = {
    ratio: null,
    clipped: false,
    normalText: 'fail',
    largeText: 'fail',
    uiComponents: 'fail',
    reason: 'alpha-without-backdrop',
};
/** Source-over compositing: `top` over `bottom`. Returns an opaque sRGB color. */
export function alphaComposite(top, bottom) {
    const t = convert(top, 'srgb');
    const b = convert(bottom, 'srgb');
    const ta = t.alpha;
    const ba = b.alpha;
    const outA = ta + ba * (1 - ta);
    if (outA <= 0)
        return Object.assign(Object.assign({}, b), { components: [0, 0, 0], alpha: 0 });
    const blend = (i) => (t.components[i] * ta + b.components[i] * ba * (1 - ta)) / outA;
    return Object.assign(Object.assign({}, t), { components: [blend(0), blend(1), blend(2)], alpha: outA });
}
/** Compute WCAG 2 relative luminance from an sRGB-clipped color. */
export function relativeLuminance(color) {
    const clipped = clipTo(color, 'srgb');
    const [r, g, b] = srgbToLinear(clipped.components);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function level(ratio, aaThreshold, aaaThreshold) {
    if (ratio >= aaaThreshold)
        return 'AAA';
    if (ratio >= aaThreshold)
        return 'AA';
    return 'fail';
}
/**
 * Compute the WCAG 2 contrast ratio between two colors.
 *
 * If either input has alpha < 1 and no `backdrop` is provided, returns `ratio:
 * null` because WCAG 2 is undefined for translucent colors.
 */
export function contrast({ color, against, backdrop, }) {
    const needsBackdrop = color.alpha < 1 || against.alpha < 1;
    if (needsBackdrop && !backdrop) {
        return FAIL;
    }
    const a = needsBackdrop && backdrop ? alphaComposite(color, backdrop) : color;
    const b = needsBackdrop && backdrop ? alphaComposite(against, backdrop) : against;
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    const lighter = Math.max(la, lb);
    const darker = Math.min(la, lb);
    const ratio = (lighter + 0.05) / (darker + 0.05);
    const clipped = !inUnit(convert(color, 'srgb').components);
    return {
        ratio,
        clipped,
        normalText: level(ratio, 4.5, 7),
        largeText: level(ratio, 3, 4.5),
        uiComponents: level(ratio, 3, 3),
    };
}
function inUnit(c) {
    return c.every((v) => v >= 0 - 1e-6 && v <= 1 + 1e-6);
}
