// The one preference every DatePicker on a page reads and writes, so that
// setting a date order or clock once applies everywhere.
//
// `prefs` lives in module scope rather than inside a component, which is what
// lets two unrelated DatePicker instances stay in sync without a shared
// ancestor. On the server that same module scope is shared across requests,
// which is safe here only because `init` and `set` both bail out when
// `localStorage` is unavailable: nothing ever mutates `prefs` outside a
// browser, so no request can see another request's write.
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _DateFormatStore_instances, _DateFormatStore_initialized, _DateFormatStore_load, _DateFormatStore_persist;
import { localeDefaults, parsePreferences, } from '../components/DatePicker/prefs.js';
export const DATE_FORMAT_STORAGE_KEY = 'tint:date-format';
class DateFormatStore {
    constructor() {
        _DateFormatStore_instances.add(this);
        /**
         * The resolved preference. Starts at the locale default on both server and
         * client so the first client render matches the server render exactly. `init`
         * layers the stored override on afterward, from an effect that runs after
         * hydration, so that layering is an ordinary update rather than a mismatch.
         */
        this.prefs = $state(localeDefaults());
        /**
         * Which fields of `prefs` are a stored override rather than the locale's own
         * default, kept separately from `prefs` itself so a single field can be
         * forgotten without recomputing the other two from scratch. This is also
         * exactly what gets written to storage: only the fields a person actually
         * chose, not the full resolved object, so a locale change later still reaches
         * whichever fields were never touched.
         */
        this.overrides = $state({});
        _DateFormatStore_initialized.set(this, false
        /** Test seam. Not exported from the package. */
        );
    }
    /** Test seam. Not exported from the package. */
    _resetForTests() {
        this.prefs = localeDefaults();
        this.overrides = {};
        __classPrivateFieldSet(this, _DateFormatStore_initialized, false, "f");
    }
    get isOverridden() {
        return Object.keys(this.overrides).length > 0;
    }
    /** Whether a single field is a stored override rather than the locale default. */
    isFieldOverridden(field) {
        return field in this.overrides;
    }
    /**
     * Reads the stored override and starts listening for changes made in other
     * tabs. Safe to call from every mounted DatePicker: only the first call does
     * anything.
     */
    init() {
        if (__classPrivateFieldGet(this, _DateFormatStore_initialized, "f") || typeof localStorage === 'undefined')
            return;
        __classPrivateFieldSet(this, _DateFormatStore_initialized, true, "f");
        __classPrivateFieldGet(this, _DateFormatStore_instances, "m", _DateFormatStore_load).call(this);
        window.addEventListener('storage', (event) => {
            if (event.key === DATE_FORMAT_STORAGE_KEY)
                __classPrivateFieldGet(this, _DateFormatStore_instances, "m", _DateFormatStore_load).call(this);
        });
    }
    set(partial) {
        this.overrides = Object.assign(Object.assign({}, this.overrides), partial);
        this.prefs = Object.assign(Object.assign({}, this.prefs), partial);
        __classPrivateFieldGet(this, _DateFormatStore_instances, "m", _DateFormatStore_persist).call(this);
    }
    /**
     * Forgets one field's override, falling back to the locale default for it
     * alone.
     */
    resetField(field) {
        if (!(field in this.overrides))
            return;
        const overrides = Object.assign({}, this.overrides);
        delete overrides[field];
        this.overrides = overrides;
        this.prefs = Object.assign(Object.assign({}, localeDefaults()), overrides);
        __classPrivateFieldGet(this, _DateFormatStore_instances, "m", _DateFormatStore_persist).call(this);
    }
    /**
     * Forgets every field's override, falling back to the locale default
     * throughout.
     */
    reset() {
        this.overrides = {};
        this.prefs = localeDefaults();
        __classPrivateFieldGet(this, _DateFormatStore_instances, "m", _DateFormatStore_persist).call(this);
    }
}
_DateFormatStore_initialized = new WeakMap(), _DateFormatStore_instances = new WeakSet(), _DateFormatStore_load = function _DateFormatStore_load() {
    this.overrides = parsePreferences(localStorage.getItem(DATE_FORMAT_STORAGE_KEY));
    this.prefs = Object.assign(Object.assign({}, localeDefaults()), this.overrides);
}, _DateFormatStore_persist = function _DateFormatStore_persist() {
    if (typeof localStorage === 'undefined')
        return;
    if (Object.keys(this.overrides).length === 0) {
        localStorage.removeItem(DATE_FORMAT_STORAGE_KEY);
    }
    else {
        localStorage.setItem(DATE_FORMAT_STORAGE_KEY, JSON.stringify(this.overrides));
    }
};
export const dateFormat = new DateFormatStore();
