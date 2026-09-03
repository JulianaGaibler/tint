import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  dismissTop,
  hasModalLayer,
  isTopDismissLayer,
  registerDismissLayer,
  resetDismissStack,
  type DismissLayer,
} from '@lib/dismiss/stack'
import { lockBodyScroll, resetBodyScrollLock } from '@lib/dismiss/scroll-lock'

/**
 * A real event, because the whole contract is about what the browser does with
 * one.
 */
function escape(over: Partial<KeyboardEventInit> = {}) {
  return new KeyboardEvent('keydown', {
    key: 'Escape',
    bubbles: true,
    cancelable: true,
    ...over,
  })
}

function layer(over: Partial<DismissLayer> = {}): DismissLayer & {
  dismiss: ReturnType<typeof vi.fn>
} {
  return { dismiss: vi.fn(), ...over } as DismissLayer & {
    dismiss: ReturnType<typeof vi.fn>
  }
}

beforeEach(() => {
  resetDismissStack()
  resetBodyScrollLock()
  document.body.style.removeProperty('overflow')
})

describe('the dismissal stack', () => {
  it('dismisses the top layer and nothing under it', () => {
    const under = layer()
    const over = layer()
    registerDismissLayer(under)
    registerDismissLayer(over)

    window.dispatchEvent(escape())

    expect(over.dismiss).toHaveBeenCalledTimes(1)
    expect(under.dismiss).not.toHaveBeenCalled()
  })

  it('stands down when a handler nearer the event took the key', () => {
    const only = layer()
    registerDismissLayer(only)

    const field = document.createElement('div')
    document.body.append(field)
    field.addEventListener('keydown', (event) => event.preventDefault())

    field.dispatchEvent(escape())

    expect(only.dismiss).not.toHaveBeenCalled()
    field.remove()
  })

  it('cancels the key only when it acts', () => {
    const unclaimed = escape()
    window.dispatchEvent(unclaimed)
    // A host with its own Escape handling reads this to decide whether the key is still going.
    expect(unclaimed.defaultPrevented).toBe(false)

    registerDismissLayer(layer())
    const claimed = escape()
    window.dispatchEvent(claimed)
    expect(claimed.defaultPrevented).toBe(true)
  })

  it('releases a layer from under another one', () => {
    const a = layer()
    const b = layer()
    const c = layer()
    registerDismissLayer(a)
    const releaseB = registerDismissLayer(b)
    const releaseC = registerDismissLayer(c)

    releaseB()

    window.dispatchEvent(escape())
    expect(c.dismiss).toHaveBeenCalledTimes(1)

    // Dismissing does not unregister. A layer leaves the stack when its own teardown runs, which
    // is what keeps a second press on a layer that has not finished closing from falling through
    // to whatever is behind it.
    releaseC()

    window.dispatchEvent(escape())
    expect(a.dismiss).toHaveBeenCalledTimes(1)
    expect(b.dismiss).not.toHaveBeenCalled()
  })

  it('releases once however often it is called', () => {
    const under = layer()
    const over = layer()
    registerDismissLayer(under)
    const release = registerDismissLayer(over)

    release()
    release()

    window.dispatchEvent(escape())
    expect(under.dismiss).toHaveBeenCalledTimes(1)
  })

  it('dismisses the same layer again on a second press', () => {
    // Svelte has not flushed the first close yet, so the layer is still registered. A `dismiss`
    // that cannot take this is a `dismiss` that breaks on a held key.
    const only = layer()
    registerDismissLayer(only)

    window.dispatchEvent(escape())
    window.dispatchEvent(escape())

    expect(only.dismiss).toHaveBeenCalledTimes(2)
  })

  it('ignores a key that is not Escape', () => {
    const only = layer()
    registerDismissLayer(only)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))

    expect(only.dismiss).not.toHaveBeenCalled()
  })

  it('ignores Escape that is ending a composition', () => {
    const only = layer()
    registerDismissLayer(only)

    window.dispatchEvent(escape({ isComposing: true }))

    expect(only.dismiss).not.toHaveBeenCalled()
  })

  it('does nothing once every layer has gone', () => {
    const release = registerDismissLayer(layer())
    release()

    const event = escape()
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
  })

  it('reports a modal under a menu that is not one', () => {
    registerDismissLayer(layer({ modal: true }))
    registerDismissLayer(layer({ modal: false }))

    expect(hasModalLayer()).toBe(true)
  })

  it('reports no modal when nothing modal is open', () => {
    registerDismissLayer(layer({ modal: false }))

    expect(hasModalLayer()).toBe(false)
  })

  it('answers which layer Escape would reach', () => {
    const under = layer()
    const over = layer()
    registerDismissLayer(under)
    registerDismissLayer(over)

    expect(isTopDismissLayer(over)).toBe(true)
    expect(isTopDismissLayer(under)).toBe(false)
  })

  it('says whether dismissTop found anything', () => {
    expect(dismissTop()).toBe(false)

    const only = layer()
    registerDismissLayer(only)
    expect(dismissTop()).toBe(true)
    expect(only.dismiss).toHaveBeenCalledTimes(1)
  })
})

describe('the body scroll lock', () => {
  it('gives back the value it found rather than clearing it', () => {
    document.body.style.overflow = 'scroll'

    const outer = lockBodyScroll()
    const inner = lockBodyScroll()
    expect(document.body.style.overflow).toBe('hidden')

    inner()
    // The outer modal is still open, so the page must not get its scrollbar back yet.
    expect(document.body.style.overflow).toBe('hidden')

    outer()
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('releases once however often it is called', () => {
    const outer = lockBodyScroll()
    const inner = lockBodyScroll()

    inner()
    inner()
    expect(document.body.style.overflow).toBe('hidden')

    outer()
    expect(document.body.style.overflow).toBe('')
  })
})
