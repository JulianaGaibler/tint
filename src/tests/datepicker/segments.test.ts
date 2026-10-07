import { describe, expect, it } from 'vitest'

import {
  buildSegments,
  clampDayToMonth,
  partsFromSegments,
  setDayPeriod,
  step,
  typeDigit,
  type Segment,
} from '@lib/components/DatePicker/segments'
import type { DateParts } from '@lib/components/DatePicker/format'

const PREFS_24 = {
  dateOrder: 'DMY' as const,
  hourCycle: 24 as const,
  separator: 'auto' as const,
}
const PREFS_12 = {
  dateOrder: 'DMY' as const,
  hourCycle: 12 as const,
  separator: 'auto' as const,
}

function parts(over: Partial<DateParts> = {}): DateParts {
  return {
    year: 2026,
    month: 10,
    day: 7,
    hour: 14,
    minute: 30,
    second: 5,
    ...over,
  }
}

function digitSegment(over: Partial<Segment> = {}): Segment {
  return { type: 'day', value: null, min: 1, max: 31, pad: 2, ...over }
}

describe('buildSegments', () => {
  it('orders date segments by dateOrder, with the separator between them', () => {
    const dmy = buildSegments('date', PREFS_24, '.', null)
    expect(dmy.map((s) => s.type)).toEqual([
      'day',
      'literal',
      'month',
      'literal',
      'year',
    ])
    expect(dmy.filter((s) => s.type === 'literal').map((s) => s.text)).toEqual([
      '.',
      '.',
    ])

    const mdy = buildSegments(
      'date',
      { ...PREFS_24, dateOrder: 'MDY' },
      '/',
      null,
    )
    expect(mdy.map((s) => s.type)).toEqual([
      'month',
      'literal',
      'day',
      'literal',
      'year',
    ])

    const ymd = buildSegments(
      'date',
      { ...PREFS_24, dateOrder: 'YMD' },
      '-',
      null,
    )
    expect(ymd.map((s) => s.type)).toEqual([
      'year',
      'literal',
      'month',
      'literal',
      'day',
    ])
  })

  it('seeds segment values from parts, and leaves them null without parts', () => {
    const empty = buildSegments('date', PREFS_24, '.', null)
    expect(empty.find((s) => s.type === 'day')?.value).toBeNull()

    const seeded = buildSegments('date', PREFS_24, '.', parts())
    expect(seeded.find((s) => s.type === 'day')?.value).toBe(7)
    expect(seeded.find((s) => s.type === 'month')?.value).toBe(10)
    expect(seeded.find((s) => s.type === 'year')?.value).toBe(2026)
  })

  it("bounds the day segment by the seeded month's real length", () => {
    const february = buildSegments(
      'date',
      PREFS_24,
      '.',
      parts({ month: 2, day: 28 }),
    )
    expect(february.find((s) => s.type === 'day')?.max).toBe(28)

    const withoutParts = buildSegments('date', PREFS_24, '.', null)
    expect(withoutParts.find((s) => s.type === 'day')?.max).toBe(31)
  })

  it('adds a dayPeriod segment and converts the hour to 12 hour display only under hourCycle 12', () => {
    const clock24 = buildSegments('time', PREFS_24, '.', parts({ hour: 14 }))
    expect(clock24.some((s) => s.type === 'dayPeriod')).toBe(false)
    expect(clock24.find((s) => s.type === 'hour')?.value).toBe(14)

    const clock12 = buildSegments('time', PREFS_12, '.', parts({ hour: 14 }))
    expect(clock12.find((s) => s.type === 'hour')?.value).toBe(2)
    expect(clock12.find((s) => s.type === 'dayPeriod')?.value).toBe(1)
  })

  it('represents midnight and noon correctly under hourCycle 12', () => {
    const midnight = buildSegments('time', PREFS_12, '.', parts({ hour: 0 }))
    expect(midnight.find((s) => s.type === 'hour')?.value).toBe(12)
    expect(midnight.find((s) => s.type === 'dayPeriod')?.value).toBe(0)

    const noon = buildSegments('time', PREFS_12, '.', parts({ hour: 12 }))
    expect(noon.find((s) => s.type === 'hour')?.value).toBe(12)
    expect(noon.find((s) => s.type === 'dayPeriod')?.value).toBe(1)
  })

  it('adds a seconds segment only when asked', () => {
    const withoutSeconds = buildSegments('time', PREFS_24, '.', null)
    expect(withoutSeconds.some((s) => s.type === 'second')).toBe(false)

    const withSeconds = buildSegments('time', PREFS_24, '.', null, {
      seconds: true,
    })
    expect(withSeconds.some((s) => s.type === 'second')).toBe(true)
  })

  it('joins date and time segments with a space for datetime mode', () => {
    const segments = buildSegments('datetime', PREFS_24, '.', null)
    expect(segments.map((s) => s.type)).toEqual([
      'day',
      'literal',
      'month',
      'literal',
      'year',
      'literal',
      'hour',
      'literal',
      'minute',
    ])
  })
})

