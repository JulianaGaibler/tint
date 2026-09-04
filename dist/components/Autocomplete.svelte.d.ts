import type { FullAutoFill } from 'svelte/elements';
declare function $$render<T>(): {
    props: {
        id: string;
        value: T | undefined;
        items: {
            value: T;
            label: string;
            hint?: string;
        }[];
        dynamicItems?: (search: string) => {
            items: {
                value: T;
                label: string;
                hint?: string;
            }[];
            allowAdd?: boolean;
        } | Promise<{
            items: {
                value: T;
                label: string;
                hint?: string;
            }[];
            allowAdd?: boolean;
        }>;
        onitemadded?: (label: string) => void;
        label: string;
        autocomplete?: FullAutoFill | undefined;
        helperText?: string | undefined;
        error?: string | undefined;
        disabled?: boolean;
        fillWidth?: boolean;
        allowFreeText?: boolean;
        'aria-describedby'?: string | undefined;
        element?: HTMLInputElement | undefined;
        class?: string;
    };
    exports: {};
    bindings: "element" | "value";
    slots: {};
    events: {};
};
declare class __sveltets_Render<T> {
    props(): ReturnType<typeof $$render<T>>['props'];
    events(): ReturnType<typeof $$render<T>>['events'];
    slots(): ReturnType<typeof $$render<T>>['slots'];
    bindings(): "element" | "value";
    exports(): {};
}
interface $$IsomorphicComponent {
    new <T>(options: import('svelte').ComponentConstructorOptions<ReturnType<__sveltets_Render<T>['props']>>): import('svelte').SvelteComponent<ReturnType<__sveltets_Render<T>['props']>, ReturnType<__sveltets_Render<T>['events']>, ReturnType<__sveltets_Render<T>['slots']>> & {
        $$bindings?: ReturnType<__sveltets_Render<T>['bindings']>;
    } & ReturnType<__sveltets_Render<T>['exports']>;
    <T>(internal: unknown, props: ReturnType<__sveltets_Render<T>['props']> & {}): ReturnType<__sveltets_Render<T>['exports']>;
    z_$$bindings?: ReturnType<__sveltets_Render<any>['bindings']>;
}
declare const Autocomplete: $$IsomorphicComponent;
type Autocomplete<T> = InstanceType<typeof Autocomplete<T>>;
export default Autocomplete;
