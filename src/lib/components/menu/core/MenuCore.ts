import { throttle } from '@lib/utils/timing'
import { matchSorter } from 'match-sorter'
import {
  type ActiveMenu,
  type ActiveMenuMeta,
  type MenuItem,
  type MenuDOMAdapter,
  type MenuCoreConfig,
  type MenuDisplayState,
  type ItemRenderMeta,
  type Vec2,
  MenuBehavior,
  MENU_SEPARATOR,
} from './types'
import { calculatePosition, checkIfInTriangle } from './positioning'
import {
  getMenuItems,
  createActiveMenu,
  addSubMenu,
  removeSubMenu,
} from './navigation'

export class MenuCore {
  private config: MenuCoreConfig
  private adapter: MenuDOMAdapter

  // State
  private activeMenus: ActiveMenu[] = []
  private activeMenusMeta: ActiveMenuMeta[] = []
  private _clickedItem: [number, number] | null = null

  // Unix-style click handling
  private unixTimeout: {
    unix: boolean
    timeout: number | null
  } = { unix: true, timeout: null }

  // Safe area triangle for mouse navigation
  private queuedSafeArea: number | null = null
  private safeArea: (Vec2 | null)[] = [null, null, null]

  // Throttled mouse position setter
  private setMousePosition: ReturnType<typeof throttle>

  // Track submenu opening timeouts
  private submenuTimeout: number | null = null

  constructor(config: MenuCoreConfig, adapter: MenuDOMAdapter) {
    this.config = config
    this.adapter = adapter

    this.setMousePosition = throttle((x: number, y: number) => {
      if (this.safeArea[0] === null) {
        this.safeArea[0] = { x: 0, y: 0 }
      }
      this.safeArea[0].x = x
      this.safeArea[0].y = y
    }, 200)
  }

  // --------
  // Lifecycle
  // --------

  init(): void {
    // Set up unix-style click timeout
    this.unixTimeout.timeout = this.adapter.setTimeout(() => {
      this.unixTimeout.timeout = null
    }, 300)

    // Create the initial root menu
    const [activeMenu, activeMenuMeta] = createActiveMenu(
      this.config.behavior,
      -1,
      this.config.anchorRect,
      [],
      this.config.items,
    )
    this.activeMenus = [activeMenu]
    this.activeMenusMeta = [activeMenuMeta]
    this.emitState()
  }

  destroy(): void {
    if (this.unixTimeout.timeout !== null) {
      this.adapter.clearTimeout(this.unixTimeout.timeout)
    }
    if (this.submenuTimeout !== null) {
      this.adapter.clearTimeout(this.submenuTimeout)
    }
    this.setMousePosition.cancel()
  }

  updateItems(items: MenuItem[]): void {
    this.config.items = items

    if (this.activeMenus.length === 0) return

    this.dropInvalidFocus()

    // First render pass: wait for DOM to update with new items
    this.adapter.scheduleAfterRender(() => {
      // Get initial dimensions after content update
      this.activeMenus.forEach((_activeMenu, i) => {
        const meta = this.activeMenusMeta[i]
        if (meta.menuRef) {
          meta.menuRect = this.adapter.getBoundingClientRect(meta.menuRef)
        }
      })

      // Recalculate positions with new dimensions
      this.recalculateAllPositions()
      this.emitState()

      // Second render pass: measure again and adjust if needed
      this.adapter.scheduleAfterRender(() => {
        let needsAdjustment = false

        this.activeMenus.forEach((_activeMenu, i) => {
          const meta = this.activeMenusMeta[i]
          if (meta.menuRef) {
            const currentRect = this.adapter.getBoundingClientRect(meta.menuRef)
            if (
              Math.abs(currentRect.height - meta.menuRect.height) > 5 ||
              Math.abs(currentRect.width - meta.menuRect.width) > 5
            ) {
              meta.menuRect = currentRect
              needsAdjustment = true
            }
          }
        })

        if (needsAdjustment) {
          this.recalculateAllPositions()
          this.emitState()
        }
      })
    })
  }

  updateAnchorRect(rect: DOMRect): void {
    this.config.anchorRect = rect
  }

  // --------
  // DOM element binding
  // --------

