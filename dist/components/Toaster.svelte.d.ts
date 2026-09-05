import type { ToastPosition } from './toast/types.js';
interface Props {
    /** Toast position on screen */
    position?: ToastPosition;
    /** Whether toasts are expanded by default */
    expand?: boolean;
    /** Show close button on all toasts */
    closeButton?: boolean;
    /** Default toast duration in ms */
    duration?: number;
    /** Maximum visible toasts in the stack */
    visibleToasts?: number;
    /** Gap between toasts in px */
    gap?: number;
    /** Offset from viewport edge */
    offset?: string;
    /**
     * How wide the stack is.
     *
     * A toast that carries an action has to fit a sentence and a button, and
     * how much room that needs is the consumer's to know: `Undo` beside four
     * words is not `Add person` beside twenty.
     */
    width?: string;
    /** A space separated list of CSS classes */
    class?: string;
}
declare const Toaster: import("svelte").Component<Props, {}, "">;
type Toaster = ReturnType<typeof Toaster>;
export default Toaster;
