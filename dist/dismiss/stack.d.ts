/**
 * One place that decides what Escape closes.
 *
 * A native `<dialog>` opened with `showModal()` does not close from a DOM
 * listener. Its close request is a default action of the keydown, run after the
 * event has finished dispatching and only if nothing cancelled it. Any window
 * level handler that cancels Escape therefore suppresses it, and the dialog
 * outlives the panel behind it. Ordering two independent listeners cannot fix
 * that, because one of the two is not a listener.
 *
 * Every dismissable surface registers here instead, and this module owns the
 * single window listener that reads Escape. It listens in the bubble phase, so
 * every handler nearer the event has already had its turn, and it stands down
 * when one of them cancelled the key. A field that wants Escape still says so
 * by preventing the default.
 */
/** One dismissable surface. */
export interface DismissLayer {
    /**
     * Closes this layer.
     *
     * Must be safe to call on a layer that has already closed. Two presses can
     * land before Svelte has flushed the first, and the layer stays registered
     * until its effect tears down.
     */
    dismiss: () => void;
    /**
     * Whether this layer makes everything behind it unreachable. True for a modal
     * dialog, false for a menu or a popover. Read by a host deciding whether its
     * own shortcuts should still fire.
     */
    modal?: boolean;
    /** Named only so a layer that leaked can be recognised in a debugger. */
    label?: string;
}
/**
 * Puts a layer on top of the stack and answers with the call that takes it off.
 *
 * The return is the removal, so a Svelte caller can hand it straight back from
 * an effect. Removal is idempotent and safe out of order, because a layer under
 * another one can be closed from a button while the one above it is still up.
 */
export declare function registerDismissLayer(layer: DismissLayer): () => void;
/** Whether Escape would reach this exact layer right now. */
export declare function isTopDismissLayer(layer: DismissLayer): boolean;
/** Closes the topmost layer. Answers false when there was nothing to close. */
export declare function dismissTop(): boolean;
/**
 * Whether any registered layer is modal, at any depth.
 *
 * Not the same as the top layer being modal. A menu opened inside a modal is on
 * top and is not itself modal, and a host's shortcuts must stay off for both.
 */
export declare function hasModalLayer(): boolean;
/** Test seam. Not exported from the package. */
export declare function resetDismissStack(): void;
