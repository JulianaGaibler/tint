import { type SegmentLabels } from './SegmentInput.svelte';
import { type DateOrder } from './prefs.js';
import type { DateMode, DateValueFor, DateValueFormat } from './format.js';
declare function $$render<F extends DateValueFormat = 'iso'>(): {
    props: {
        /**
         * Bindable value. Type derived from `format`. `null` while the field is
         * empty.
         */
        value: DateValueFor<F> | null;
        /** Visible label above the field. */
        label: string;
        /** Which parts of a date to show and let the user set. Default 'date'. */
        mode?: DateMode;
        /** Output format. Default 'iso'. Controls value's TS type. */
        format?: F;
        /** Lower bound, in the same shape `value` takes. */
        min?: DateValueFor<F>;
        /** Upper bound, in the same shape `value` takes. */
        max?: DateValueFor<F>;
        /** Rejects individual dates, independent of `min`/`max`. */
        isDateDisabled?: (date: Date) => boolean;
        /** Show and accept seconds. Default false. */
        seconds?: boolean;
        /**
         * Spacing between the minutes (and seconds) the popover's time list offers.
         * Default 1, every minute. The field's own segments always accept any value
         * regardless of this, so a coarser step such as 15 only trims the list, not
         * what can be typed.
         */
        minuteStep?: number;
        /**
         * Locale used for month names, weekday order, and the date separator.
         * Defaults to the runtime's own locale. Does not affect the stored date
         * order or clock preference, which is shared site wide by design, see
         * `tint/stores`' `dateFormat`.
         */
        locale?: string;
        /** First day of the week, 0 for Sunday. Defaults to `locale`'s own. */
        weekStartsOn?: number;
        /**
         * Pins the day, month, year order, hiding the settings icon button. Omit to
         * follow the user's stored preference, or the locale default when they have
         * not set one.
         */
        dateOrder?: DateOrder;
        /** Pins the clock, hiding the settings icon button. */
        hourCycle?: 12 | 24;
        /** Overrides for the English segment names and AM/PM strings. */
        labels?: SegmentLabels;
        /** Helper text under the field. Mutually exclusive with `error`. */
        helperText?: string;
        /** Replace helperText with an error message and warning icon. */
        error?: string;
        disabled?: boolean;
        /** Fill parent width. Default true. */
        fillWidth?: boolean;
        id?: string;
        /** Name for native form serialization. Always serializes as iso. */
        name?: string;
        /** Bindable ref to the field's outer element. */
        element?: HTMLDivElement;
        /**
         * Fires on every settled change to `value`, including once at mount if the
         * incoming value needs normalizing, for instance seconds dropped because
         * `seconds` is false, or a value outside `min`/`max` clamped.
         */
        onchange?: (value: DateValueFor<F> | null) => void;
        /** External describing element id (ARIA). */
        'aria-describedby'?: string;
        class?: string;
    };
    exports: {};
    bindings: "element" | "value";
    slots: {};
    events: {};
};
declare class __sveltets_Render<F extends DateValueFormat = 'iso'> {
    props(): ReturnType<typeof $$render<F>>['props'];
    events(): ReturnType<typeof $$render<F>>['events'];
    slots(): ReturnType<typeof $$render<F>>['slots'];
    bindings(): "element" | "value";
    exports(): {};
}
interface $$IsomorphicComponent {
    new <F extends DateValueFormat = 'iso'>(options: import('svelte').ComponentConstructorOptions<ReturnType<__sveltets_Render<F>['props']>>): import('svelte').SvelteComponent<ReturnType<__sveltets_Render<F>['props']>, ReturnType<__sveltets_Render<F>['events']>, ReturnType<__sveltets_Render<F>['slots']>> & {
        $$bindings?: ReturnType<__sveltets_Render<F>['bindings']>;
    } & ReturnType<__sveltets_Render<F>['exports']>;
    <F extends DateValueFormat = 'iso'>(internal: unknown, props: ReturnType<__sveltets_Render<F>['props']> & {}): ReturnType<__sveltets_Render<F>['exports']>;
    z_$$bindings?: ReturnType<__sveltets_Render<any>['bindings']>;
}
declare const DatePicker: $$IsomorphicComponent;
type DatePicker<F extends DateValueFormat = 'iso'> = InstanceType<typeof DatePicker<F>>;
export default DatePicker;
