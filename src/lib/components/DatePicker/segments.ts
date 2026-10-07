// The typed segment model: building the segment list for a mode and
// preference pair, digit-by-digit entry, arrow-key stepping, and the
// month-length clamp. Kept pure (no Svelte, no DOM) so SegmentInput.svelte
// stays a thin binding over this.

import { daysInMonth } from './calendar.js'
import type { DateFormatPreferences } from './prefs.js'
import type { DateMode, DateParts } from './format.js'

export type SegmentType =
  | 'day'
  | 'month'
  | 'year'
  | 'hour'
  | 'minute'
  | 'second'
  | 'dayPeriod'
  | 'literal'

export interface Segment {
  type: SegmentType
  /** The literal string itself. Set only when `type` is `'literal'`. */
  text?: string
  /**
   * `null` renders the segment's placeholder. For `dayPeriod`, 0 is AM and 1 is
   * PM.
   */
  value: number | null
  min: number
  max: number
  /** Digit width for display: 2 for everything but a 4 digit year. */
  pad: number
}

function digit(
  type: SegmentType,
  min: number,
  max: number,
  pad: number,
  value: number | null,
): Segment {
  return { type, min, max, pad, value }
}

function literal(text: string): Segment {
  return { type: 'literal', text, value: null, min: 0, max: 0, pad: 0 }
}

export interface BuildSegmentsOptions {
  seconds?: boolean
}

/**
 * The ordered segment list for `mode`, laid out per `prefs.dateOrder` and
 * `prefs.hourCycle` with `separator` between date components.
 *
 * `parts` seeds each segment's value, and is `null` for an empty field. Passing
 * the current parts back in after a month or year edit is what lets the day
 * segment's upper bound track the month's real length.
 */
export function buildSegments(
  mode: DateMode,
  prefs: DateFormatPreferences,
  separator: string,
  parts: DateParts | null,
  opts: BuildSegmentsOptions = {},
): Segment[] {
  function dateSegments(): Segment[] {
    const day = digit(
      'day',
      1,
      parts ? daysInMonth(parts.year, parts.month) : 31,
      2,
      parts?.day ?? null,
    )
    const month = digit('month', 1, 12, 2, parts?.month ?? null)
    const year = digit('year', 1, 9999, 4, parts?.year ?? null)
    if (prefs.dateOrder === 'DMY') {
      return [day, literal(separator), month, literal(separator), year]
    }
    if (prefs.dateOrder === 'MDY') {
      return [month, literal(separator), day, literal(separator), year]
    }
    return [year, literal(separator), month, literal(separator), day]
  }

  function timeSegments(): Segment[] {
    const is12Hour = prefs.hourCycle === 12
    const hourValue = (() => {
      if (!parts) return null
      if (!is12Hour) return parts.hour
      const h = parts.hour % 12
      return h === 0 ? 12 : h
    })()
    const hour = digit(
      'hour',
      is12Hour ? 1 : 0,
      is12Hour ? 12 : 23,
      2,
      hourValue,
    )
    const minute = digit('minute', 0, 59, 2, parts?.minute ?? null)

    const segments = [hour, literal(':'), minute]
    if (opts.seconds) {
      segments.push(
        literal(':'),
        digit('second', 0, 59, 2, parts?.second ?? null),
      )
    }
    if (is12Hour) {
      const dayPeriodValue = parts ? (parts.hour >= 12 ? 1 : 0) : null
      segments.push(literal(' '), digit('dayPeriod', 0, 1, 0, dayPeriodValue))
    }
    return segments
  }

  if (mode === 'date') return dateSegments()
  if (mode === 'time') return timeSegments()
  return [...dateSegments(), literal(' '), ...timeSegments()]
}

export interface TypeDigitResult {
  segment: Segment
  buffer: string
  advance: boolean
  /**
   * A digit that overflowed this segment's range and belongs to whatever the
   * caller moves focus to next. Set only when `buffer` was non-empty and the
   * new digit would have pushed the candidate value past `segment.max`.
   */
  carry?: number
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
export function typeDigit(
  segment: Segment,
  digitValue: number,
  buffer: string,
): TypeDigitResult {
  if (segment.type === 'literal' || segment.type === 'dayPeriod') {
    return { segment, buffer: '', advance: false }
  }

  const candidate = buffer === '' ? digitValue : Number(buffer + digitValue)

  if (candidate > segment.max) {
    if (buffer === '') {
      // Only reachable if a single digit alone exceeds `max`, which none of
      // this module's segments allow since every `max` is at least 9.
      return {
        segment: { ...segment, value: segment.max },
        buffer: '',
        advance: true,
      }
    }
    return {
      segment: { ...segment, value: Number(buffer) },
      buffer: '',
      advance: true,
      carry: digitValue,
    }
  }

  const newBuffer = buffer + digitValue
  const full = newBuffer.length >= segment.pad || candidate * 10 > segment.max
  return {
    segment: { ...segment, value: candidate },
    buffer: full ? '' : newBuffer,
    advance: full,
  }
}

/** `segment.value` moved by `delta`, wrapping at `min`/`max`. */
export function step(segment: Segment, delta: number): Segment {
  if (segment.type === 'literal') return segment
  if (segment.value === null) {
    return { ...segment, value: delta > 0 ? segment.min : segment.max }
  }
  const span = segment.max - segment.min + 1
  const wrapped =
    ((((segment.value - segment.min + delta) % span) + span) % span) +
    segment.min
  return { ...segment, value: wrapped }
}

/**
 * Sets a `dayPeriod` segment directly, for the `a`/`p` keys. No-op on any other
 * type.
 */
export function setDayPeriod(segment: Segment, period: 0 | 1): Segment {
  if (segment.type !== 'dayPeriod') return segment
  return { ...segment, value: period }
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
export function partsFromSegments(segments: Segment[]): DateParts | null {
  const byType = new Map<SegmentType, Segment>()
  for (const segment of segments) {
    if (segment.type === 'literal') continue
    if (segment.value === null) return null
    byType.set(segment.type, segment)
  }

  let hour = byType.get('hour')?.value ?? 0
  const dayPeriod = byType.get('dayPeriod')
  if (dayPeriod) {
    const isPM = dayPeriod.value === 1
    hour = hour === 12 ? (isPM ? 12 : 0) : isPM ? hour + 12 : hour
  }

  return {
    year: byType.get('year')?.value ?? 0,
    month: byType.get('month')?.value ?? 1,
    day: byType.get('day')?.value ?? 1,
    hour,
    minute: byType.get('minute')?.value ?? 0,
    second: byType.get('second')?.value ?? 0,
  }
}

/**
 * `parts.day`, pulled back to the last real day of `parts.month` if it
 * overflows.
 */
export function clampDayToMonth(parts: DateParts): DateParts {
  const max = daysInMonth(parts.year, parts.month)
  return parts.day > max ? { ...parts, day: max } : parts
}