  onMenuMount(menuIndex: number, element: HTMLElement | null): void {
    const activeMenu = this.activeMenus[menuIndex]
    const activeMenuMeta = this.activeMenusMeta[menuIndex]

    if (!element || activeMenuMeta.menuRef === element) return

    this.adapter.showPopover(element)

    activeMenuMeta.menuRef = element
    activeMenuMeta.menuRect = this.adapter.getBoundingClientRect(element)

    if (this.config.behavior !== MenuBehavior.SELECT) {
      // Focus the first child element
      if (
        this.takesFocus &&
        element.childNodes[0] &&
        element.childNodes[0].nodeType === 1
      ) {
        this.adapter.focus(element.childNodes[0] as HTMLElement, {
          preventScroll: true,
        })
      }

      activeMenu.position = this.calcPosition(
        menuIndex,
        activeMenuMeta.parentItemRect,
        activeMenuMeta.menuRect,
      )
    } else {
      // For select menus, find the checked item
      const menuItems = getMenuItems(this.config.items, activeMenu.menuPath)
      const focusIndex = menuItems.findIndex(
        (item) => typeof item === 'object' && 'checked' in item && item.checked,
      )
      const itemRef = activeMenuMeta.itemRefs[focusIndex]

      activeMenu.position = this.calcPosition(
        menuIndex,
        activeMenuMeta.parentItemRect,
        activeMenuMeta.menuRect,
        itemRef
          ? this.adapter.getBoundingClientRect(itemRef).y -
              activeMenuMeta.menuRect.y
          : undefined,
      )
    }

    // Handle queued safe area
    if (this.queuedSafeArea != null && this.queuedSafeArea === menuIndex) {
      const height =
        activeMenu.position.height || activeMenuMeta.menuRect.height

      if (this.safeArea[1] === null) {
        this.safeArea[1] = { x: 0, y: 0 }
      }
      if (this.safeArea[2] === null) {
        this.safeArea[2] = { x: 0, y: 0 }
      }

      this.safeArea[1].x = activeMenu.position.x
      this.safeArea[1].y = activeMenu.position.y
      this.safeArea[2].x = activeMenu.position.x
      this.safeArea[2].y = activeMenu.position.y + height

      this.queuedSafeArea = null
    }

    this.emitState()
  }

  onItemMount(
    menuIndex: number,
    itemIndex: number,
    element: HTMLElement | null,
  ): void {
    const activeMenuMeta = this.activeMenusMeta[menuIndex]
    if (!element || activeMenuMeta.itemRefs[itemIndex] === element) return

    // For non-autocomplete menus, focus checked items automatically
    if (this.takesFocus && this.config.behavior !== MenuBehavior.AUTOCOMPLETE) {
      const menuItem = getMenuItems(
        this.config.items,
        this.activeMenus[menuIndex].menuPath,
      )[itemIndex]
      if (
        typeof menuItem === 'object' &&
        'checked' in menuItem &&
        menuItem.checked
      ) {
        this.adapter.focus(element, { preventScroll: true })
      }
    }

    activeMenuMeta.itemRefs[itemIndex] = element
  }

  // --------
  // Event handlers
  // --------

