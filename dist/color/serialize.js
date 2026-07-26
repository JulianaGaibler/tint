// Serialize a Color back to a CSS string.
//
// Format and precision conventions follow Servo's
// `components/style/color/to_css.rs` (MPL 2.0). We use the
// "author-preferred" 2-decimal-place rounding for floats.
import { convert } from './convert';
const round2 = (n) => {
    if (Number.isNaN(n))
        return 'none';
    const r = Math.round(n * 100) / 100;
    return Number.isInteger(r) ? r.toFixed(0) : String(r);
};
const round3 = (n) => {
    if (Number.isNaN(n))
        return 'none';
    const r = Math.round(n * 1000) / 1000;
    return Number.isInteger(r) ? r.toFixed(0) : String(r);
};
const formatByte = (v) => {
    if (Number.isNaN(v))
        return 'none';
    return String(Math.max(0, Math.min(255, Math.round(v * 255))));
};
const formatAlpha = (a) => {
    if (Number.isNaN(a))
        return 'none';
    if (a >= 1)
        return '1';
    if (a <= 0)
        return '0';
    return String(Math.round(a * 1000) / 1000);
};
/** Render a Color as a CSS string in its native space (or as hex for sRGB). */
export function toCss(c) {
    switch (c.space) {
        case 'srgb':
            return c.legacy ? toLegacyRgb(c) : toModernRgb(c);
        case 'hsl':
            return toLegacyHsl(c);
        case 'srgb-linear':
            return toColorFn('srgb-linear', c);
        case 'display-p3':
            return toColorFn('display-p3', c);
        case 'display-p3-linear':
            return toColorFn('display-p3-linear', c);
        case 'xyz-d65':
            return toColorFn('xyz-d65', c);
        case 'oklab': {
            const [l, a, b] = c.components;
            const alpha = c.alpha < 1 ? ` / ${formatAlpha(c.alpha)}` : '';
            return `oklab(${round3(l)} ${round3(a)} ${round3(b)}${alpha})`;
        }
        case 'oklch': {
            const [l, ch, h] = c.components;
            const alpha = c.alpha < 1 ? ` / ${formatAlpha(c.alpha)}` : '';
            return `oklch(${round3(l)} ${round3(ch)} ${round2(h)}${alpha})`;
        }
    }
}
/** Render a Color as #RRGGBB or #RRGGBBAA. Out-of-sRGB colors are clipped. */
export function toHex(c) {
    const srgb = c.space === 'srgb' ? c : convert(c, 'srgb');
    const clip = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
    const r = clip(srgb.components[0]);
    const g = clip(srgb.components[1]);
    const b = clip(srgb.components[2]);
    const hex2 = (n) => n.toString(16).padStart(2, '0').toUpperCase();
    if (srgb.alpha < 1) {
        return '#' + hex2(r) + hex2(g) + hex2(b) + hex2(clip(srgb.alpha));
    }
    return '#' + hex2(r) + hex2(g) + hex2(b);
}
function toLegacyRgb(c) {
    const r = formatByte(c.components[0]);
    const g = formatByte(c.components[1]);
    const b = formatByte(c.components[2]);
    if (c.alpha < 1) {
        return `rgba(${r}, ${g}, ${b}, ${formatAlpha(c.alpha)})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
}
function toModernRgb(c) {
    const r = formatByte(c.components[0]);
    const g = formatByte(c.components[1]);
    const b = formatByte(c.components[2]);
    const alpha = c.alpha < 1 ? ` / ${formatAlpha(c.alpha)}` : '';
    return `rgb(${r} ${g} ${b}${alpha})`;
}
function toLegacyHsl(c) {
    const [h, s, l] = c.components;
    if (c.alpha < 1) {
        return `hsla(${round2(h)}, ${round2(s)}%, ${round2(l)}%, ${formatAlpha(c.alpha)})`;
    }
    return `hsl(${round2(h)}, ${round2(s)}%, ${round2(l)}%)`;
}
function toColorFn(space, c) {
    const [c0, c1, c2] = c.components;
    const alpha = c.alpha < 1 ? ` / ${formatAlpha(c.alpha)}` : '';
    return `color(${space} ${round3(c0)} ${round3(c1)} ${round3(c2)}${alpha})`;
}
