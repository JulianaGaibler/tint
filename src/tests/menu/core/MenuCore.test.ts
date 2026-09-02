import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MenuCore } from '@lib/components/menu/core/MenuCore'
import {
  type MenuDOMAdapter,
  type MenuCoreConfig,
  type MenuDisplayState,
  type MenuItem,
  MenuBehavior,
  MENU_SEPARATOR,
} from '@lib/components/menu/core/types'

function createMockAdapter(): MenuDOMAdapter {
  return {
    getBoundingClientRect: vi.fn(() => new DOMRect(0, 0, 200, 300)),
    getWindowDimensions: vi.fn(() => ({
      innerWidth: 1024,
      innerHeight: 768,
      scrollX: 0,
      scrollY: 0,
    })),
    focus: vi.fn(),
    scrollIntoView: vi.fn(),
    showPopover: vi.fn(),
    scheduleAfterRender: vi.fn(async (cb) => cb()),
    setTimeout: vi.fn((cb, ms) => window.setTimeout(cb, ms)),
    clearTimeout: vi.fn((id) => window.clearTimeout(id)),
  }
}

function fourItems(): MenuItem[] {
  return [
    { label: 'One', onClick: vi.fn() },
    { label: 'Two', onClick: vi.fn() },
    { label: 'Three', onClick: vi.fn() },
    { label: 'Four', onClick: vi.fn() },
  ]
}

function twoItems(): MenuItem[] {
  return [
    { label: 'One', onClick: vi.fn() },
    { label: 'Two', onClick: vi.fn() },
  ]
}

function createTestItems(): MenuItem[] {
  return [
    { label: 'Cut', onClick: vi.fn() },
    { label: 'Copy', onClick: vi.fn() },
    MENU_SEPARATOR,
    { label: 'Paste', onClick: vi.fn(), disabled: true },
    {
      label: 'More',
      items: [
        { label: 'Sub1', onClick: vi.fn() },
        { label: 'Sub2', onClick: vi.fn() },
      ],
    },
  ]
}

function createCore(
  overrides: Partial<MenuCoreConfig> = {},
  adapterOverrides: Partial<MenuDOMAdapter> = {},
) {
  const items = createTestItems()
  const stateChanges: MenuDisplayState[] = []
  const adapter = { ...createMockAdapter(), ...adapterOverrides }

  const config: MenuCoreConfig = {
    behavior: MenuBehavior.MENU,
    closeOnClick: true,
    items,
    anchorRect: new DOMRect(100, 50, 80, 30),
    hide: vi.fn(),
    onItemFocus: vi.fn(),
    onStateChange: (state) => {
      stateChanges.push(state)
    },
    onAnimationEnd: vi.fn((_menu, _item, callback) => {
      // Immediately call callback for testing
      callback()
    }),
    ...overrides,
  }

  const core = new MenuCore(config, adapter)
  return { core, config, adapter, items, stateChanges }
}