  handleKeydown(key: string): {
    preventDefault?: boolean
    stopPropagation?: boolean
  } {
    // Left for the dismissal stack, which knows whether this menu is the topmost thing open. A
    // menu that closed itself here would also close the dialog it sits in, because the keystroke
    // would reach that dialog's close request uncancelled.
    if (key === 'Escape') return {}

    const currentMenu = this.activeMenus[this.activeMenus.length - 1]
    const menuLength = getMenuItems(
      this.config.items,
      currentMenu.menuPath,
    ).length

    if (key === 'ArrowDown') {
      if (currentMenu.focus < menuLength - 1) {
        this.changeCurrentMenuFocus(currentMenu.focus + 1, true)
      }
      this.emitState()
      return { preventDefault: true, stopPropagation: true }
    }

    if (key === 'ArrowUp') {
      if (currentMenu.focus === -1) {
        this.changeCurrentMenuFocus(menuLength - 1, true)
      } else if (currentMenu.focus > 0) {
        this.changeCurrentMenuFocus(currentMenu.focus - 1, true)
      }
      this.emitState()
      return { preventDefault: true, stopPropagation: true }
    }

    if (key === 'ArrowRight') {
      if (currentMenu.focus === -1) {
        this.changeCurrentMenuFocus(0, true)
        this.emitState()
        return { preventDefault: true, stopPropagation: true }
      }

      const newMenuArrays = addSubMenu(
        this.config.behavior,
        this.config.items,
        this.activeMenus,
        this.activeMenusMeta,
        this.activeMenus.length - 1,
        currentMenu.focus,
      )
      if (newMenuArrays) {
        this.activeMenus = newMenuArrays[0]
        this.activeMenusMeta = newMenuArrays[1]
      }
      this.emitState()
      return { preventDefault: true, stopPropagation: true }
    }

    if (key === 'ArrowLeft') {
      if (this.activeMenus.length === 1) {
        if (currentMenu.focus === -1) {
          this.changeCurrentMenuFocus(0, true)
        }
        this.emitState()
        return { preventDefault: true, stopPropagation: true }
      }

      const newMenuArrays = removeSubMenu(
        this.activeMenus,
        this.activeMenusMeta,
        this.activeMenus.length - 2,
      )
      if (newMenuArrays) {
        this.activeMenus = newMenuArrays[0]
        this.activeMenusMeta = newMenuArrays[1]
        this.emitState()
      }
      return { preventDefault: true, stopPropagation: true }
    }

    if (key === 'Enter' || key === ' ') {
      if (currentMenu.focus === -1) {
        this.emitState()
        return {}
      }

      const currentItem = getMenuItems(this.config.items, currentMenu.menuPath)[
        currentMenu.focus
      ]

      if (typeof currentItem === 'object' && 'onClick' in currentItem) {
        this.handleItemActivation(
          this.activeMenus.length - 1,
          currentMenu.focus,
        )
      } else if (typeof currentItem === 'object' && 'items' in currentItem) {
        const newMenuArrays = addSubMenu(
          this.config.behavior,
          this.config.items,
          this.activeMenus,
          this.activeMenusMeta,
          this.activeMenus.length - 1,
          currentMenu.focus,
        )
        if (newMenuArrays) {
          this.activeMenusMeta = newMenuArrays[1]
          this.activeMenus = newMenuArrays[0]
          this.emitState()
          return {}
        }
      }

      this.emitState()
      return {}
    }

    if (
      key.length === 1 &&
      this.config.behavior !== MenuBehavior.AUTOCOMPLETE
    ) {
      const activeMenuMeta = this.activeMenusMeta[this.activeMenus.length - 1]
      const currentTime = new Date().getTime()
      const lastKeyTime = activeMenuMeta.lastSearchTime

      if (currentTime - lastKeyTime > 200) {
        activeMenuMeta.searchTerm = key
      } else {
        activeMenuMeta.searchTerm += key
      }
      activeMenuMeta.lastSearchTime = currentTime

      const result = matchSorter(
        activeMenuMeta.searchItems,
        activeMenuMeta.searchTerm,
        { keys: ['label'] },
      )

      if (result.length > 0) {
        this.changeCurrentMenuFocus(result[0].index)
        this.emitState()
        return {}
      }
    }

    this.emitState()
    return {}
  }

  handleMouseMove(
    clientX: number,
    clientY: number,
    menuIndex: number | null,
    itemIndex: number | null,
  ): void {
    if (this._clickedItem != null) return
    if (menuIndex === null || itemIndex === null) return

    const menu = menuIndex
    const index = itemIndex

    // Cache menu items for the current menu path (used up to 3 times)
    const menuItems = getMenuItems(
      this.config.items,
      this.activeMenus[menu].menuPath,
    )

    // Check if mouse is over an item that already has its submenu open
    if (this.activeMenusMeta[menu + 1]?.parentIndex === index) {
      const item = menuItems[index]
      if (typeof item === 'object' && 'items' in item) {
        this.setSafeZoneMenu(menu + 1)
        this.setMousePosition(clientX, clientY)
      }
      return
    }

    // Check safe area triangle
    const activeItem = menuItems[this.activeMenus[menu].focus]
    if (
      this.activeMenus.length > menu + 1 &&
      typeof activeItem === 'object' &&
      activeItem &&
      'items' in activeItem
    ) {
      const mouse = { x: clientX, y: clientY }
      if (
        this.safeArea[0] !== null &&
        this.safeArea[1] !== null &&
        this.safeArea[2] !== null
      ) {
        const inTriangle = checkIfInTriangle(
          this.safeArea[0],
          this.safeArea[1],
          this.safeArea[2],
          mouse,
        )
        if (inTriangle) return
      }
    }

    let newActiveMenusMeta = null

    // Close any submenus if hovering over a parent menu item
    if (menu < this.activeMenus.length - 1) {
      const [newMenus, newMenusMeta] = removeSubMenu(
        this.activeMenus,
        this.activeMenusMeta,
        menu,
      )
      this.activeMenus = newMenus
      newActiveMenusMeta = newMenusMeta
    }

    // Update focus to the hovered item
    this.activeMenus[menu].focus = index

    this.emitState()
    if (newActiveMenusMeta) {
      this.activeMenusMeta = newActiveMenusMeta
    }

    // Check if hovered item has submenu items
    const item = menuItems[index]
    if (!(typeof item === 'object' && 'items' in item)) return

    // Clear any previous submenu timeout
    if (this.submenuTimeout !== null) {
      this.adapter.clearTimeout(this.submenuTimeout)
    }

    // Delay submenu opening
    this.submenuTimeout = this.adapter.setTimeout(() => {
      this.submenuTimeout = null
      if (menu < this.activeMenus.length - 1) return
      if (this.activeMenus[menu]?.focus !== index) return

      const newMenuArrays = addSubMenu(
        this.config.behavior,
        this.config.items,
        this.activeMenus,
        this.activeMenusMeta,
        menu,
        index,
      )
      if (!newMenuArrays) return

      this.setSafeZoneMenu(menu + 1)
      this.setMousePosition(clientX, clientY)
      this.activeMenusMeta = newMenuArrays[1]
      this.activeMenus = newMenuArrays[0]
      this.emitState()
    }, 100)
  }

