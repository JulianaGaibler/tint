// --------
// Constants
// --------

/** Padding of menus to each side of the window */
export const WINDOW_PADDING = 8
/** Distance between menus */
export const TOP_MENU_OFFSET = 4
export const LEFT_MENU_OFFSET = 4

// --------
// Public types
// --------
export const MENU_SEPARATOR = Symbol('seperator')

export const MenuBehavior = {
  MENU: 0,
  SELECT: 1,
  AUTOCOMPLETE: 2,
} as const

export type MenuBehaviorType = (typeof MenuBehavior)[keyof typeof MenuBehavior]

export type MenuItem<T = unknown> =
  | {
      label: string
      icon?: string
      checked?: boolean | (() => boolean)
      onClick: () => void
      data?: T
      disabled?: boolean
    }
  | {
      label: string
      icon?: string
      items: MenuItem<T>[]
      disabled?: boolean
    }
  | typeof MENU_SEPARATOR

// --------
// Local types
// --------

export type Vec2 = {
  x: number
  y: number
}

/** Describes information that is important for rendering the context menu */
export type ActiveMenu = {
  focus: number
  position: {
    x: number
    y: number
    endAlign: boolean
    height: number | undefined
    minWidth: number | undefined
    animationOrigin?: string
  }
  scrollPosition: number
  menuPath: number[]
}

/**
 * Describes information that is not used during rendering but is used for
 * calculations
 */
export type ActiveMenuMeta = {
  parentIndex: number
  parentItemRect: DOMRect
  menuRect: DOMRect
  menuRef: HTMLElement | null
  itemRefs: { [key: number]: HTMLElement | null }
  searchItems: { label: string; index: number }[]
  searchTerm: string
  lastSearchTime: number
}

/** Adapter interface for framework-agnostic DOM operations */
export interface MenuDOMAdapter {
  getBoundingClientRect(el: HTMLElement): DOMRect
  getWindowDimensions(): {
    innerWidth: number
    innerHeight: number
    scrollX: number
    scrollY: number
  }
  focus(el: HTMLElement, opts?: { preventScroll?: boolean }): void
  scrollIntoView(el: HTMLElement, opts?: ScrollIntoViewOptions): void
  showPopover(el: HTMLElement): void
  scheduleAfterRender(cb: () => void): Promise<void>
  setTimeout(cb: () => void, ms: number): number
  clearTimeout(id: number): void
}

/** Configuration for creating a MenuCore instance */
export interface MenuCoreConfig {
  behavior: MenuBehaviorType
  closeOnClick: boolean
  /**
   * When false, the menu never moves DOM focus. A host that owns the caret,
   * such as a text editor, needs this so typing continues while the menu is
   * open, and pairs it with `aria-activedescendant` so the highlight is still
   * announced. Defaults to true.
   */
  takeFocus?: boolean
  items: MenuItem[]
  anchorRect: DOMRect
  hide: () => void
  onItemFocus?: (item: MenuItem) => void
  onStateChange: (state: MenuDisplayState) => void
  onAnimationEnd: (menu: number, item: number, callback: () => void) => void
}

/** The display state emitted by MenuCore */
export interface MenuDisplayState {
  activeMenus: ActiveMenu[]
  clickedItem: [number, number] | null
}

/** Metadata for rendering a single menu item */
export interface ItemRenderMeta {
  item: MenuItem
  selected: boolean
  hasSubMenu: boolean
  subMenuOpen: boolean
  isDisabled: boolean | undefined
  isChecked: boolean | undefined
}