describe('MenuCore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  describe('init()', () => {
    it('creates root menu and calls onStateChange', () => {
      const { core, stateChanges } = createCore()
      core.init()

      expect(stateChanges.length).toBeGreaterThan(0)
      const lastState = stateChanges[stateChanges.length - 1]
      expect(lastState.activeMenus).toHaveLength(1)
      expect(lastState.activeMenus[0].menuPath).toEqual([])
      expect(lastState.activeMenus[0].focus).toBe(-1)
    })
  })

  describe('handleKeydown', () => {
    it('ArrowDown moves focus down', () => {
      const { core, stateChanges } = createCore()
      core.init()

      // Mount the menu to set up item refs
      const menuEl = mockMenuElement()
      core.onMenuMount(0, menuEl)

      // Set up item refs
      for (let i = 0; i < 5; i++) {
        core.onItemMount(0, i, mockItemElement())
      }

      core.handleKeydown('ArrowDown')
      const lastState = stateChanges[stateChanges.length - 1]
      expect(lastState.activeMenus[0].focus).toBe(0) // First item (Cut)
    })

    it('ArrowDown skips separators and disabled items', () => {
      const { core, stateChanges } = createCore()
      core.init()

      const menuEl = mockMenuElement()
      core.onMenuMount(0, menuEl)
      for (let i = 0; i < 5; i++) {
        core.onItemMount(0, i, mockItemElement())
      }

      // Move down to index 1 (Copy)
      core.handleKeydown('ArrowDown')
      core.handleKeydown('ArrowDown')
      const state1 = stateChanges[stateChanges.length - 1]
      expect(state1.activeMenus[0].focus).toBe(1) // Copy

      // Move down: should skip separator (2) and disabled (3), go to 4 (More)
      core.handleKeydown('ArrowDown')
      const state2 = stateChanges[stateChanges.length - 1]
      expect(state2.activeMenus[0].focus).toBe(4) // More
    })

    it('ArrowUp from -1 goes to last item', () => {
      const { core, stateChanges } = createCore()
      core.init()

      const menuEl = mockMenuElement()
      core.onMenuMount(0, menuEl)
      for (let i = 0; i < 5; i++) {
        core.onItemMount(0, i, mockItemElement())
      }

      core.handleKeydown('ArrowUp')
      const lastState = stateChanges[stateChanges.length - 1]
      expect(lastState.activeMenus[0].focus).toBe(4) // Last item (More)
    })

    it('Escape calls hide()', () => {
      const { core, config } = createCore()
      core.init()

      core.handleKeydown('Escape')
      expect(config.hide).toHaveBeenCalled()
    })

    it('ArrowRight opens submenu if focused item has children', () => {
      const { core, stateChanges } = createCore()
      core.init()

      const menuEl = mockMenuElement()
      core.onMenuMount(0, menuEl)
      for (let i = 0; i < 5; i++) {
        core.onItemMount(0, i, mockItemElement())
      }

      // Navigate to "More" (index 4)
      core.handleKeydown('ArrowUp') // focus = 4 (More)

      // ArrowRight should open submenu
      core.handleKeydown('ArrowRight')
      const lastState = stateChanges[stateChanges.length - 1]
      expect(lastState.activeMenus).toHaveLength(2)
      expect(lastState.activeMenus[1].menuPath).toEqual([4])
    })

    it('ArrowLeft closes current submenu', () => {
      const { core, stateChanges } = createCore()
      core.init()

      const menuEl = mockMenuElement()
      core.onMenuMount(0, menuEl)
      for (let i = 0; i < 5; i++) {
        core.onItemMount(0, i, mockItemElement())
      }

      // Open submenu
      core.handleKeydown('ArrowUp') // focus = 4
      core.handleKeydown('ArrowRight') // open submenu

      // Close submenu
      core.handleKeydown('ArrowLeft')
      const lastState = stateChanges[stateChanges.length - 1]
      expect(lastState.activeMenus).toHaveLength(1)
    })

    it('Enter activates focused item', () => {
      const { core, config } = createCore()
      core.init()

      const menuEl = mockMenuElement()
      core.onMenuMount(0, menuEl)
      for (let i = 0; i < 5; i++) {
        core.onItemMount(0, i, mockItemElement())
      }

      // Focus first item
      core.handleKeydown('ArrowDown') // focus = 0 (Cut)
      core.handleKeydown('Enter')

      // onAnimationEnd should have been called
      expect(config.onAnimationEnd).toHaveBeenCalled()
    })

    it('returns preventDefault and stopPropagation for arrow keys', () => {
      const { core } = createCore()
      core.init()

      const menuEl = mockMenuElement()
      core.onMenuMount(0, menuEl)

      const result = core.handleKeydown('ArrowDown')
      expect(result.preventDefault).toBe(true)
      expect(result.stopPropagation).toBe(true)
    })
  })

  describe('character search', () => {
    it('typing letters finds matching item via match-sorter', () => {
      const { core, stateChanges } = createCore()
      core.init()

      const menuEl = mockMenuElement()
      core.onMenuMount(0, menuEl)
      for (let i = 0; i < 5; i++) {
        core.onItemMount(0, i, mockItemElement())
      }

      // Type 'c' to find 'Cut' or 'Copy'
      core.handleKeydown('c')
      const lastState = stateChanges[stateChanges.length - 1]
      // match-sorter should find Cut (index 0) or Copy (index 1)
      expect(lastState.activeMenus[0].focus).toBeGreaterThanOrEqual(0)
      expect(lastState.activeMenus[0].focus).toBeLessThanOrEqual(1)
    })
  })

  describe('handleItemClick', () => {
    it('triggers activation and sets clickedItem', () => {
      const { core, stateChanges, config } = createCore()
      core.init()

      const menuEl = mockMenuElement()
      core.onMenuMount(0, menuEl)
      for (let i = 0; i < 5; i++) {
        core.onItemMount(0, i, mockItemElement())
      }

      core.handleItemClick(0, 0)

      // Should have clickedItem set
      const lastState = stateChanges[stateChanges.length - 1]
      expect(lastState.clickedItem).toEqual([0, 0])
      expect(config.onAnimationEnd).toHaveBeenCalled()
    })
  })

  describe('handleMouseMove', () => {
    it('updates focus to hovered item', () => {
      const { core, stateChanges } = createCore()
      core.init()

      const menuEl = mockMenuElement()
      core.onMenuMount(0, menuEl)
      for (let i = 0; i < 5; i++) {
        core.onItemMount(0, i, mockItemElement())
      }

      core.handleMouseMove(150, 100, 0, 1)

      const lastState = stateChanges[stateChanges.length - 1]
      expect(lastState.activeMenus[0].focus).toBe(1)
    })

    it('opens submenus after delay', () => {
      const { core, stateChanges } = createCore()
      core.init()

      const menuEl = mockMenuElement()
      core.onMenuMount(0, menuEl)
      for (let i = 0; i < 5; i++) {
        core.onItemMount(0, i, mockItemElement())
      }

      // Hover over submenu item
      core.handleMouseMove(150, 100, 0, 4)

      // Advance timers to trigger submenu opening
      vi.advanceTimersByTime(150)

      const lastState = stateChanges[stateChanges.length - 1]
      expect(lastState.activeMenus).toHaveLength(2)
    })
  })

  describe('handleMenuMouseLeave', () => {
    it('clears focus on last menu only', () => {
      const { core, stateChanges } = createCore()
      core.init()

      const menuEl = mockMenuElement()
      core.onMenuMount(0, menuEl)
      for (let i = 0; i < 5; i++) {
        core.onItemMount(0, i, mockItemElement())
      }

      // Set focus
      core.handleKeydown('ArrowDown')

      // Mouse leave
      core.handleMenuMouseLeave(0)
      const lastState = stateChanges[stateChanges.length - 1]
      expect(lastState.activeMenus[0].focus).toBe(-1)
    })

    it('does nothing for SELECT behavior', () => {
      const { core, stateChanges } = createCore({
        behavior: MenuBehavior.SELECT,
      })
      core.init()

      const initialCount = stateChanges.length
      core.handleMenuMouseLeave(0)
      expect(stateChanges.length).toBe(initialCount)
    })
  })

  describe('handleScroll', () => {
    it('updates scrollPosition correctly', () => {
      const { core, stateChanges } = createCore()
      core.init()

      // Scroll to middle
      core.handleScroll(0, 50, 500, 300)
      let lastState = stateChanges[stateChanges.length - 1]
      expect(lastState.activeMenus[0].scrollPosition).toBe(0)

      // Scroll to top
      core.handleScroll(0, 0, 500, 300)
      lastState = stateChanges[stateChanges.length - 1]
      expect(lastState.activeMenus[0].scrollPosition).toBe(-1)

      // Scroll to bottom
      core.handleScroll(0, 200, 500, 300)
      lastState = stateChanges[stateChanges.length - 1]
      expect(lastState.activeMenus[0].scrollPosition).toBe(1)
    })
  })

  describe('handleResize', () => {
    it('recalculates all positions', () => {
      const { core, stateChanges, adapter } = createCore()
      core.init()

      const menuEl = mockMenuElement()
      core.onMenuMount(0, menuEl)

      const countBefore = stateChanges.length
      core.handleResize()

      expect(stateChanges.length).toBeGreaterThan(countBefore)
      expect(adapter.getBoundingClientRect).toHaveBeenCalled()
    })
  })

  describe('updateItems', () => {
    it('recalculates positions after items change', () => {
      const { core, stateChanges } = createCore()
      core.init()

      const menuEl = mockMenuElement()
      core.onMenuMount(0, menuEl)

      const countBefore = stateChanges.length
      core.updateItems([{ label: 'New Item', onClick: vi.fn() }])

      expect(stateChanges.length).toBeGreaterThan(countBefore)
    })

    it('drops a highlight the narrowed list can no longer support', () => {
      const { core } = createCore({ items: fourItems() })
      core.init()
      core.onMenuMount(0, mockMenuElement())

      // Highlight the fourth item, then narrow the list past it.
      for (let i = 0; i < 4; i++) core.handleKeydown('ArrowDown')
      expect(core.displayState.activeMenus[0].focus).toBe(3)

      core.updateItems(twoItems())

      expect(core.displayState.activeMenus[0].focus).toBe(-1)
    })

    it('leaves the arrow keys working after the list narrows', () => {
      const { core } = createCore({ items: fourItems() })
      core.init()
      core.onMenuMount(0, mockMenuElement())

      for (let i = 0; i < 4; i++) core.handleKeydown('ArrowDown')
      core.updateItems(twoItems())

      // Without the reset both of these are refused, because the stale index fails
      // `focus < menuLength - 1` and is out of range for `changeCurrentMenuFocus`.
      core.handleKeydown('ArrowDown')
      expect(core.displayState.activeMenus[0].focus).toBe(0)

      core.handleKeydown('ArrowDown')
      expect(core.displayState.activeMenus[0].focus).toBe(1)
    })

    it('keeps a highlight the new list still supports', () => {
      const { core } = createCore({ items: fourItems() })
      core.init()
      core.onMenuMount(0, mockMenuElement())

      core.handleKeydown('ArrowDown')
      expect(core.displayState.activeMenus[0].focus).toBe(0)

      core.updateItems(twoItems())

      expect(core.displayState.activeMenus[0].focus).toBe(0)
    })

    it('drops a highlight that now lands on a disabled item', () => {
      const { core } = createCore({ items: twoItems() })
      core.init()
      core.onMenuMount(0, mockMenuElement())

      core.handleKeydown('ArrowDown')
      core.handleKeydown('ArrowDown')
      expect(core.displayState.activeMenus[0].focus).toBe(1)

      core.updateItems([
        { label: 'One', onClick: vi.fn() },
        { label: 'Two', onClick: vi.fn(), disabled: true },
      ])

      expect(core.displayState.activeMenus[0].focus).toBe(-1)
    })
  })

  describe('setFocus', () => {
    it('moves the highlight and reports where it landed', () => {
      const { core } = createCore({ items: fourItems() })
      core.init()
      core.onMenuMount(0, mockMenuElement())

      expect(core.setFocus(2)).toBe(2)
      expect(core.focusedIndex).toBe(2)
    })

    it('skips a separator and reports the corrected index', () => {
      const { core } = createCore({
        items: [
          { label: 'One', onClick: vi.fn() },
          MENU_SEPARATOR,
          { label: 'Three', onClick: vi.fn() },
        ],
      })
      core.init()
      core.onMenuMount(0, mockMenuElement())

      // Asking for the separator settles on the next usable item instead.
      expect(core.setFocus(1)).toBe(2)
      expect(core.focusedIndex).toBe(2)
    })

    it('skips a disabled item', () => {
      const { core } = createCore({
        items: [
          { label: 'One', onClick: vi.fn() },
          { label: 'Two', onClick: vi.fn(), disabled: true },
          { label: 'Three', onClick: vi.fn() },
        ],
      })
      core.init()
      core.onMenuMount(0, mockMenuElement())

      expect(core.setFocus(1)).toBe(2)
    })

    it('refuses an index outside the list and leaves the highlight alone', () => {
      const { core } = createCore({ items: fourItems() })
      core.init()
      core.onMenuMount(0, mockMenuElement())

      core.setFocus(1)
      expect(core.setFocus(9)).toBe(1)
      expect(core.focusedIndex).toBe(1)
    })

    it('clears the highlight for -1', () => {
      const { core } = createCore({ items: fourItems() })
      core.init()
      core.onMenuMount(0, mockMenuElement())

      core.setFocus(2)
      expect(core.setFocus(-1)).toBe(-1)
      expect(core.focusedIndex).toBe(-1)
    })

    it('scrolls the highlight into view', () => {
      const { core, adapter } = createCore({ items: fourItems() })
      core.init()
      core.onMenuMount(0, mockMenuElement())
      core.onItemMount(0, 2, mockMenuElement())

      core.setFocus(2)
      expect(adapter.scrollIntoView).toHaveBeenCalled()
    })

    it('does not move DOM focus when takeFocus is false', () => {
      const { core, adapter } = createCore({
        items: fourItems(),
        takeFocus: false,
      })
      core.init()
      core.onMenuMount(0, mockMenuElement())
      core.onItemMount(0, 2, mockMenuElement())

      core.setFocus(2)
      expect(core.focusedIndex).toBe(2)
      expect(adapter.focus).not.toHaveBeenCalled()
    })

    it('does move DOM focus by default', () => {
      const { core, adapter } = createCore({ items: fourItems() })
      core.init()
      core.onMenuMount(0, mockMenuElement())
      core.onItemMount(0, 2, mockMenuElement())

      core.setFocus(2)
      expect(adapter.focus).toHaveBeenCalled()
    })
  })

  describe('destroy', () => {
    it('clears timeouts', () => {
      const { core, adapter } = createCore()
      core.init()

      // Trigger submenu opening to create a timeout
      const menuEl = mockMenuElement()
      core.onMenuMount(0, menuEl)
      for (let i = 0; i < 5; i++) {
        core.onItemMount(0, i, mockItemElement())
      }
      core.handleMouseMove(150, 100, 0, 4) // hover submenu item

      core.destroy()
      expect(adapter.clearTimeout).toHaveBeenCalled()
    })
  })

  describe('displayState', () => {
    it('returns current state', () => {
      const { core } = createCore()
      core.init()

      const state = core.displayState
      expect(state.activeMenus).toHaveLength(1)
      expect(state.clickedItem).toBeNull()
    })
  })

  describe('getMenuRole', () => {
    it('returns "menu" for MENU behavior', () => {
      const { core } = createCore({ behavior: MenuBehavior.MENU })
      expect(core.getMenuRole()).toBe('menu')
    })

    it('returns "listbox" for AUTOCOMPLETE behavior', () => {
      const { core } = createCore({
        behavior: MenuBehavior.AUTOCOMPLETE,
      })
      expect(core.getMenuRole()).toBe('listbox')
    })
  })

  describe('getGutterVisibility', () => {
    it('shows left gutter when items have checked state', () => {
      const items: MenuItem[] = [
        { label: 'A', onClick: vi.fn(), checked: true },
        { label: 'B', onClick: vi.fn() },
      ]
      const { core } = createCore({ items })
      core.init()

      const result = core.getGutterVisibility([])
      expect(result.showLeftGutter).toBe(true)
      expect(result.showRightGutter).toBe(false)
    })

    it('shows right gutter when items have submenus', () => {
      const { core } = createCore()
      core.init()

      const result = core.getGutterVisibility([])
      expect(result.showRightGutter).toBe(true)
    })
  })
})

// Helper functions for creating mock DOM elements
function mockMenuElement(): HTMLElement {
  const el = document.createElement('div')
  const child = document.createElement('ul')
  el.appendChild(child)
  // Mock showPopover
  el.showPopover = vi.fn()
  return el
}

function mockItemElement(): HTMLElement {
  const el = document.createElement('li')
  return el
}
