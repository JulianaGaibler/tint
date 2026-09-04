import { type Snippet } from 'svelte';
import { type AnchoredSide } from '../positioning/anchored.js';
interface Props {
    open?: boolean;
    anchor?: HTMLElement | undefined;
    side?: AnchoredSide;
    label: string;
    takeFocus?: boolean;
    onclose?: () => void;
    children: Snippet;
    class?: string;
}
declare const Callout: import("svelte").Component<Props, {}, "open">;
type Callout = ReturnType<typeof Callout>;
export default Callout;