  handleMouseUp(): void {
    if (this.config.behavior !== MenuBehavior.MENU) return

    if (this.unixTimeout.timeout !== null) {
      this.adapter.clearTimeout(this.unixTimeout.timeout)
      this.unixTimeout.timeout = null
      this.unixTimeout.unix = false
      return
    }

    if (!this.unixTimeout.unix) return

    const activeMenu = this.activeMenus[this.activeMenus.length - 1]

    if (activeMenu.focus === -1) {
      this.config.hide()
      return
    }

    const item = getMenuItems(
      this.config.items,
      this.activeMenus[this.activeMenus.length - 1].menuPath,
    )[activeMenu.focus]

    if (!(typeof item === 'object' && 'items' in item)) {
      this.handleItemActivation(this.activeMenus.length - 1, activeMenu.focus)
    } else {
      this._clickedItem = [this.activeMenus.length - 1, activeMenu.focus]
      this.emitState()
    }
  }

  handleMenuMouseLeave(menuIndex: number): void {
    if (
      this.config.behavior === MenuBehavior.SELECT ||
      this.config.behavior === MenuBehavior.AUTOCOMPLETE
    )
      return

    if (menuIndex !== this.activeMenus.length - 1) return

    const activeMenu = this.activeMenus[menuIndex]
    if (activeMenu.focus === -1) return

    activeMenu.focus = -1
    this.emitState()
  }

  handleScroll(
    menuIndex: number,
    scrollTop: number,
    scrollHeight: number,
    clientHeight: number,
  ): void {
    let scrollPosition = 0
    if (scrollTop === 0) {
      scrollPosition = -1
    } else if (scrollHeight - scrollTop === clientHeight) {
      scrollPosition = 1
    }

    if (scrollPosition !== this.activeMenus[menuIndex].scrollPosition) {
      this.activeMenus[menuIndex].scrollPosition = scrollPosition
      this.emitState()
    }
  }

  handleItemClick(menuIndex: number, itemIndex: number): void {
    this.handleItemActivation(menuIndex, itemIndex)
  }

  handleResize(): void {
    this.activeMenus.forEach((activeMenu, i) => {
      const meta = this.activeMenusMeta[i]

      if (i > 0) {
        const prevMenu = this.activeMenusMeta[i - 1]
        const parentItemRect = prevMenu.itemRefs[this.activeMenus[i - 1].focus]
        if (parentItemRect) {
          meta.parentItemRect =
            this.adapter.getBoundingClientRect(parentItemRect)
        }
      }

      if (meta.menuRef) {
        meta.menuRect = this.adapter.getBoundingClientRect(meta.menuRef)
      }

      activeMenu.position = this.calcPosition(
        i,
        meta.parentItemRect,
        meta.menuRect,
      )
    })
    this.emitState()
  }

