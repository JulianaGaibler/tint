import { type MenuItem, type MenuDOMAdapter, type MenuCoreConfig, type MenuDisplayState, type ItemRenderMeta } from './types';
export declare class MenuCore {
    private config;
    private adapter;
    private activeMenus;
    private activeMenusMeta;
    private _clickedItem;
    private unixTimeout;
    private queuedSafeArea;
    private safeArea;
    private setMousePosition;
    private submenuTimeout;
    constructor(config: MenuCoreConfig, adapter: MenuDOMAdapter);
    init(): void;
    destroy(): void;
    updateItems(items: MenuItem[]): void;
    updateAnchorRect(rect: DOMRect): void;
    onMenuMount(menuIndex: number, element: HTMLElement | null): void;
    onItemMount(menuIndex: number, itemIndex: number, element: HTMLElement | null): void;
    handleKeydown(key: string): {
        preventDefault?: boolean;
        stopPropagation?: boolean;
    };
    handleMouseMove(clientX: number, clientY: number, menuIndex: number | null, itemIndex: number | null): void;
    handleMouseUp(): void;
    handleMenuMouseLeave(menuIndex: number): void;
    handleScroll(menuIndex: number, scrollTop: number, scrollHeight: number, clientHeight: number): void;
    handleItemClick(menuIndex: number, itemIndex: number): void;
    handleResize(): void;
    handleAnchorMove(anchorRef?: HTMLElement, anchor?: {
        x: number;
        y: number;
    }): void;
    handleAnimationEnd(_menu: number, _item: number): void;
    getMenuItemMeta(menuPath: number[], menuIndex: number): ItemRenderMeta[];
    getGutterVisibility(menuPath: number[]): {
        showLeftGutter: boolean;
        showRightGutter: boolean;
    };
    getMenuRole(): string;
    getMenuElements(): HTMLElement[];
    getItemRef(menu: number, item: number): HTMLElement | null;
    get displayState(): MenuDisplayState;
    private emitState;
    private calcPosition;
    private recalculateAllPositions;
    private handleItemActivation;
    /**
     * Clears a highlight that the current item list can no longer support.
     *
     * A list that narrows while it is open leaves `focus` pointing past its end,
     * and both arrow keys then refuse to move: `ArrowDown` fails its `focus <
     * menuLength - 1` test and `ArrowUp` is rejected by `changeCurrentMenuFocus`.
     * The menu ends up with no visible highlight and dead arrows until it
     * closes.
     *
     * Only an unusable highlight is dropped, so a list that grew or stayed the
     * same keeps it. Nothing is highlighted in its place, which matches what a
     * freshly opened menu does and keeps `Enter` doing the same thing before and
     * after a keystroke. A caller that wants the first item highlighted instead
     * should drive `highlightedIndex`.
     */
    /**
     * Moves the highlight from outside, as an arrow key would.
     *
     * Returns the index actually settled on, which can differ from the one asked
     * for: a separator or a disabled item is skipped, and an index outside the
     * list is refused. A caller binding to this needs the resolved value so its
     * own copy does not drift.
     */
    setFocus(index: number): number;
    /** The highlighted index in the deepest open menu, or -1. */
    get focusedIndex(): number;
    /** Whether this menu is allowed to move DOM focus. */
    private get takesFocus();
    private dropInvalidFocus;
    private changeCurrentMenuFocus;
    private setSafeZoneMenu;
}
