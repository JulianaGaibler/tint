// The one preference every DatePicker on a page reads and writes, so that
// setting a date order or clock once applies everywhere.
//
// `prefs` lives in module scope rather than inside a component, which is what
// lets two unrelated DatePicker instances stay in sync without a shared
// ancestor. On the server that same module scope is shared across requests,
// which is safe here only because `init` and `set` both bail out when
// `localStorage` is unavailable: nothing ever mutates `prefs` outside a
// browser, so no request can see another request's write.

import {
  localeDefaults,
  parsePreferences,
  type DateFormatPreferences,
} from '../components/DatePicker/prefs.js'

export const DATE_FORMAT_STORAGE_KEY = 'tint:date-format'

type Field = keyof DateFormatPreferences

class DateFormatStore {
  /**
   * The resolved preference. Starts at the locale default on both server and
   * client so the first client render matches the server render exactly. `init`
   * layers the stored override on afterward, from an effect that runs after
   * hydration, so that layering is an ordinary update rather than a mismatch.
   */
  prefs = $state<DateFormatPreferences>(localeDefaults())

  /**
   * Which fields of `prefs` are a stored override rather than the locale's own
   * default, kept separately from `prefs` itself so a single field can be
   * forgotten without recomputing the other two from scratch. This is also
   * exactly what gets written to storage: only the fields a person actually
   * chose, not the full resolved object, so a locale change later still reaches
   * whichever fields were never touched.
   */
  #overrides = $state<Partial<DateFormatPreferences>>({})
  #initialized = false

  /** Test seam. Not exported from the package. */
  _resetForTests(): void {
    this.prefs = localeDefaults()
    this.#overrides = {}
    this.#initialized = false
  }

  get isOverridden(): boolean {
    return Object.keys(this.#overrides).length > 0
  }

  /** Whether a single field is a stored override rather than the locale default. */
  isFieldOverridden(field: Field): boolean {
    return field in this.#overrides
  }

  /**
   * Reads the stored override and starts listening for changes made in other
   * tabs. Safe to call from every mounted DatePicker: only the first call does
   * anything.
   */
  init(): void {
    if (this.#initialized || typeof localStorage === 'undefined') return
    this.#initialized = true

    this.#load()
    window.addEventListener('storage', (event) => {
      if (event.key === DATE_FORMAT_STORAGE_KEY) this.#load()
    })
  }

  #load(): void {
    this.#overrides = parsePreferences(
      localStorage.getItem(DATE_FORMAT_STORAGE_KEY),
    )
    this.prefs = { ...localeDefaults(), ...this.#overrides }
  }

  #persist(): void {
    if (typeof localStorage === 'undefined') return
    if (Object.keys(this.#overrides).length === 0) {
      localStorage.removeItem(DATE_FORMAT_STORAGE_KEY)
    } else {
      localStorage.setItem(
        DATE_FORMAT_STORAGE_KEY,
        JSON.stringify(this.#overrides),
      )
    }
  }

  set(partial: Partial<DateFormatPreferences>): void {
    this.#overrides = { ...this.#overrides, ...partial }
    this.prefs = { ...this.prefs, ...partial }
    this.#persist()
  }

  /**
   * Forgets one field's override, falling back to the locale default for it
   * alone.
   */
  resetField(field: Field): void {
    if (!(field in this.#overrides)) return
    const overrides = { ...this.#overrides }
    delete overrides[field]
    this.#overrides = overrides
    this.prefs = { ...localeDefaults(), ...overrides }
    this.#persist()
  }

  /**
   * Forgets every field's override, falling back to the locale default
   * throughout.
   */
  reset(): void {
    this.#overrides = {}
    this.prefs = localeDefaults()
    this.#persist()
  }
}

export const dateFormat = new DateFormatStore()
