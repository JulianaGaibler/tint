// Month grid generation, range clamping, and the disabled-date predicate used
// by Calendar.svelte and by segments.ts' month-length clamp. Kept pure (no
// Svelte, no DOM), the same contract palette.ts states for ColorPicker.

import { firstInstantOfLocalDay } from './core.js'
import type { DateParts } from './format.js'

/** One cell in a month grid. */
export interface CalendarDay {
  year: number
  month: number
  day: number
  /** True for a day that belongs to the adjacent month, shown to fill the grid. */
  outside: boolean
}

export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one. The local calendar
  // arithmetic that resolves is immune to the DST-at-midnight gap, since the
  // field being read is the date, not the hour.
  return new Date(year, month, 0).getDate()
}

/** `month` shifted by `delta`, wrapping the year. */
export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  // Pinned to UTC noon so the month arithmetic itself never crosses a DST
  // boundary. Noon is far enough from midnight that no real-world DST shift
  // reaches it.
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1, 12))
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1 }
}

export function sameDay(
  a: Pick<DateParts, 'year' | 'month' | 'day'>,
  b: Pick<DateParts, 'year' | 'month' | 'day'>,
): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day
}

/**
 * An order-preserving number for the wall clock fields, for comparing two
 * `DateParts` without constructing a real, timezone-bound `Date`.
 */
function comparableKey(parts: DateParts): number {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
}

export interface DateRangeOptions {
  min?: DateParts
  max?: DateParts
}

/** `parts`, moved onto `min` or `max` when it falls outside that range. */
export function clampToRange(
  parts: DateParts,
  { min, max }: DateRangeOptions,
): DateParts {
  const key = comparableKey(parts)
  if (min && key < comparableKey(min)) return min
  if (max && key > comparableKey(max)) return max
  return parts
}

export interface DateDisabledOptions extends DateRangeOptions {
  isDateDisabled?: (date: Date) => boolean
}

/** Whether `parts` falls outside `min`/`max` or is rejected by `isDateDisabled`. */
export function isDisabled(
  parts: DateParts,
  { min, max, isDateDisabled }: DateDisabledOptions,
): boolean {
  const key = comparableKey(parts)
  if (min && key < comparableKey(min)) return true
  if (max && key > comparableKey(max)) return true
  if (isDateDisabled) {
    return isDateDisabled(
      firstInstantOfLocalDay(parts.year, parts.month, parts.day),
    )
  }
  return false
}

interface LocaleWithWeekInfo {
  getWeekInfo?: () => { firstDay: number }
}

/**
 * The first day of the week for `locale`, as a JS `Date#getDay()` index (0 for
 * Sunday).
 *
 * `Intl.Locale#getWeekInfo` reports it Unicode style, 1 for Monday through 7
 * for Sunday, which `% 7` converts: Monday through Saturday map to themselves,
 * and Sunday's 7 maps to 0. The method is missing on some engines, and some
 * engines throw on a locale string they do not recognize, so either falls back
 * to Monday rather than guessing.
 *
 * `Intl.Locale`, unlike `Intl.DateTimeFormat`, has no notion of "the runtime's
 * own locale" and requires an explicit tag. Resolving through
 * `Intl.DateTimeFormat` first is what lets `locale` stay optional here too.
 */
export function weekStartFromLocale(locale?: string): number {
  try {
    const resolved = new Intl.DateTimeFormat(locale).resolvedOptions().locale
    const info = (
      new Intl.Locale(resolved) as unknown as LocaleWithWeekInfo
    ).getWeekInfo?.()
    if (info) return info.firstDay % 7
  } catch {
    // Unrecognized locale string. Fall through to the default below.
  }
  return 1
}

/**
 * The 6×7 grid a month view displays, including the leading and trailing days
 * of the adjacent months that fill the first and last week.
 */
export function monthGrid(
  year: number,
  month: number,
  weekStartsOn: number,
): CalendarDay[][] {
  const firstOfMonth = new Date(year, month - 1, 1)
  const leading = (firstOfMonth.getDay() - weekStartsOn + 7) % 7
  const totalCells = Math.ceil((leading + daysInMonth(year, month)) / 7) * 7

  const days: CalendarDay[] = []
  for (let i = 0; i < totalCells; i++) {
    const date = new Date(year, month - 1, 1 - leading + i)
    days.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      outside: date.getMonth() + 1 !== month || date.getFullYear() !== year,
    })
  }

  const weeks: CalendarDay[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  return weeks
}
