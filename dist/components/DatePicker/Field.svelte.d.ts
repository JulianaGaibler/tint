import type { Snippet } from 'svelte';
interface Props {
    /** Floating label above the field. */
    label: string;
    /** Whether to render the label raised, as if the field held a value. */
    filled: boolean;
    helperText?: string;
    error?: string;
    fillWidth?: boolean;
    disabled?: boolean;
    id?: string;
    /** Name for native form serialization. Paired with `serializedValue`. */
    name?: string;
    /** The hidden input's value when `name` is set. */
    serializedValue?: string;
    isOpen: boolean;
    triggerLabel: string;
    onTriggerClick: () => void;
    /** Bindable ref to the trigger button, used to anchor the popover. */
    triggerElement?: HTMLButtonElement;
    'aria-describedby'?: string;
    class?: string;
    /** The field's segment group or groups. */
    children: Snippet<[{
        labelId: string;
        describedBy: string | undefined;
    }]>;
}
declare const Field: import("svelte").Component<Props, {}, "triggerElement">;
type Field = ReturnType<typeof Field>;
export default Field;
