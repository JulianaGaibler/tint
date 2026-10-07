import { type DateFormatPreferences } from '../components/DatePicker/prefs.js';
export declare const DATE_FORMAT_STORAGE_KEY = "tint:date-format";
type Field = keyof DateFormatPreferences;
declare class DateFormatStore {
    #private;
    /**
     * The resolved preference. Starts at the locale default on both server and
     * client so the first client render matches the server render exactly. `init`
     * layers the stored override on afterward, from an effect that runs after
     * hydration, so that layering is an ordinary update rather than a mismatch.
     */
    prefs: DateFormatPreferences;
    /**
     * Which fields of `prefs` are a stored override rather than the locale's own
     * default, kept separately from `prefs` itself so a single field can be
     * forgotten without recomputing the other two from scratch. This is also
     * exactly what gets written to storage: only the fields a person actually
     * chose, not the full resolved object, so a locale change later still reaches
     * whichever fields were never touched.
     */
    private overrides;
    /** Test seam. Not exported from the package. */
    _resetForTests(): void;
    get isOverridden(): boolean;
    /** Whether a single field is a stored override rather than the locale default. */
    isFieldOverridden(field: Field): boolean;
    /**
     * Reads the stored override and starts listening for changes made in other
     * tabs. Safe to call from every mounted DatePicker: only the first call does
     * anything.
     */
    init(): void;
    set(partial: Partial<DateFormatPreferences>): void;
    /**
     * Forgets one field's override, falling back to the locale default for it
     * alone.
     */
    resetField(field: Field): void;
    /**
     * Forgets every field's override, falling back to the locale default
     * throughout.
     */
    reset(): void;
}
export declare const dateFormat: DateFormatStore;
export {};
