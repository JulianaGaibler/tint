import type { Snippet } from 'svelte';
import type { ColorFormat, ContrastOptions, ValueFor, WideGamutMode } from './format';
import type { Color } from '../../color';
declare function $$render<F extends ColorFormat = 'hex'>(): {
    props: {
        /** Bindable value. Type derived from `format`. */
        value: ValueFor<F>;
        /** Visible label above the input. */
        label: string;
        /** Output format. Default 'hex'. Controls value's TS type. */
        format?: F;
        /** Show alpha slider in the popover. Default false. */
        alpha?: boolean;
        /** Optional contrast check shown in the popover. */
        contrast?: ContrastOptions;
        /**
         * Surface a warning when the picked color is outside the output gamut.
         * Default true.
         */
        gamutWarning?: boolean;
        /**
         * How to render the picker canvas. 'auto' picks based on the display.
         * Default 'auto'.
         */
        wideGamut?: WideGamutMode;
        /** Helper text under the input. Mutually exclusive with `error`. */
        helperText?: string;
        /** Replace helperText with an error message + warning icon. */
        error?: string;
        /** Disable the input. */
        disabled?: boolean;
        /** Fill parent width. Default true. */
        fillWidth?: boolean;
        /** Id of the rendered button. */
        id?: string;
        /** Name for native form serialization. When set, a hidden input is emitted. */
        name?: string;
        /** Bindable ref to the button element. */
        element?: HTMLButtonElement;
        /** Fires with the new value + the parsed Color on every change. */
        onchange?: (e: {
            value: ValueFor<F>;
            color: Color;
        }) => void;
        /** External describing element id (ARIA). */
        'aria-describedby'?: string;
        /** Extra classes on the box. */
        class?: string;
        /** Optional snippet for custom swatch content. */
        swatchOverlay?: Snippet;
    };
    exports: {};
    bindings: "element" | "value";
    slots: {};
    events: {};
};
declare class __sveltets_Render<F extends ColorFormat = 'hex'> {
    props(): ReturnType<typeof $$render<F>>['props'];
    events(): ReturnType<typeof $$render<F>>['events'];
    slots(): ReturnType<typeof $$render<F>>['slots'];
    bindings(): "element" | "value";
    exports(): {};
}
interface $$IsomorphicComponent {
    new <F extends ColorFormat = 'hex'>(options: import('svelte').ComponentConstructorOptions<ReturnType<__sveltets_Render<F>['props']>>): import('svelte').SvelteComponent<ReturnType<__sveltets_Render<F>['props']>, ReturnType<__sveltets_Render<F>['events']>, ReturnType<__sveltets_Render<F>['slots']>> & {
        $$bindings?: ReturnType<__sveltets_Render<F>['bindings']>;
    } & ReturnType<__sveltets_Render<F>['exports']>;
    <F extends ColorFormat = 'hex'>(internal: unknown, props: ReturnType<__sveltets_Render<F>['props']> & {}): ReturnType<__sveltets_Render<F>['exports']>;
    z_$$bindings?: ReturnType<__sveltets_Render<any>['bindings']>;
}
declare const ColorPicker: $$IsomorphicComponent;
type ColorPicker<F extends ColorFormat = 'hex'> = InstanceType<typeof ColorPicker<F>>;
export default ColorPicker;
