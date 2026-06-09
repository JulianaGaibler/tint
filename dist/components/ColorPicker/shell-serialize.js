// Format → CSS string serializer used by the always-loaded ColorPicker
// shell (the closed swatch + label). Kept independent of `@lib/color` so
// the shell renders without pulling in parsing or color-space conversion.
// The full serializer in `@lib/color/serialize.ts` loads with the popover.
const num = (n) => {
    if (!Number.isFinite(n))
        return 'none';
    const r = Math.round(n * 1000) / 1000;
    return Number.isInteger(r) ? r.toFixed(0) : String(r);
};
const alphaPart = (a) => (a < 1 ? ` / ${num(a)}` : '');
/** Convert a format-typed value to a CSS color string. */
export function shellToCss(format, value) {
    var _a, _b, _c, _d, _e;
    switch (format) {
        case 'hex':
        case 'css':
            return value;
        case 'rgb': {
            const v = value;
            return `rgb(${Math.round(v.r)} ${Math.round(v.g)} ${Math.round(v.b)}${alphaPart((_a = v.alpha) !== null && _a !== void 0 ? _a : 1)})`;
        }
        case 'hsl': {
            const v = value;
            return `hsl(${num(v.h)} ${num(v.s)}% ${num(v.l)}%${alphaPart((_b = v.alpha) !== null && _b !== void 0 ? _b : 1)})`;
        }
        case 'oklch': {
            const v = value;
            return `oklch(${num(v.l)} ${num(v.c)} ${num(v.h)}${alphaPart((_c = v.alpha) !== null && _c !== void 0 ? _c : 1)})`;
        }
        case 'oklab': {
            const v = value;
            return `oklab(${num(v.l)} ${num(v.a)} ${num(v.b)}${alphaPart((_d = v.alpha) !== null && _d !== void 0 ? _d : 1)})`;
        }
        case 'p3': {
            const v = value;
            return `color(display-p3 ${num(v.r)} ${num(v.g)} ${num(v.b)}${alphaPart((_e = v.alpha) !== null && _e !== void 0 ? _e : 1)})`;
        }
        case 'color': {
            const v = value;
            // sRGB / HSL render in their natural function forms. Everything
            // else falls back to color() syntax, matching what the full
            // serializer would produce for the closed swatch.
            if (v.space === 'srgb') {
                return `rgb(${Math.round(v.components[0] * 255)} ${Math.round(v.components[1] * 255)} ${Math.round(v.components[2] * 255)}${alphaPart(v.alpha)})`;
            }
            if (v.space === 'hsl') {
                return `hsl(${num(v.components[0])} ${num(v.components[1])}% ${num(v.components[2])}%${alphaPart(v.alpha)})`;
            }
            if (v.space === 'oklch') {
                return `oklch(${num(v.components[0])} ${num(v.components[1])} ${num(v.components[2])}${alphaPart(v.alpha)})`;
            }
            if (v.space === 'oklab') {
                return `oklab(${num(v.components[0])} ${num(v.components[1])} ${num(v.components[2])}${alphaPart(v.alpha)})`;
            }
            return `color(${v.space} ${num(v.components[0])} ${num(v.components[1])} ${num(v.components[2])}${alphaPart(v.alpha)})`;
        }
        default:
            return '';
    }
}
