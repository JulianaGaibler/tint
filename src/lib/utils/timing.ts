// Tiny debounce / throttle without lodash-es. lodash-es pulls in `_root.js`
// which uses `new Function('return this')()` to find the global object, and
// that trips AMO's `DANGEROUS_EVAL` warning in consuming extensions. These
// implementations cover only the call shapes tint uses internally.

export interface Cancelable {
  cancel(): void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any

export function debounce<T extends AnyFn>(fn: T, wait: number): T & Cancelable {
  let timer: ReturnType<typeof setTimeout> | undefined
  const debounced = ((...args: Parameters<T>) => {
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      fn(...args)
    }, wait)
  }) as T & Cancelable
  debounced.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }
  return debounced
}

export function throttle<T extends AnyFn>(fn: T, wait: number): T & Cancelable {
  let lastInvoke = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let trailingArgs: Parameters<T> | undefined

  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now()
    const remaining = wait - (now - lastInvoke)
    if (remaining <= 0) {
      if (timer !== undefined) {
        clearTimeout(timer)
        timer = undefined
      }
      lastInvoke = now
      trailingArgs = undefined
      fn(...args)
      return
    }
    trailingArgs = args
    if (timer === undefined) {
      timer = setTimeout(() => {
        timer = undefined
        lastInvoke = Date.now()
        const a = trailingArgs
        trailingArgs = undefined
        if (a) fn(...a)
      }, remaining)
    }
  }) as T & Cancelable
  throttled.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    trailingArgs = undefined
    lastInvoke = 0
  }
  return throttled
}
