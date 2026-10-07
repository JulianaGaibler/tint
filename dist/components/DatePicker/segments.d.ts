import type { DateFormatPreferences } from './prefs.js';
import type { DateMode, DateParts } from './format.js';
export type SegmentType = 'day' | 'month' | 'year' | 'hour' | 'minute' | 'second' | 'dayPeriod' | 'literal';
export interface Segment {
    type: SegmentType;
    /** The literal string itself. Set only when `type` is `'literal'`. */
    text?: string;
    /**
     * `null` renders the segment's placeholder. For `dayPeriod`, 0 is AM and 1 is
     * PM.
     */
    value: number | null;
    min: number;
    max: number;
    /** Digit width for display: 2 for everything but a 4 digit year. */
    pad: number;
}
export interface BuildSegmentsOptions {
    seconds?: boolean;
}
/**
 * The ordered segment list for `mode`, laid out per `prefs.dateOrder` and
 * `prefs.hourCycle` with `separator` between date components.
 *
 * `parts` seeds each segment's value, and is `null` for an empty field. Passing
 * the current parts back in after a month or year edit is what lets the day
 * segment's upper bound track the month's real length.
 */
export declare function buildSegments(mode: DateMode, prefs: DateFormatPreferences, separator: string, parts: DateParts | null, opts?: BuildSegmentsOptions): Segment[];
export interface TypeDigitResult {
    segment: Segment;
    buffer: string;
    advance: boolean;
    /**
     * A digit that overflowed this segment's range and belongs to whatever the
     * caller moves focus to next. Set only when `buffer` was non-empty and the
     * new digit would have pushed the candidate value past `segment.max`.
     */
    carry?: number;
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
export declare function typeDigit(segment: Segment, digitValue: number, buffer: string): TypeDigitResult;
/** `segment.value` moved by `delta`, wrapping at `min`/`max`. */
export declare function step(segment: Segment, delta: number): Segment;
/**
 * Sets a `dayPeriod` segment directly, for the `a`/`p` keys. No-op on any other
 * type.
 */
export declare function setDayPeriod(segment: Segment, period: 0 | 1): Segment;
/**
 * Reconstructs `DateParts` from a segment list, or `null` while any editable
 * segment is still empty.
 *
 * A 12 hour `hour` plus its `dayPeriod` combine into the 24 hour value
 * `DateParts` always carries. A field without year, month, day, or seconds
 * segments (a `time` mode field, or one without `seconds`) fills those with
 * placeholders, since `core.ts` ignores them for those shapes.
 */
export declare function partsFromSegments(segments: Segment[]): DateParts | null;
/**
 * `parts.day`, pulled back to the last real day of `parts.month` if it
 * overflows.
 */
export declare function clampDayToMonth(parts: DateParts): DateParts;
