export { WINDOW_PADDING, TOP_MENU_OFFSET, LEFT_MENU_OFFSET, MENU_SEPARATOR, MenuBehavior, type MenuBehaviorType, type MenuItem, type Vec2, type ActiveMenu, type ActiveMenuMeta, } from './core/types';
import { type Vec2, type MenuBehaviorType, type MenuItem } from './core/types';
interface Props {
    id?: string;
    anchorRef?: HTMLElement;
    anchor?: Vec2 | undefined;
    /**
     * A rectangle to anchor to, for a caller with no element to point at. A
     * text caret is the motivating case: `coordsAtPos` gives a rect with the
     * caret's height, so the menu opens below the line rather than over it.
     * Takes precedence over `anchor`, and is outranked by `anchorRef`.
     */
    anchorRect?: DOMRect | undefined;
    items: MenuItem[];
    behavior: MenuBehaviorType;
    size?: 'tight' | 'large';
    animated?: boolean;
    closeOnClick?: boolean;
    hide: () => void;
    /**
     * What the dismissal stack calls to close this menu, when the host wants
     * something other than `hide`. A picker that keeps its typed text when the
     * menu closes on its own, but discards it when the user asks for the menu
     * to go away, says so here.
     */
    dismiss?: () => void;
    /**
     * When false, the menu never moves DOM focus and never restores it on
     * teardown. A host that owns the caret needs this, and has to render
     * `aria-activedescendant` itself. Items also activate on mousedown rather
     * than click, so the press cannot move focus before the activation runs.
     */
    takeFocus?: boolean;
    /**
     * When false, the menu binds no key handler and the host drives it through
     * `highlightedIndex`. When true, a keystroke already handled elsewhere is
     * still ignored.
     */
    handleKeys?: boolean;
    /**
     * When false, no click-catching overlay is rendered, so pointer events
     * reach whatever is behind the menu. The host then owns dismissing it.
     */
    overlay?: boolean;
    onItemFocus?: (item: MenuItem) => void;
    recalculatePosition?: () => void;
    lastActiveElement?: HTMLElement;
    /**
     * Id of the highlighted item, for a host rendering `aria-activedescendant`.
     * Read only.
     */
    activeItemId?: string | undefined;
    /**
     * The highlighted index, two way. Write to move the highlight, read to know
     * where it is.
     *
     * The component corrects a write that lands on a separator, a disabled item
     * or an index outside the list, and writes the corrected value back. It
     * also writes on hover, since hovering moves the highlight. So drive this
     * from an event handler rather than from an effect that also reads it. -1
     * means nothing is highlighted.
     */
    highlightedIndex?: number;
}
declare const MenuInternal: import("svelte").Component<Props, {}, "recalculatePosition" | "lastActiveElement" | "activeItemId" | "highlightedIndex">;
type MenuInternal = ReturnType<typeof MenuInternal>;
export default MenuInternal;
