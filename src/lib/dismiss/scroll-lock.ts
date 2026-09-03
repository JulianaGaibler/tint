/**
 * Refcounted `overflow: hidden` on the body.
 *
 * Separate from the dismissal stack because the two do not line up. A modal
 * that cannot be closed by the user locks scrolling and is not a dismissal
 * layer at all. Refcounted because the inner of two open modals closing must
 * not give the page its scrollbar back, and the previous value is restored
 * rather than cleared, so a host that had already set `overflow` keeps it.
 */

let locks = 0

let previous = ''

export function lockBodyScroll(): () => void {
  if (typeof document === 'undefined') return () => {}

  if (locks === 0) {
    previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  locks += 1

  let released = false
  return () => {
    if (released) return
    released = true
    locks -= 1
    if (locks === 0) document.body.style.overflow = previous
  }
}

/** Test seam. Not exported from the package. */
export function resetBodyScrollLock(): void {
  locks = 0
  previous = ''
}
