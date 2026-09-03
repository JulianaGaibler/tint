// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  dismissTop,
  hasModalLayer,
  registerDismissLayer,
} from '@lib/dismiss/stack'
import { lockBodyScroll } from '@lib/dismiss/scroll-lock'

// Importing the module at all is most of the assertion: a top level `window` or `document` read
// would throw before any of these ran.
describe('on a server', () => {
  it('registers into nothing and hands back a release that works', () => {
    const release = registerDismissLayer({ dismiss: () => {} })
    expect(release).toBeTypeOf('function')
    expect(() => release()).not.toThrow()
  })

  it('answers as though nothing is open', () => {
    registerDismissLayer({ dismiss: () => {}, modal: true })
    expect(hasModalLayer()).toBe(false)
    expect(dismissTop()).toBe(false)
  })

  it('locks no scrolling', () => {
    expect(() => lockBodyScroll()()).not.toThrow()
  })
})
