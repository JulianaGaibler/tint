// Value ⇆ DateParts round trip for each `format`, the DatePicker analogue of
// ColorPicker's `valueToColor` and `colorToValue` in `core.ts`.

import type {
  DateMode,
  DateParts,
  DateValueFor,
  DateValueFormat,
} from './format.js'

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const ISO_DATETIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
const ISO_TIME = /^(\d{2}):(\d{2})(?::(\d{2}))?$/

/**
 * The first instant of the local calendar day `year`-`month`-`day`.
 *
 * Not necessarily midnight. A day on which DST starts at midnight, as it did in
 * Brazil before 2019, has no 00:00: the clock goes straight from 23:59 to
 * 01:00. The day number is still correct for whatever instant the engine
 * resolves the wall clock fields to, so that instant, rather than an asserted
 * midnight, is what a `date` mode value means.
 */
export function firstInstantOfLocalDay(
  year: number,
  month: number,
  day: number,
): Date {
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

function partsFromDate(date: Date): DateParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
  }
}

/**
 * Parses a `value` of the given `format` into `DateParts`, or `null` when the
 * value represents no date at all.
 *
 * Throws on a string that does not match the ISO shape `mode` expects: that is
 * a caller passing a malformed value, not a user clearing the field, which
 * always comes through as `null` or `''`.
 */
export function valueToParts<F extends DateValueFormat>(
  mode: DateMode,
  format: F,
  value: DateValueFor<F> | null | undefined,
): DateParts | null {
  if (value == null || value === '') return null

  if (format === 'date') {
    return partsFromDate(value as Date)
  }

  if (format === 'timestamp') {
    const ms = value as number
    if (mode === 'time') {
      const totalSeconds = Math.floor(ms / 1000) % 86400
      return {
        year: 0,
        month: 1,
        day: 1,
        hour: Math.floor(totalSeconds / 3600),
        minute: Math.floor((totalSeconds % 3600) / 60),
        second: totalSeconds % 60,
      }
    }
    return partsFromDate(new Date(ms))
  }

  const iso = value as string
  if (mode === 'date') {
    const match = ISO_DATE.exec(iso)
    if (!match) throw new Error(`[tint] invalid iso date "${iso}"`)
    const [, year, month, day] = match
    return {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: 0,
      minute: 0,
      second: 0,
    }
  }
  if (mode === 'datetime') {
    const match = ISO_DATETIME.exec(iso)
    if (!match) throw new Error(`[tint] invalid iso datetime "${iso}"`)
    const [, year, month, day, hour, minute, second] = match
    return {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute),
      second: Number(second ?? 0),
    }
  }
  const match = ISO_TIME.exec(iso)
  if (!match) throw new Error(`[tint] invalid iso time "${iso}"`)
  const [, hour, minute, second] = match
  return {
    year: 0,
    month: 1,
    day: 1,
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second ?? 0),
  }
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0')
}

/**
 * Serializes `DateParts` into a `value` of the given `format`.
 *
 * `opts.seconds` controls whether an `'iso'` output carries a `:ss` segment. It
 * has no effect on `'date'` or `'timestamp'`, which always carry full
 * precision.
 */
export function partsToValue<F extends DateValueFormat>(
  mode: DateMode,
  format: F,
  parts: DateParts,
  opts: { seconds?: boolean } = {},
): DateValueFor<F> {
  if (format === 'date') {
    if (mode === 'time') {
      const now = new Date()
      now.setHours(parts.hour, parts.minute, parts.second, 0)
      return now as DateValueFor<F>
    }
    const date = firstInstantOfLocalDay(parts.year, parts.month, parts.day)
    if (mode === 'datetime')
      date.setHours(parts.hour, parts.minute, parts.second, 0)
    return date as DateValueFor<F>
  }

  if (format === 'timestamp') {
    if (mode === 'time') {
      const ms = ((parts.hour * 60 + parts.minute) * 60 + parts.second) * 1000
      return ms as DateValueFor<F>
    }
    const date = firstInstantOfLocalDay(parts.year, parts.month, parts.day)
    if (mode === 'datetime')
      date.setHours(parts.hour, parts.minute, parts.second, 0)
    return date.getTime() as DateValueFor<F>
  }

  const datePart = `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}`
  const timePart = opts.seconds
    ? `${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`
    : `${pad(parts.hour)}:${pad(parts.minute)}`

  if (mode === 'date') return datePart as DateValueFor<F>
  if (mode === 'time') return timePart as DateValueFor<F>
  return `${datePart}T${timePart}` as DateValueFor<F>
}
