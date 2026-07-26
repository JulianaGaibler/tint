// Format → CSS string serializer used by the always-loaded ColorPicker
// shell (the closed swatch + label). Kept independent of `@lib/color` so
// the shell renders without pulling in parsing or color-space conversion.
// The full serializer in `@lib/color/serialize.ts` loads with the popover.
//
// For format='hex', `value` is contractually a hex string but consumers
// commonly pass `rgb(...)`, `rgba(...)`, or named colors when the values
// came from an external source (templates, imports, manifests). To keep
// the displayed text consistent with what the picker emits, the shell
// normalizes any CSS color string to hex via a DOM-based parse before
// returning. Results are memoized so repeated renders don't keep
// roundtripping through the DOM.
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
            return normalizeHexDisplay(value);
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
const hexCache = new Map();
const HEX_RE = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
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
export function canonicalCss(value) {
    if (!value)
        return value;
    const hex = normalizeHexDisplay(value).toUpperCase();
    if (/^#[0-9A-F]{8}$/.test(hex) && hex.endsWith('FF'))
        return hex.slice(0, 7);
    if (/^#[0-9A-F]{4}$/.test(hex) && hex.endsWith('F'))
        return hex.slice(0, 4);
    return hex;
}
/**
 * Normalize an arbitrary CSS color string to hex for display in the picker
 * shell. Values already in hex pass through unchanged. Keyword colors with no
 * hex representation (`transparent`, `currentColor`) are preserved so the label
 * stays meaningful. Anything the browser can't parse is returned as given.
 */
function normalizeHexDisplay(value) {
    if (!value)
        return value;
    if (HEX_RE.test(value))
        return value;
    if (value === 'transparent' || value === 'currentColor')
        return value;
    const cached = hexCache.get(value);
    if (cached !== undefined)
        return cached;
    if (typeof document === 'undefined')
        return value;
    const probe = document.createElement('span');
    probe.style.color = value;
    if (!probe.style.color) {
        hexCache.set(value, value);
        return value;
    }
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    const match = computed.match(/^rgba?\(([^)]+)\)$/i);
    if (!match) {
        hexCache.set(value, value);
        return value;
    }
    const parts = match[1]
        .split(/[,\s/]+/)
        .filter(Boolean)
        .map(Number);
    if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) {
        hexCache.set(value, value);
        return value;
    }
    const [r, g, b, a = 1] = parts;
    const hex = (n) => Math.round(Math.max(0, Math.min(255, n)))
        .toString(16)
        .padStart(2, '0')
        .toUpperCase();
    const result = a < 1
        ? `#${hex(r)}${hex(g)}${hex(b)}${hex(a * 255)}`
        : `#${hex(r)}${hex(g)}${hex(b)}`;
    hexCache.set(value, result);
    return result;
}
