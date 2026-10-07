import { beforeEach, describe, expect, it } from 'vitest'

import {
  dateFormat,
  DATE_FORMAT_STORAGE_KEY,
} from '@lib/stores/dateFormat.svelte'
import { localeDefaults } from '@lib/components/DatePicker/prefs'

// This jsdom environment does not install a `localStorage` global on its own, so
// the store's SSR guard (`typeof localStorage === 'undefined'`) would otherwise
// take the same path a real server does. A minimal in-memory stand-in exercises
// the client path instead.
class MemoryStorage implements Storage {
  #data = new Map<string, string>()
  get length() {
    return this.#data.size
  }
  clear() {
    this.#data.clear()
  }
  getItem(key: string) {
    return this.#data.get(key) ?? null
  }
  key(index: number) {
    return [...this.#data.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.#data.delete(key)
  }
  setItem(key: string, value: string) {
    this.#data.set(key, value)
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
})

beforeEach(() => {
  localStorage.clear()
  dateFormat._resetForTests()
})

describe('dateFormat', () => {
  it('starts at the locale default and reports no override', () => {
    expect(dateFormat.isOverridden).toBe(false)
  })

  it('persists a change and marks itself overridden', () => {
    dateFormat.set({ dateOrder: 'YMD' })

    expect(dateFormat.prefs.dateOrder).toBe('YMD')
    expect(dateFormat.isOverridden).toBe(true)
    expect(localStorage.getItem(DATE_FORMAT_STORAGE_KEY)).toContain('YMD')
  })

  it('merges a partial change without disturbing the other fields', () => {
    dateFormat.set({ dateOrder: 'YMD', hourCycle: 24 })
    dateFormat.set({ dateOrder: 'DMY' })

    expect(dateFormat.prefs).toEqual({
      dateOrder: 'DMY',
      hourCycle: 24,
      separator: 'auto',
    })
  })

  it('merges a separator change without disturbing order or clock', () => {
    dateFormat.set({ dateOrder: 'YMD', hourCycle: 24 })
    dateFormat.set({ separator: '.' })

    expect(dateFormat.prefs).toEqual({
      dateOrder: 'YMD',
      hourCycle: 24,
      separator: '.',
    })
  })

  it('reset forgets the override and clears storage', () => {
    dateFormat.set({ dateOrder: 'YMD' })
    dateFormat.reset()

    expect(dateFormat.isOverridden).toBe(false)
    expect(localStorage.getItem(DATE_FORMAT_STORAGE_KEY)).toBeNull()
  })

  it('only stores the fields that are actually overridden', () => {
    dateFormat.set({ dateOrder: 'YMD', hourCycle: 24 })

    const stored = JSON.parse(localStorage.getItem(DATE_FORMAT_STORAGE_KEY)!)
    expect(stored).toEqual({ dateOrder: 'YMD', hourCycle: 24 })
  })

  it('init picks up a value a previous session stored', () => {
    localStorage.setItem(
      DATE_FORMAT_STORAGE_KEY,
      JSON.stringify({ dateOrder: 'YMD', hourCycle: 24 }),
    )

    dateFormat.init()

    expect(dateFormat.prefs).toEqual({
      dateOrder: 'YMD',
      hourCycle: 24,
      separator: 'auto',
    })
    expect(dateFormat.isOverridden).toBe(true)
  })

  it('init is a no-op on a second call', () => {
    dateFormat.init()
    dateFormat.set({ dateOrder: 'YMD' })

    localStorage.setItem(
      DATE_FORMAT_STORAGE_KEY,
      JSON.stringify({ dateOrder: 'DMY', hourCycle: 24 }),
    )
    dateFormat.init()

    // The second init must not re-read storage over the value set in between.
    expect(dateFormat.prefs.dateOrder).toBe('YMD')
  })

  it('a storage event from another tab updates the preference', () => {
    dateFormat.init()

    localStorage.setItem(
      DATE_FORMAT_STORAGE_KEY,
      JSON.stringify({ dateOrder: 'YMD', hourCycle: 24 }),
    )
    window.dispatchEvent(
      new StorageEvent('storage', { key: DATE_FORMAT_STORAGE_KEY }),
    )

    expect(dateFormat.prefs.dateOrder).toBe('YMD')
  })

  it('ignores a storage event for an unrelated key', () => {
    dateFormat.init()
    const before = dateFormat.prefs

    window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated' }))

    expect(dateFormat.prefs).toBe(before)
  })

  describe('isFieldOverridden', () => {
    it('is false for an untouched field', () => {
      expect(dateFormat.isFieldOverridden('dateOrder')).toBe(false)
    })

    it('is true once that field is set', () => {
      dateFormat.set({ dateOrder: 'YMD' })
      expect(dateFormat.isFieldOverridden('dateOrder')).toBe(true)
    })

    it('leaves an untouched field alone when a different one is set', () => {
      dateFormat.set({ dateOrder: 'YMD' })
      expect(dateFormat.isFieldOverridden('hourCycle')).toBe(false)
    })
  })

  describe('resetField', () => {
    it('forgets just the named field, keeping the others overridden', () => {
      dateFormat.set({ dateOrder: 'YMD', hourCycle: 24, separator: '.' })
      dateFormat.resetField('dateOrder')

      expect(dateFormat.isFieldOverridden('dateOrder')).toBe(false)
      expect(dateFormat.isFieldOverridden('hourCycle')).toBe(true)
      expect(dateFormat.isFieldOverridden('separator')).toBe(true)
      expect(dateFormat.prefs.hourCycle).toBe(24)
      expect(dateFormat.prefs.separator).toBe('.')
    })

    it('falls back to the locale default for the reset field', () => {
      dateFormat.set({ dateOrder: 'YMD' })
      dateFormat.resetField('dateOrder')

      expect(dateFormat.prefs.dateOrder).toBe(localeDefaults().dateOrder)
    })

    it('clears storage entirely once the last override is reset', () => {
      dateFormat.set({ dateOrder: 'YMD' })
      dateFormat.resetField('dateOrder')

      expect(dateFormat.isOverridden).toBe(false)
      expect(localStorage.getItem(DATE_FORMAT_STORAGE_KEY)).toBeNull()
    })

    it('is a no-op for a field that was never overridden', () => {
      dateFormat.set({ hourCycle: 24 })
      const before = dateFormat.prefs

      dateFormat.resetField('dateOrder')

      expect(dateFormat.prefs).toBe(before)
    })
  })
})
