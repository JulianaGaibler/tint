import type { MenuItem } from './menu/MenuInternal.svelte';
export type { MenuItem };
export { MENU_SEPARATOR } from './menu/MenuInternal.svelte';
export type ContextClickHandler = (e: Event | MouseEvent) => void;
interface Props {
    /**
     * The variant of the menu. If 'context', the menu opens at the location of
     * the mouse event. If 'button', the menu is attached to the element that
     * triggered the event.
     *
     * @type {'context' | 'button'}
     */
    variant?: 'context' | 'button';
    /**
     * The items of the menu. Menu does not open when undefined.
     *
     * @type {MenuItem[] | undefined}
     */
    items?: MenuItem[] | undefined;
    /**
     * The size of the menu. 'tight' is the default compact size, 'large'
     * provides more spacing.
     *
     * @type {'tight' | 'large'}
     */
    size?: 'tight' | 'large';
    /**
     * Whether to animate menu appearance with fade and scale effects.
     *
     * @type {boolean}
     */
    animated?: boolean;
    /**
     * Whether picking an item closes the menu. Set false for a menu of
     * checkable items, where the point is to pick several without the menu
     * going away between them.
     *
     * @type {boolean}
     */
    closeOnClick?: boolean;
    /**
     * The function to call when the menu should be opened. Ensure event has a
     * target element for the anchor.
     *
     * @type {ContextClickHandler | undefined}
     */
    contextClick?: ContextClickHandler | undefined;
}
declare const Menu: import("svelte").Component<Props, {}, "contextClick">;
type Menu = ReturnType<typeof Menu>;
export default Menu;
