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
const layers = [];
let listening = false;
function onWindowKeydown(event) {
    if (event.key !== 'Escape')
        return;
    // Escape ends an IME composition rather than asking for anything to close, and WebKit reports
    // that as a keydown like any other.
    if (event.isComposing)
        return;
    // Somebody nearer the event took the key. Listening at the window in the bubble phase is what
    // makes this readable by now.
    if (event.defaultPrevented)
        return;
    const layer = layers[layers.length - 1];
    if (!layer)
        return;
    // Cancelled before the layer is told, not after. A dialog's close request is a default action of
    // this keydown, so leaving the default in place would close the dialog underneath as well.
    event.preventDefault();
    layer.dismiss();
}
/**
 * Attaches the listener on the first registration and leaves it attached.
 *
 * Attaching late is deliberate. Two window listeners in the bubble phase run in
 * the order they were added, and a host with its own Escape handling has one of
 * its own, so a stack that attached at module load would take the key away from
 * hosts that have not been told about it yet. The first registration happens
 * when something opens, which is long after a host has mounted.
 */
function listen() {
    if (listening || typeof window === 'undefined')
        return;
    window.addEventListener('keydown', onWindowKeydown);
    listening = true;
}
/**
 * Puts a layer on top of the stack and answers with the call that takes it off.
 *
 * The return is the removal, so a Svelte caller can hand it straight back from
 * an effect. Removal is idempotent and safe out of order, because a layer under
 * another one can be closed from a button while the one above it is still up.
 */
export function registerDismissLayer(layer) {
    if (typeof window === 'undefined')
        return () => { };
    listen();
    layers.push(layer);
    let released = false;
    return () => {
        if (released)
            return;
        released = true;
        // By identity rather than by index, since a layer below this one may already have gone.
        const at = layers.indexOf(layer);
        if (at !== -1)
            layers.splice(at, 1);
    };
}
/** Whether Escape would reach this exact layer right now. */
export function isTopDismissLayer(layer) {
    return layers[layers.length - 1] === layer;
}
/** Closes the topmost layer. Answers false when there was nothing to close. */
export function dismissTop() {
    const layer = layers[layers.length - 1];
    if (!layer)
        return false;
    layer.dismiss();
    return true;
}
/**
 * Whether any registered layer is modal, at any depth.
 *
 * Not the same as the top layer being modal. A menu opened inside a modal is on
 * top and is not itself modal, and a host's shortcuts must stay off for both.
 */
export function hasModalLayer() {
    return layers.some((layer) => layer.modal === true);
}
/** Test seam. Not exported from the package. */
export function resetDismissStack() {
    layers.length = 0;
}
// An edit to this module would otherwise leave the old copy's listener bound to the old array,
// handling Escape a second time against layers nothing can reach. Vite replaces `import.meta.hot`
// with undefined when it builds the package, so this costs the published build nothing.
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        if (!listening)
            return;
        window.removeEventListener('keydown', onWindowKeydown);
        listening = false;
    });
}
