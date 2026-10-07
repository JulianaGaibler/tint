import { describe, expect, it } from 'vitest'

import {
  firstInstantOfLocalDay,
  partsToValue,
  valueToParts,
} from '@lib/components/DatePicker/core'
import type { DateParts } from '@lib/components/DatePicker/format'

const DATE_PARTS: DateParts = {
  year: 2026,
  month: 10,
  day: 7,
  hour: 14,
  minute: 30,
  second: 5,
}

describe('valueToParts', () => {
  it('answers null for an empty value', () => {
    expect(valueToParts('date', 'iso', null)).toBeNull()
    expect(valueToParts('date', 'iso', undefined)).toBeNull()
    expect(valueToParts('date', 'iso', '')).toBeNull()
  })

  it('parses an iso date', () => {
    expect(valueToParts('date', 'iso', '2026-10-07')).toEqual({
      year: 2026,
      month: 10,
      day: 7,
      hour: 0,
      minute: 0,
      second: 0,
    })
  })

  it('parses an iso datetime without seconds', () => {
    expect(valueToParts('datetime', 'iso', '2026-10-07T14:30')).toEqual({
      year: 2026,
      month: 10,
      day: 7,
      hour: 14,
      minute: 30,
      second: 0,
    })
  })

  it('parses an iso datetime with seconds', () => {
    expect(valueToParts('datetime', 'iso', '2026-10-07T14:30:05')).toEqual(
      DATE_PARTS,
    )
  })

  it('parses an iso time', () => {
    expect(valueToParts('time', 'iso', '14:30:05')).toEqual({
      year: 0,
      month: 1,
      day: 1,
      hour: 14,
      minute: 30,
      second: 5,
    })
  })

  it('throws on a malformed iso value for the mode', () => {
    expect(() => valueToParts('date', 'iso', '10/07/2026')).toThrow('[tint]')
    expect(() => valueToParts('time', 'iso', 'not a time')).toThrow('[tint]')
  })

  it('reads a Date value by its local fields', () => {
    const date = new Date(2026, 9, 7, 14, 30, 5)
    expect(valueToParts('datetime', 'date', date)).toEqual(DATE_PARTS)
  })

  it('reads a timestamp value as an absolute instant', () => {
    const date = new Date(2026, 9, 7, 14, 30, 5)
    expect(valueToParts('datetime', 'timestamp', date.getTime())).toEqual(
      DATE_PARTS,
    )
  })

  it('reads a time-mode timestamp as milliseconds since local midnight', () => {
    const ms = ((14 * 60 + 30) * 60 + 5) * 1000
    expect(valueToParts('time', 'timestamp', ms)).toEqual({
      year: 0,
      month: 1,
      day: 1,
      hour: 14,
      minute: 30,
      second: 5,
    })
  })
})

describe('partsToValue', () => {
  it('formats an iso date', () => {
    expect(partsToValue('date', 'iso', DATE_PARTS)).toBe('2026-10-07')
  })

  it('formats an iso datetime without seconds by default', () => {
    expect(partsToValue('datetime', 'iso', DATE_PARTS)).toBe('2026-10-07T14:30')
  })

  it('formats an iso datetime with seconds when asked', () => {
    expect(partsToValue('datetime', 'iso', DATE_PARTS, { seconds: true })).toBe(
      '2026-10-07T14:30:05',
    )
  })

  it('formats an iso time', () => {
    expect(partsToValue('time', 'iso', DATE_PARTS)).toBe('14:30')
  })

  it('pads a single digit year to four digits', () => {
    expect(partsToValue('date', 'iso', { ...DATE_PARTS, year: 7 })).toBe(
      '0007-10-07',
    )
  })

  it('formats a date-mode Date at the first instant of that local day', () => {
    const value = partsToValue('date', 'date', DATE_PARTS) as Date
    expect(value.getFullYear()).toBe(2026)
    expect(value.getMonth()).toBe(9)
    expect(value.getDate()).toBe(7)
  })

  it('formats a datetime-mode Date carrying the time', () => {
    const value = partsToValue('datetime', 'date', DATE_PARTS) as Date
    expect(value.getHours()).toBe(14)
    expect(value.getMinutes()).toBe(30)
    expect(value.getSeconds()).toBe(5)
  })

  it("formats a time-mode Date onto today's date", () => {
    const value = partsToValue('time', 'date', DATE_PARTS) as Date
    const today = new Date()
    expect(value.getFullYear()).toBe(today.getFullYear())
    expect(value.getMonth()).toBe(today.getMonth())
    expect(value.getDate()).toBe(today.getDate())
    expect(value.getHours()).toBe(14)
    expect(value.getMinutes()).toBe(30)
  })

  it('formats a datetime-mode timestamp as an absolute instant', () => {
    const value = partsToValue('datetime', 'timestamp', DATE_PARTS) as number
    const expected = firstInstantOfLocalDay(2026, 10, 7)
    expected.setHours(14, 30, 5, 0)
    expect(value).toBe(expected.getTime())
  })

  it('formats a time-mode timestamp as milliseconds since local midnight', () => {
    const value = partsToValue('time', 'timestamp', DATE_PARTS) as number
    expect(value).toBe(((14 * 60 + 30) * 60 + 5) * 1000)
  })

  it('round trips every format and mode, with and without seconds', () => {
    const modes = ['date', 'datetime', 'time'] as const
    const formats = ['iso', 'date', 'timestamp'] as const
    for (const mode of modes) {
      for (const format of formats) {
        for (const seconds of [false, true]) {
          const value = partsToValue(mode, format, DATE_PARTS, { seconds })
          const parts = valueToParts(mode, format, value)
          expect(parts).not.toBeNull()
          // Mode components outside what that mode carries are not expected
          // to round trip, since the format does not represent them.
          if (mode !== 'time') {
            expect(parts!.year).toBe(DATE_PARTS.year)
            expect(parts!.month).toBe(DATE_PARTS.month)
            expect(parts!.day).toBe(DATE_PARTS.day)
          }
          if (mode !== 'date') {
            expect(parts!.hour).toBe(DATE_PARTS.hour)
            expect(parts!.minute).toBe(DATE_PARTS.minute)
            if (seconds || format !== 'iso') {
              expect(parts!.second).toBe(DATE_PARTS.second)
            }
          }
        }
      }
    }
  })
})

describe('firstInstantOfLocalDay', () => {
  it('lands on the requested calendar day', () => {
    const date = firstInstantOfLocalDay(2026, 10, 7)
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(9)
    expect(date.getDate()).toBe(7)
  })
})
