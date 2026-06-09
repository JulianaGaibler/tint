// Color types shared across the color/ module.
//
// Conversion math, naming, and the white-point table are adapted from
// Servo's `components/style/color/` (MPL 2.0). See LICENSE-MPL-2.0 comments
// in convert.ts.
export class ColorParseError extends Error {
    constructor(input, message) {
        super(`[tint/color] could not parse "${input}": ${message}`);
        this.input = input;
        this.name = 'ColorParseError';
    }
}
export function makeColor(space, components, alpha = 1, opts = {}) {
    var _a;
    return {
        space,
        components,
        alpha,
        missing: (_a = opts.missing) !== null && _a !== void 0 ? _a : {},
        legacy: opts.legacy,
    };
}
