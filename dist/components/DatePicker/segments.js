// The typed segment model: building the segment list for a mode and
// preference pair, digit-by-digit entry, arrow-key stepping, and the
// month-length clamp. Kept pure (no Svelte, no DOM) so SegmentInput.svelte
// stays a thin binding over this.
import { daysInMonth } from './calendar.js';
function digit(type, min, max, pad, value) {
    return { type, min, max, pad, value };
}
function literal(text) {
    return { type: 'literal', text, value: null, min: 0, max: 0, pad: 0 };
}
/**
 * The ordered segment list for `mode`, laid out per `prefs.dateOrder` and
 * `prefs.hourCycle` with `separator` between date components.
 *
 * `parts` seeds each segment's value, and is `null` for an empty field. Passing
 * the current parts back in after a month or year edit is what lets the day
 * segment's upper bound track the month's real length.
 */
export function buildSegments(mode, prefs, separator, parts, opts = {}) {
    function dateSegments() {
        var _a, _b, _c;
        const day = digit('day', 1, parts ? daysInMonth(parts.year, parts.month) : 31, 2, (_a = parts === null || parts === void 0 ? void 0 : parts.day) !== null && _a !== void 0 ? _a : null);
        const month = digit('month', 1, 12, 2, (_b = parts === null || parts === void 0 ? void 0 : parts.month) !== null && _b !== void 0 ? _b : null);
        const year = digit('year', 1, 9999, 4, (_c = parts === null || parts === void 0 ? void 0 : parts.year) !== null && _c !== void 0 ? _c : null);
        if (prefs.dateOrder === 'DMY') {
            return [day, literal(separator), month, literal(separator), year];
        }
        if (prefs.dateOrder === 'MDY') {
            return [month, literal(separator), day, literal(separator), year];
        }
        return [year, literal(separator), month, literal(separator), day];
    }
    function timeSegments() {
        var _a, _b;
        const is12Hour = prefs.hourCycle === 12;
        const hourValue = (() => {
            if (!parts)
                return null;
            if (!is12Hour)
                return parts.hour;
            const h = parts.hour % 12;
            return h === 0 ? 12 : h;
        })();
        const hour = digit('hour', is12Hour ? 1 : 0, is12Hour ? 12 : 23, 2, hourValue);
        const minute = digit('minute', 0, 59, 2, (_a = parts === null || parts === void 0 ? void 0 : parts.minute) !== null && _a !== void 0 ? _a : null);
        const segments = [hour, literal(':'), minute];
        if (opts.seconds) {
            segments.push(literal(':'), digit('second', 0, 59, 2, (_b = parts === null || parts === void 0 ? void 0 : parts.second) !== null && _b !== void 0 ? _b : null));
        }
        if (is12Hour) {
            const dayPeriodValue = parts ? (parts.hour >= 12 ? 1 : 0) : null;
            segments.push(literal(' '), digit('dayPeriod', 0, 1, 0, dayPeriodValue));
        }
        return segments;
    }
    if (mode === 'date')
        return dateSegments();
    if (mode === 'time')
        return timeSegments();
    return [...dateSegments(), literal(' '), ...timeSegments()];
}
/**
 * Appends `digit` to a segment being typed into, given the digits already
 * buffered for it.
 *
 * A segment commits, and the caller should advance to the next one, either once
 * its digit width (`pad`) is reached or once one more digit could no longer fit
 * under `max`. The second condition is also what lets a single keystroke like
 * `9` on a two digit month commit immediately, the same way typing into a
 * native date input does.
 */
export function typeDigit(segment, digitValue, buffer) {
    if (segment.type === 'literal' || segment.type === 'dayPeriod') {
        return { segment, buffer: '', advance: false };
    }
    const candidate = buffer === '' ? digitValue : Number(buffer + digitValue);
    if (candidate > segment.max) {
        if (buffer === '') {
            // Only reachable if a single digit alone exceeds `max`, which none of
            // this module's segments allow since every `max` is at least 9.
            return {
                segment: Object.assign(Object.assign({}, segment), { value: segment.max }),
                buffer: '',
                advance: true,
            };
        }
        return {
            segment: Object.assign(Object.assign({}, segment), { value: Number(buffer) }),
            buffer: '',
            advance: true,
            carry: digitValue,
        };
    }
    const newBuffer = buffer + digitValue;
    const full = newBuffer.length >= segment.pad || candidate * 10 > segment.max;
    return {
        segment: Object.assign(Object.assign({}, segment), { value: candidate }),
        buffer: full ? '' : newBuffer,
        advance: full,
    };
}
/** `segment.value` moved by `delta`, wrapping at `min`/`max`. */
export function step(segment, delta) {
    if (segment.type === 'literal')
        return segment;
    if (segment.value === null) {
        return Object.assign(Object.assign({}, segment), { value: delta > 0 ? segment.min : segment.max });
    }
    const span = segment.max - segment.min + 1;
    const wrapped = ((((segment.value - segment.min + delta) % span) + span) % span) +
        segment.min;
    return Object.assign(Object.assign({}, segment), { value: wrapped });
}
/**
 * Sets a `dayPeriod` segment directly, for the `a`/`p` keys. No-op on any other
 * type.
 */
export function setDayPeriod(segment, period) {
    if (segment.type !== 'dayPeriod')
        return segment;
    return Object.assign(Object.assign({}, segment), { value: period });
}
/**
 * Reconstructs `DateParts` from a segment list, or `null` while any editable
 * segment is still empty.
 *
 * A 12 hour `hour` plus its `dayPeriod` combine into the 24 hour value
 * `DateParts` always carries. A field without year, month, day, or seconds
 * segments (a `time` mode field, or one without `seconds`) fills those with
 * placeholders, since `core.ts` ignores them for those shapes.
 */
export function partsFromSegments(segments) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const byType = new Map();
    for (const segment of segments) {
        if (segment.type === 'literal')
            continue;
        if (segment.value === null)
            return null;
        byType.set(segment.type, segment);
    }
    let hour = (_b = (_a = byType.get('hour')) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0;
    const dayPeriod = byType.get('dayPeriod');
    if (dayPeriod) {
        const isPM = dayPeriod.value === 1;
        hour = hour === 12 ? (isPM ? 12 : 0) : isPM ? hour + 12 : hour;
    }
    return {
        year: (_d = (_c = byType.get('year')) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 0,
        month: (_f = (_e = byType.get('month')) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : 1,
        day: (_h = (_g = byType.get('day')) === null || _g === void 0 ? void 0 : _g.value) !== null && _h !== void 0 ? _h : 1,
        hour,
        minute: (_k = (_j = byType.get('minute')) === null || _j === void 0 ? void 0 : _j.value) !== null && _k !== void 0 ? _k : 0,
        second: (_m = (_l = byType.get('second')) === null || _l === void 0 ? void 0 : _l.value) !== null && _m !== void 0 ? _m : 0,
    };
}
/**
 * `parts.day`, pulled back to the last real day of `parts.month` if it
 * overflows.
 */
export function clampDayToMonth(parts) {
    const max = daysInMonth(parts.year, parts.month);
    return parts.day > max ? Object.assign(Object.assign({}, parts), { day: max }) : parts;
}
