import { type SegmentLabels } from './SegmentInput.svelte';
import { type DateOrder } from './prefs.js';
import type { DateRangeValue, DateValueFor, DateValueFormat } from './format.js';
declare function $$render<F extends DateValueFormat = 'iso'>(): {
    props: {
        /** Bindable value. `start`/`end` are each `null` while that end is empty. */
        value: DateRangeValue<F>;
        /** Visible label above the field. */
        label: string;
        /** Output format. Default 'iso'. Controls `value`'s TS type. */
        format?: F;
        min?: DateValueFor<F>;
        max?: DateValueFor<F>;
        isDateDisabled?: (date: Date) => boolean;
        locale?: string;
        weekStartsOn?: number;
        dateOrder?: DateOrder;
        labels?: SegmentLabels;
        helperText?: string;
        error?: string;
        disabled?: boolean;
        fillWidth?: boolean;
        id?: string;
        /** Name prefix for native form serialization: `${name}-start`/`${name}-end`. */
        name?: string;
        element?: HTMLDivElement;
        onchange?: (value: DateRangeValue<F>) => void;
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
declare const DateRangePicker: $$IsomorphicComponent;
type DateRangePicker<F extends DateValueFormat = 'iso'> = InstanceType<typeof DateRangePicker<F>>;
export default DateRangePicker;
