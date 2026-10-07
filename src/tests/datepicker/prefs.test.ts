import { describe, expect, it } from 'vitest'

import {
  localeDefaults,
  localeSeparator,
  parsePreferences,
  resolveSeparator,
} from '@lib/components/DatePicker/prefs'

describe('localeDefaults', () => {
  it('reads MDY and a 12 hour clock from en-US', () => {
    expect(localeDefaults('en-US')).toEqual({
      dateOrder: 'MDY',
      hourCycle: 12,
      separator: 'auto',
    })
  })

  it('reads DMY and a 24 hour clock from de-DE', () => {
    expect(localeDefaults('de-DE')).toEqual({
      dateOrder: 'DMY',
      hourCycle: 24,
      separator: 'auto',
    })
  })

  it('reads YMD and a 24 hour clock from ja-JP', () => {
    expect(localeDefaults('ja-JP')).toEqual({
      dateOrder: 'YMD',
      hourCycle: 24,
      separator: 'auto',
    })
  })
})

describe('localeSeparator', () => {
  it('answers a dot for de-DE', () => {
    expect(localeSeparator('de-DE', 'DMY')).toBe('.')
  })

  it('answers a slash for en-US', () => {
    expect(localeSeparator('en-US', 'MDY')).toBe('/')
  })

  it('follows the locale separator even when the order is overridden', () => {
    // A German reader who picks MDY still expects dots, not the American slash.
    expect(localeSeparator('de-DE', 'MDY')).toBe('.')
  })

  it('always answers a dash for YMD', () => {
    expect(localeSeparator('en-US', 'YMD')).toBe('-')
    expect(localeSeparator('de-DE', 'YMD')).toBe('-')
  })
})

describe('resolveSeparator', () => {
  it('defers to the locale under auto', () => {
    expect(resolveSeparator('de-DE', 'DMY', 'auto')).toBe('.')
    expect(resolveSeparator('en-US', 'YMD', 'auto')).toBe('-')
  })

  it('an explicit choice wins over the locale', () => {
    expect(resolveSeparator('en-US', 'MDY', '.')).toBe('.')
    expect(resolveSeparator('de-DE', 'DMY', '/')).toBe('/')
  })

  it('an explicit choice applies even under YMD, unlike auto', () => {
    expect(resolveSeparator('en-US', 'YMD', '.')).toBe('.')
  })
})

describe('parsePreferences', () => {
  it('parses a complete stored value', () => {
    expect(
      parsePreferences('{"dateOrder":"DMY","hourCycle":24,"separator":"."}'),
    ).toEqual({
      dateOrder: 'DMY',
      hourCycle: 24,
      separator: '.',
    })
  })

  it('accepts each valid separator value', () => {
    for (const sep of ['auto', '/', '-', '.']) {
      expect(parsePreferences(`{"separator":"${sep}"}`)).toEqual({
        separator: sep,
      })
    }
  })

  it('drops an unrecognized separator rather than keeping it', () => {
    expect(parsePreferences('{"separator":"_"}')).toEqual({})
  })

  it('keeps only the valid field of a partially invalid value', () => {
    expect(parsePreferences('{"dateOrder":"DMY","hourCycle":25}')).toEqual({
      dateOrder: 'DMY',
    })
  })

  it('answers an empty object for malformed JSON', () => {
    expect(parsePreferences('not json')).toEqual({})
  })

  it('answers an empty object for null input', () => {
    expect(parsePreferences(null)).toEqual({})
  })

  it('answers an empty object for a JSON value that is not an object', () => {
    expect(parsePreferences('"DMY"')).toEqual({})
    expect(parsePreferences('42')).toEqual({})
  })
})
