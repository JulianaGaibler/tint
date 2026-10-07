// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { dateFormat } from '@lib/stores/dateFormat.svelte'

// Importing the module at all is most of the assertion: a top level
// `localStorage` or `window` read would throw before any of these ran.
describe('on a server', () => {
  it('resolves to the locale default', () => {
    expect(dateFormat.prefs.dateOrder).toBeDefined()
    expect(dateFormat.isOverridden).toBe(false)
  })

  it('does nothing when told to init, set, or reset', () => {
    expect(() => dateFormat.init()).not.toThrow()
    expect(() => dateFormat.set({ dateOrder: 'YMD' })).not.toThrow()
    expect(() => dateFormat.reset()).not.toThrow()
  })
})