describe('typeDigit', () => {
  it('commits a day on the first digit when no second digit could stay in range', () => {
    const result = typeDigit(digitSegment(), 9, '')
    expect(result).toEqual({
      segment: digitSegment({ value: 9 }),
      buffer: '',
      advance: true,
    })
  })

  it('waits for a second digit when one could still fit', () => {
    const first = typeDigit(digitSegment(), 3, '')
    expect(first).toEqual({
      segment: digitSegment({ value: 3 }),
      buffer: '3',
      advance: false,
    })

    const second = typeDigit(first.segment, 1, first.buffer)
    expect(second).toEqual({
      segment: digitSegment({ value: 31 }),
      buffer: '',
      advance: true,
    })
  })

  it('commits the buffered value and carries an overflowing digit forward', () => {
    const first = typeDigit(digitSegment(), 3, '')
    const overflow = typeDigit(first.segment, 5, first.buffer)
    expect(overflow).toEqual({
      segment: digitSegment({ value: 3 }),
      buffer: '',
      advance: true,
      carry: 5,
    })
  })

  it('commits a four digit year only once all four digits are in', () => {
    let segment = digitSegment({ type: 'year', min: 1, max: 9999, pad: 4 })
    let buffer = ''
    for (const [i, d] of [2, 0, 2, 6].entries()) {
      const result = typeDigit(segment, d, buffer)
      segment = result.segment
      buffer = result.buffer
      expect(result.advance).toBe(i === 3)
    }
    expect(segment.value).toBe(2026)
  })

  it('is a no-op on a literal or dayPeriod segment', () => {
    const literal: Segment = {
      type: 'literal',
      text: '.',
      value: null,
      min: 0,
      max: 0,
      pad: 0,
    }
    expect(typeDigit(literal, 5, '')).toEqual({
      segment: literal,
      buffer: '',
      advance: false,
    })

    const dayPeriod: Segment = {
      type: 'dayPeriod',
      value: 0,
      min: 0,
      max: 1,
      pad: 0,
    }
    expect(typeDigit(dayPeriod, 5, '')).toEqual({
      segment: dayPeriod,
      buffer: '',
      advance: false,
    })
  })
})

describe('step', () => {
  it('starts from min on the first press up, and max on the first press down', () => {
    expect(step(digitSegment(), 1).value).toBe(1)
    expect(step(digitSegment(), -1).value).toBe(31)
  })

  it('wraps forward past max back to min', () => {
    expect(step(digitSegment({ value: 31 }), 1).value).toBe(1)
  })

  it('wraps backward past min back to max', () => {
    expect(step(digitSegment({ value: 1 }), -1).value).toBe(31)
  })

  it('steps by an arbitrary delta, for the Shift modifier', () => {
    expect(step(digitSegment({ value: 5 }), 10).value).toBe(15)
  })

  it('leaves a literal segment unchanged', () => {
    const literal: Segment = {
      type: 'literal',
      text: '.',
      value: null,
      min: 0,
      max: 0,
      pad: 0,
    }
    expect(step(literal, 1)).toBe(literal)
  })
})

describe('setDayPeriod', () => {
  it('sets a dayPeriod segment directly', () => {
    const segment: Segment = {
      type: 'dayPeriod',
      value: 0,
      min: 0,
      max: 1,
      pad: 0,
    }
    expect(setDayPeriod(segment, 1).value).toBe(1)
  })

  it('is a no-op on any other segment type', () => {
    const segment = digitSegment({ value: 5 })
    expect(setDayPeriod(segment, 1)).toBe(segment)
  })
})

describe('partsFromSegments', () => {
  it('reconstructs full parts once every editable segment has a value', () => {
    const segments = buildSegments('datetime', PREFS_24, '.', parts())
    expect(partsFromSegments(segments)).toEqual(parts({ second: 0 }))
  })

  it('answers null while any editable segment is still empty', () => {
    const segments = buildSegments('date', PREFS_24, '.', null)
    expect(partsFromSegments(segments)).toBeNull()
  })

  it('combines a 12 hour hour with its dayPeriod into the 24 hour value', () => {
    const afternoon = buildSegments('time', PREFS_12, '.', parts({ hour: 14 }))
    expect(partsFromSegments(afternoon)?.hour).toBe(14)

    const midnight = buildSegments('time', PREFS_12, '.', parts({ hour: 0 }))
    expect(partsFromSegments(midnight)?.hour).toBe(0)

    const noon = buildSegments('time', PREFS_12, '.', parts({ hour: 12 }))
    expect(partsFromSegments(noon)?.hour).toBe(12)
  })

  it('fills placeholder date components for a time-only field', () => {
    const segments = buildSegments('time', PREFS_24, '.', parts())
    expect(partsFromSegments(segments)).toEqual(
      expect.objectContaining({ year: 0, month: 1, day: 1 }),
    )
  })
})

describe('clampDayToMonth', () => {
  it('pulls an overflowing day back to the real end of the month', () => {
    expect(clampDayToMonth(parts({ month: 2, day: 31 })).day).toBe(28)
  })

  it('leaves a day that still fits unchanged', () => {
    const value = parts({ month: 2, day: 28 })
    expect(clampDayToMonth(value)).toBe(value)
  })

  it('keeps February 29 on a leap year', () => {
    expect(clampDayToMonth(parts({ year: 2028, month: 2, day: 29 })).day).toBe(
      29,
    )
  })

  it('clamps February 29 down when the year moves off a leap year', () => {
    expect(clampDayToMonth(parts({ year: 2026, month: 2, day: 29 })).day).toBe(
      28,
    )
  })
})