  handleAnchorMove(
    anchorRef?: HTMLElement,
    anchor?: { x: number; y: number },
  ): void {
    this.adapter.scheduleAfterRender(() => {
      this.activeMenus.forEach((activeMenu, i) => {
        const meta = this.activeMenusMeta[i]

        if (i > 0) {
          const parentItemRef = meta.itemRefs[this.activeMenus[i - 1].focus]
          if (parentItemRef) {
            meta.parentItemRect =
              this.adapter.getBoundingClientRect(parentItemRef)
          }
        } else {
          if (anchorRef) {
            meta.parentItemRect = this.adapter.getBoundingClientRect(anchorRef)
          } else if (anchor) {
            const rect = new DOMRect()
            rect.x = anchor.x
            rect.y = anchor.y
            meta.parentItemRect = rect
          } else {
            // A rect anchor keeps its height, which is what puts the menu below
            // a text caret rather than on top of it. Routing one through the
            // point branch above would flatten it to zero height.
            meta.parentItemRect = this.config.anchorRect
          }
        }

        activeMenu.position = this.calcPosition(
          i,
          meta.parentItemRect,
          meta.menuRect,
        )
      })
      this.emitState()
    })
  }

  handleAnimationEnd(_menu: number, _item: number): void {
    // Called when CSS animation finishes on a clicked item
    // The callback was already set up in handleItemActivation
  }

  // --------
  // Rendering helpers
  // --------

  getMenuItemMeta(menuPath: number[], menuIndex: number): ItemRenderMeta[] {
    return getMenuItems(this.config.items, menuPath).map((item, j) => {
      const selected = j === this.activeMenus[menuIndex]?.focus
      const hasSubMenu = typeof item === 'object' && 'items' in item
      const subMenuOpen =
        hasSubMenu && this.activeMenusMeta[menuIndex + 1]?.parentIndex === j
      const isDisabled =
        typeof item === 'object' && 'disabled' in item && item.disabled
          ? true
          : undefined

      const isChecked =
        typeof item === 'object' && 'checked' in item
          ? typeof item.checked === 'function'
            ? item.checked()
            : item.checked
          : undefined

      return {
        item,
        selected,
        hasSubMenu,
        subMenuOpen,
        isDisabled,
        isChecked,
      }
    })
  }

  getGutterVisibility(menuPath: number[]): {
    showLeftGutter: boolean
    showRightGutter: boolean
  } {
    const menuItems = getMenuItems(this.config.items, menuPath)

    let showLeftGutter = false
    let showRightGutter = false

    for (const item of menuItems) {
      if (typeof item === 'object' && 'label' in item) {
        if ('checked' in item && item.checked !== undefined) {
          showLeftGutter = true
        }
        if ('items' in item) {
          showRightGutter = true
        }
        if (showLeftGutter && showRightGutter) {
          break
        }
      }
    }

    return { showLeftGutter, showRightGutter }
  }

  getMenuRole(): string {
    return this.config.behavior === MenuBehavior.AUTOCOMPLETE
      ? 'listbox'
      : 'menu'
  }

  getMenuElements(): HTMLElement[] {
    return this.activeMenusMeta
      .map((m) => m.menuRef)
      .filter((m): m is HTMLElement => m !== null)
  }

  getItemRef(menu: number, item: number): HTMLElement | null {
    return this.activeMenusMeta[menu]?.itemRefs[item] ?? null
  }

  get displayState(): MenuDisplayState {
    return {
      activeMenus: [...this.activeMenus],
      clickedItem: this._clickedItem,
    }
  }

  // --------
  // Private helpers
  // --------

  private emitState(): void {
    this.config.onStateChange(this.displayState)
  }

  private calcPosition(
    depth: number,
    parentItemRect: DOMRect,
    menuRect: DOMRect,
    relativeDistance?: number,
  ) {
    return calculatePosition(
      depth,
      parentItemRect,
      menuRect,
      this.config.behavior,
      this.adapter.getWindowDimensions(),
      relativeDistance,
    )
  }

  private recalculateAllPositions(): void {
    this.activeMenus.forEach((activeMenu, i) => {
      const meta = this.activeMenusMeta[i]

      if (this.config.behavior === MenuBehavior.SELECT) {
        const menuItems = getMenuItems(this.config.items, activeMenu.menuPath)
        const focusIndex = menuItems.findIndex(
          (item) =>
            typeof item === 'object' && 'checked' in item && item.checked,
        )
        const itemRef = meta.itemRefs[focusIndex]

        activeMenu.position = this.calcPosition(
          i,
          meta.parentItemRect,
          meta.menuRect,
          itemRef
            ? this.adapter.getBoundingClientRect(itemRef).y - meta.menuRect.y
            : undefined,
        )
      } else {
        activeMenu.position = this.calcPosition(
          i,
          meta.parentItemRect,
          meta.menuRect,
        )
      }
    })
  }

