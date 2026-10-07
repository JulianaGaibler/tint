import { describe, expect, it } from 'vitest'

import {
  addMonths,
  clampToRange,
  daysInMonth,
  isDisabled,
  monthGrid,
  sameDay,
  weekStartFromLocale,
} from '@lib/components/DatePicker/calendar'
import type { DateParts } from '@lib/components/DatePicker/format'

function parts(over: Partial<DateParts> = {}): DateParts {
  return {
    year: 2026,
    month: 10,
    day: 7,
    hour: 0,
    minute: 0,
    second: 0,
    ...over,
  }
}

describe('daysInMonth', () => {
  it('knows a 31 day month', () => {
    expect(daysInMonth(2026, 10)).toBe(31)
  })

  it('knows a 30 day month', () => {
    expect(daysInMonth(2026, 4)).toBe(30)
  })

  it('knows a leap February', () => {
    expect(daysInMonth(2028, 2)).toBe(29)
  })

  it('knows a non-leap February', () => {
    expect(daysInMonth(2026, 2)).toBe(28)
  })
})

describe('addMonths', () => {
  it('advances within a year', () => {
    expect(addMonths(2026, 10, 1)).toEqual({ year: 2026, month: 11 })
  })

  it('wraps forward into the next year', () => {
    expect(addMonths(2026, 12, 1)).toEqual({ year: 2027, month: 1 })
  })

  it('wraps backward into the previous year', () => {
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 })
  })

  it('wraps across several years at once', () => {
    expect(addMonths(2026, 6, 20)).toEqual({ year: 2028, month: 2 })
  })
})

describe('sameDay', () => {
  it('is true for the same calendar day regardless of time', () => {
    expect(sameDay(parts({ hour: 1 }), parts({ hour: 23 }))).toBe(true)
  })

  it('is false for a different day', () => {
    expect(sameDay(parts({ day: 7 }), parts({ day: 8 }))).toBe(false)
  })
})

describe('clampToRange', () => {
  it('passes a value already inside the range through unchanged', () => {
    const value = parts()
    expect(
      clampToRange(value, { min: parts({ day: 1 }), max: parts({ day: 31 }) }),
    ).toBe(value)
  })

  it('clamps up to min', () => {
    const min = parts({ day: 10 })
    expect(clampToRange(parts({ day: 1 }), { min })).toBe(min)
  })

  it('clamps down to max', () => {
    const max = parts({ day: 10 })
    expect(clampToRange(parts({ day: 20 }), { max })).toBe(max)
  })
})

describe('isDisabled', () => {
  it('is false with no constraints', () => {
    expect(isDisabled(parts(), {})).toBe(false)
  })

  it('is true before min', () => {
    expect(isDisabled(parts({ day: 1 }), { min: parts({ day: 10 }) })).toBe(
      true,
    )
  })

  it('is true after max', () => {
    expect(isDisabled(parts({ day: 20 }), { max: parts({ day: 10 }) })).toBe(
      true,
    )
  })

  it('defers to isDateDisabled inside the range', () => {
    const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6
    // 2026-10-10 is a Saturday.
    expect(isDisabled(parts({ day: 10 }), { isDateDisabled: isWeekend })).toBe(
      true,
    )
    // 2026-10-07 is a Wednesday.
    expect(isDisabled(parts({ day: 7 }), { isDateDisabled: isWeekend })).toBe(
      false,
    )
  })
})

describe('weekStartFromLocale', () => {
  it('reads Sunday first from en-US', () => {
    expect(weekStartFromLocale('en-US')).toBe(0)
  })

  it('reads Monday first from de-DE', () => {
    expect(weekStartFromLocale('de-DE')).toBe(1)
  })

  it('falls back to Monday when the engine reports no week info', () => {
    // `getWeekInfo` is missing from this project's lib target, the same gap
    // `calendar.ts` itself works around with a cast.
    type LocaleWithWeekInfo = {
      getWeekInfo: (() => { firstDay: number }) | undefined
    }
    const proto = Intl.Locale.prototype as unknown as LocaleWithWeekInfo
    const original = proto.getWeekInfo
    proto.getWeekInfo = undefined
    try {
      expect(weekStartFromLocale('en-US')).toBe(1)
    } finally {
      proto.getWeekInfo = original
    }
  })

  it('falls back to Monday for a malformed locale tag rather than throwing', () => {
    expect(weekStartFromLocale('not a locale')).toBe(1)
  })
})

describe('monthGrid', () => {
  it('builds full weeks of seven days covering the whole month', () => {
    const weeks = monthGrid(2026, 10, 1)
    for (const week of weeks) {
      expect(week).toHaveLength(7)
    }
    const flat = weeks.flat()
    const insideMonth = flat.filter((d) => !d.outside)
    expect(insideMonth).toHaveLength(31)
    expect(insideMonth[0]).toEqual({
      year: 2026,
      month: 10,
      day: 1,
      outside: false,
    })
    expect(insideMonth[30]).toEqual({
      year: 2026,
      month: 10,
      day: 31,
      outside: false,
    })
  })

  it('aligns the first row to the requested week start', () => {
    // 2026-10-01 is a Thursday (JS getDay() 4).
    const mondayFirst = monthGrid(2026, 10, 1)
    expect(mondayFirst[0][3]).toEqual({
      year: 2026,
      month: 10,
      day: 1,
      outside: false,
    })

    const sundayFirst = monthGrid(2026, 10, 0)
    expect(sundayFirst[0][4]).toEqual({
      year: 2026,
      month: 10,
      day: 1,
      outside: false,
    })
  })

  it('fills the leading and trailing cells from the adjacent months', () => {
    const weeks = monthGrid(2026, 10, 1)
    expect(weeks[0][0]).toEqual({
      year: 2026,
      month: 9,
      day: 28,
      outside: true,
    })
    const lastWeek = weeks[weeks.length - 1]
    expect(lastWeek[lastWeek.length - 1]).toEqual({
      year: 2026,
      month: 11,
      day: 1,
      outside: true,
    })
  })
})