  private handleItemActivation(menu: number, index: number): void {
    if (this._clickedItem) return

    const item = getMenuItems(
      this.config.items,
      this.activeMenus[menu].menuPath,
    )[index]
    if (!(typeof item === 'object')) return
    if ('disabled' in item && item.disabled) return

    if ('onClick' in item) {
      if (this.config.closeOnClick) {
        this._clickedItem = [menu, index]
        this.emitState()
        this.config.onAnimationEnd(menu, index, () => {
          item.onClick()
          this.config.hide()
          this._clickedItem = null
        })
      } else {
        item.onClick()
        this._clickedItem = [menu, index]
        this.emitState()
        this.adapter.setTimeout(() => {
          this._clickedItem = null
          this.emitState()
        }, 100)
      }
      return
    }

    if ('items' in item) {
      const newMenuArrays = addSubMenu(
        this.config.behavior,
        this.config.items,
        this.activeMenus,
        this.activeMenusMeta,
        menu,
        index,
      )
      if (newMenuArrays) {
        this.activeMenus = newMenuArrays[0]
        this.activeMenusMeta = newMenuArrays[1]
        this.emitState()
      }
    }
  }

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
  setFocus(index: number): number {
    const currentMenu = this.activeMenus[this.activeMenus.length - 1]
    if (!currentMenu) return -1

    if (index === -1) {
      currentMenu.focus = -1
      this.emitState()
      return -1
    }

    this.changeCurrentMenuFocus(index, true)
    this.emitState()
    return currentMenu.focus
  }

  /** The highlighted index in the deepest open menu, or -1. */
  get focusedIndex(): number {
    return this.activeMenus[this.activeMenus.length - 1]?.focus ?? -1
  }

  /** Whether this menu is allowed to move DOM focus. */
  private get takesFocus(): boolean {
    return this.config.takeFocus !== false
  }

  private dropInvalidFocus(): void {
    this.activeMenus.forEach((activeMenu) => {
      if (activeMenu.focus === -1) return

      const items = getMenuItems(this.config.items, activeMenu.menuPath)
      const item = items[activeMenu.focus]
      const usable =
        item !== undefined &&
        item !== MENU_SEPARATOR &&
        !(typeof item === 'object' && item.disabled)

      if (!usable) activeMenu.focus = -1
    })
  }

  private changeCurrentMenuFocus(index: number, fromUserInput = false): void {
    const currentMenu = this.activeMenus[this.activeMenus.length - 1]
    const currentMenuItems = getMenuItems(
      this.config.items,
      currentMenu.menuPath,
    )
    const menuLength = currentMenuItems.length

    const direction = index > currentMenu.focus ? 1 : -1

    if (index < 0 || index >= menuLength) return

    let newItem = currentMenuItems[index]
    while (
      newItem === MENU_SEPARATOR ||
      (typeof newItem === 'object' && newItem.disabled)
    ) {
      index += direction
      if (index < 0 || index >= menuLength) return
      newItem = currentMenuItems[index]
    }

    currentMenu.focus = index
    const itemRef =
      this.activeMenusMeta[this.activeMenus.length - 1].itemRefs[index]
    if (itemRef) {
      this.adapter.scrollIntoView(itemRef, { block: 'nearest' })
    }

    if (this.config.onItemFocus) {
      this.config.onItemFocus(currentMenuItems[index])
    }

    if (!fromUserInput && this.config.behavior === MenuBehavior.AUTOCOMPLETE)
      return
    if (itemRef && this.takesFocus) {
      this.adapter.focus(itemRef, { preventScroll: true })
    }
  }

  private setSafeZoneMenu(menu: number): void {
    if (!this.activeMenusMeta[menu]) {
      this.queuedSafeArea = menu
      return
    }

    const nextMenu = this.activeMenus[menu]
    const nextMenuMeta = this.activeMenusMeta[menu]

    const flipWidth = nextMenu.position.endAlign
      ? 0
      : nextMenuMeta.menuRect.width

    if (this.safeArea[1] === null) {
      this.safeArea[1] = { x: 0, y: 0 }
    }
    if (this.safeArea[2] === null) {
      this.safeArea[2] = { x: 0, y: 0 }
    }

    this.safeArea[1].x = nextMenu.position.x + flipWidth
    this.safeArea[1].y = nextMenu.position.y

    this.safeArea[2].x = nextMenu.position.x + flipWidth
    this.safeArea[2].y = nextMenu.position.y + nextMenuMeta.menuRect.height
  }
}
