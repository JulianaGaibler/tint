<!-- eslint-disable svelte/require-each-key -->
<script lang="ts" module>
  /* eslint-disable no-import-assign */
  // Re-export all types and constants from core
  export {
    WINDOW_PADDING,
    TOP_MENU_OFFSET,
    LEFT_MENU_OFFSET,
    MENU_SEPARATOR,
    MenuBehavior,
    type MenuBehaviorType,
    type MenuItem,
    type Vec2,
    type ActiveMenu,
    type ActiveMenuMeta,
  } from './core/types'
  /* eslint-enable no-import-assign */
</script>

<script lang="ts">
  import {
    type Vec2,
    type MenuBehaviorType,
    type MenuItem,
    type ActiveMenu,
    type MenuDisplayState,
    MenuBehavior,
  } from './core/types'
  import { MenuCore } from './core/MenuCore'
  import ArrowIcon from '@lib/icons/14-chevron-menu-right.svg?raw'
  import ArrowUp from '@lib/icons/14-chevron-menu-up.svg?raw'
  import ArrowDown from '@lib/icons/14-chevron-menu-down.svg?raw'
  import CheckIcon from '@lib/icons/14-check.svg?raw'
  import { onMount, onDestroy, tick, untrack } from 'svelte'
  import * as focusTrap from 'focus-trap'
  import { registerDismissLayer } from '@lib/dismiss/stack.js'

  interface Props {
    id?: string
    anchorRef?: HTMLElement
    anchor?: Vec2 | undefined
    /**
     * A rectangle to anchor to, for a caller with no element to point at. A
     * text caret is the motivating case: `coordsAtPos` gives a rect with the
     * caret's height, so the menu opens below the line rather than over it.
     * Takes precedence over `anchor`, and is outranked by `anchorRef`.
     */
    anchorRect?: DOMRect | undefined
    items: MenuItem[]
    behavior: MenuBehaviorType
    size?: 'tight' | 'large'
    animated?: boolean
    closeOnClick?: boolean
    hide: () => void
    /**
     * What the dismissal stack calls to close this menu, when the host wants
     * something other than `hide`. A picker that keeps its typed text when the
     * menu closes on its own, but discards it when the user asks for the menu
     * to go away, says so here.
     */
    dismiss?: () => void
    /**
     * When false, the menu never moves DOM focus and never restores it on
     * teardown. A host that owns the caret needs this, and has to render
     * `aria-activedescendant` itself. Items also activate on mousedown rather
     * than click, so the press cannot move focus before the activation runs.
     */
    takeFocus?: boolean
    /**
     * When false, the menu binds no key handler and the host drives it through
     * `highlightedIndex`. When true, a keystroke already handled elsewhere is
     * still ignored.
     */
    handleKeys?: boolean
    /**
     * When false, no click-catching overlay is rendered, so pointer events
     * reach whatever is behind the menu. The host then owns dismissing it.
     */
    overlay?: boolean
    onItemFocus?: (item: MenuItem) => void
    recalculatePosition?: () => void
    lastActiveElement?: HTMLElement
    /**
     * Id of the highlighted item, for a host rendering `aria-activedescendant`.
     * Read only.
     */
    activeItemId?: string | undefined
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
    highlightedIndex?: number
  }

  let {
    id = undefined,
    anchorRef = undefined,
    anchor = undefined,
    anchorRect = undefined,
    items,
    behavior,
    size = 'tight',
    animated = false,
    closeOnClick = true,
    hide,
    dismiss = undefined,
    takeFocus = true,
    handleKeys = true,
    overlay = true,
    onItemFocus = undefined,
    recalculatePosition = $bindable(undefined),
    lastActiveElement = $bindable(undefined),
    activeItemId = $bindable(undefined),
    highlightedIndex = $bindable(-1),
  }: Props = $props()

  // --------
  // Component State
  // --------

  let displayState: MenuDisplayState = $state({
    activeMenus: [],
    clickedItem: null,
  })
  let overlayRef: HTMLElement | null = $state(null)
  let trap: focusTrap.FocusTrap | null = null
  let core: MenuCore | null = $state(null)

  // Derived values
  let displayActiveMenus = $derived(displayState.activeMenus)
  let clickedItem = $derived(displayState.clickedItem)
  let menuRole = $derived(
    behavior === MenuBehavior.AUTOCOMPLETE ? 'listbox' : 'menu',
  )

  // A listbox holds options, not menu items, so the two have to agree. `aria-selected` is how an
  // option carries the highlight, where a menu item uses `aria-checked` for something else
  // entirely.
  let itemRole = $derived(
    behavior === MenuBehavior.AUTOCOMPLETE ? 'option' : undefined,
  )

  // Fixed for the life of the component, so ids stay stable while items change under them.
  const fallbackId = `tint-menu-${Math.random().toString(36).slice(2, 8)}`
  const baseId = $derived(id ?? fallbackId)

  /** Stable id per item, so a host that owns focus can name the active one. */
  function itemId(menuIndex: number, itemIndex: number): string {
    return `${baseId}-item-${menuIndex}-${itemIndex}`
  }

  // Reconciles the highlight between the host and the core, in one place because they can both
  // move it and the direction has to be worked out rather than assumed.
  //
  // Two separate effects cannot do this. A mirror-outward effect runs once on mount, sees the
  // core at -1 before it has been told anything, and overwrites a value the host set in the same
  // tick as it opened the menu. Tracking what was last seen from each side is what says who
  // moved.
  let lastFromCore = -1
  let lastFromHost = -1

  $effect(() => {
    const menus = displayState.activeMenus
    const coreIndex = menus[menus.length - 1]?.focus ?? -1
    const hostIndex = highlightedIndex
    if (!core) return

    // The core moved it, from an arrow key it handled itself or from hover.
    if (coreIndex !== lastFromCore) {
      lastFromCore = coreIndex
      lastFromHost = coreIndex
      if (hostIndex !== coreIndex) highlightedIndex = coreIndex
      return
    }

    // The host moved it.
    if (hostIndex !== lastFromHost) {
      lastFromHost = hostIndex
      const settled = core.setFocus(hostIndex)
      lastFromCore = settled
      // Only when the request was corrected, so an accepted write is never reassigned.
      if (settled !== hostIndex) {
        lastFromHost = settled
        highlightedIndex = settled
      }
    }
  })

  // Mirrors the highlighted item's id outward, which is what a host puts in
  // `aria-activedescendant` when the menu is not taking focus. Undefined when nothing is
  // highlighted, which is also what that attribute wants.
  $effect(() => {
    const menus = displayState.activeMenus
    const depth = menus.length - 1
    const current = menus[depth]
    const next =
      current && current.focus >= 0 ? itemId(depth, current.focus) : undefined
    if (next !== activeItemId) activeItemId = next
  })

  // --------
  // DOM Adapter
  // --------

  const adapter = {
    getBoundingClientRect(el: HTMLElement) {
      return el.getBoundingClientRect()
    },
    getWindowDimensions() {
      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      }
    },
    focus(el: HTMLElement, opts?: { preventScroll?: boolean }) {
      el.focus(opts)
    },
    scrollIntoView(
      el: HTMLElement,
      opts?: {
        block?: 'start' | 'center' | 'end' | 'nearest'
        inline?: 'start' | 'center' | 'end' | 'nearest'
      },
    ) {
      el.scrollIntoView(opts)
    },
    showPopover(el: HTMLElement) {
      el.showPopover()
    },
    async scheduleAfterRender(cb: () => void) {
      await tick()
      cb()
    },
    setTimeout(cb: () => void, ms: number) {
      return window.setTimeout(cb, ms) as unknown as number
    },
    clearTimeout(id: number) {
      window.clearTimeout(id)
    },
  }

  // --------
  // Proxy Handlers for DOM Reference Management
  // --------

  const setMenuRefHandler = {
    set: function (_target: unknown, prop: string, value: HTMLElement | null) {
      if (value === undefined) return true
      const menu = parseInt(prop, 10)
      core?.onMenuMount(menu, value)
      return true
    },
  }
  const setMenuRefProxy = new Proxy({}, setMenuRefHandler) as {
    [key: number]: HTMLElement | null
  }

  const setItemRefHandler = {
    set: function (_obj: unknown, prop: string, value: HTMLElement | null) {
      if (value === undefined) return true
      const [i, j] = prop.split('-')
      const menu = parseInt(i, 10)
      const item = parseInt(j, 10)
      core?.onItemMount(menu, item, value)
      return true
    },
  }
  const setItemRefProxy = new Proxy({}, setItemRefHandler) as {
    [key: string]: HTMLElement | null
  }

  // --------
  // Focus Trap Helpers
  // --------

  function getTrapElements(): HTMLElement[] {
    return [
      ...(overlayRef ? [overlayRef] : []),
      ...(core?.getMenuElements() || []),
    ]
  }

  // --------
  // Lifecycle
  // --------

  // Watch for changes to items prop
  $effect(() => {
    const _itemsRef = items
    if (core) {
      core.updateItems(items)
    }
  })

  onMount(() => {
    // Determine anchor position. An element wins, because its rect can be re-read as it moves.
    let resolvedRect: DOMRect | null = null
    if (anchorRef) {
      resolvedRect = anchorRef.getBoundingClientRect()
    } else if (anchorRect) {
      resolvedRect = anchorRect
    } else if (anchor) {
      const rect = new DOMRect()
      rect.x = anchor.x
      rect.y = anchor.y
      resolvedRect = rect
    }

    if (!resolvedRect) return

    // Create core instance
    core = new MenuCore(
      {
        behavior,
        closeOnClick,
        items,
        anchorRect: resolvedRect,
        takeFocus,
        hide,
        onItemFocus,
        onStateChange: (state: MenuDisplayState) => {
          displayState = state
          tick().then(() => {
            trap?.updateContainerElements(getTrapElements())
          })
        },
        onAnimationEnd: (menu: number, item: number, callback: () => void) => {
          // Use cached item ref instead of DOM queries
          tick().then(() => {
            const itemEl = core?.getItemRef(menu, item)
            if (!itemEl) {
              callback()
              return
            }
            const handler = () => {
              callback()
              itemEl.removeEventListener('animationend', handler)
            }
            itemEl.addEventListener('animationend', handler)
          })
        },
      },
      adapter,
    )

    core.init()

    // Set up recalculatePosition callback for parent
    recalculatePosition = () => {
      if (!core) return
      if (!anchorRef && anchorRect) {
        core.updateAnchorRect(anchorRect)
        core.handleAnchorMove()
        return
      }
      core.handleAnchorMove(anchorRef, anchor)
    }

    // Set up focus management after initial render
    tick().then(() => {
      lastActiveElement = document.activeElement as HTMLElement

      if (behavior === MenuBehavior.AUTOCOMPLETE || !takeFocus) {
        return
      }

      trap = focusTrap.createFocusTrap(getTrapElements(), {
        clickOutsideDeactivates: false,
        escapeDeactivates: false,
        allowOutsideClick: false,
        returnFocusOnDeactivate: false,
        fallbackFocus: '.context_menu ul',
        onPostDeactivate: () => {
          lastActiveElement?.focus()
        },
      })
      trap?.activate()
    })
  })

  /**
   * A menu is on the dismissal stack for as long as it is mounted, since it
   * only exists while it is open.
   *
   * Skipped when the host took the keys, because a host that drives the menu
   * through `highlightedIndex` also decides what Escape means. `SuggestionMenu`
   * is the case: the key belongs to the document the caret is in.
   */
  // Read once, because whether the host owns the keys is decided when the menu is created and a
  // menu that changed hands mid-life would have to re-register anyway.
  const releaseLayer = untrack(() => handleKeys)
    ? registerDismissLayer({
        dismiss: () => (dismiss ?? hide)(),
        modal: false,
        label: 'Menu',
      })
    : () => {}

  onDestroy(() => {
    releaseLayer()
    core?.destroy()
    trap?.deactivate()

    // Focus never left, so putting it back would only scroll the page to wherever it already is.
    if (behavior === MenuBehavior.AUTOCOMPLETE && takeFocus) {
      lastActiveElement?.focus({ preventScroll: true })
    }
  })

  // --------
  // Event Handlers (thin wrappers that delegate to core)
  // --------

  const handleKeydown = (event: KeyboardEvent) => {
    if (!core || !handleKeys) return
    // Someone upstream already acted on this keystroke, so acting again would apply it twice.
    if (event.defaultPrevented) return
    const result = core.handleKeydown(event.key)
    if (result.preventDefault) event.preventDefault()
    if (result.stopPropagation) event.stopPropagation()
  }

  const handleMouseUp = () => {
    core?.handleMouseUp()
  }

  const updateMousePosition = (ev: MouseEvent) => {
    if (!core) return
    const target = (ev.target as HTMLElement)?.closest<HTMLElement>(
      '[data-menu][data-item]',
    )
    if (!target) return
    const dataset = target.dataset
    const menu = parseInt(dataset.menu!, 10)
    const item = parseInt(dataset.item!, 10)
    core.handleMouseMove(ev.clientX, ev.clientY, menu, item)
  }

  const handleResize = () => {
    core?.handleResize()
  }

  /**
   * Follows an element anchor when anything between it and the viewport
   * scrolls.
   *
   * Scroll does not bubble, so a listener on `window` misses a scrolling
   * container between the anchor and the page. Capturing on the document
   * catches all of them.
   *
   * Only an element anchor is followed. A point or a rect was measured once
   * against the viewport, so re-reading it after a scroll and compensating
   * again would move the menu by the scroll offset twice. A caller anchoring
   * that way owns dismissing or repositioning it.
   */
  const handleScrollAnywhere = () => {
    if (!core || !anchorRef) return
    core.handleAnchorMove(anchorRef, undefined)
  }

  onMount(() => {
    document.addEventListener('scroll', handleScrollAnywhere, {
      capture: true,
      passive: true,
    })
    return () => {
      document.removeEventListener('scroll', handleScrollAnywhere, {
        capture: true,
      })
    }
  })
</script>

<svelte:window
  onkeydown={handleKeydown}
  onresize={handleResize}
  onmouseup={handleMouseUp}
  onmousemove={updateMousePosition}
/>

{#if overlay}
  <div
    role="presentation"
    onclick={() => hide()}
    class="fullscreen_overlay"
    bind:this={overlayRef}
    oncontextmenu={(e) => {
      e.preventDefault()
      hide()
    }}
  ></div>
{/if}
<!-- eslint-disable-next-line svelte/require-each-key -->
{#each displayActiveMenus as { menuPath, position, scrollPosition }, i}
  {@const gutters = core?.getGutterVisibility(menuPath) ?? {
    showLeftGutter: false,
    showRightGutter: false,
  }}
  {@const showLeftGutter = gutters.showLeftGutter}
  {@const showRightGutter = gutters.showRightGutter}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={setMenuRefProxy[i]}
    popover="manual"
    onmouseleave={() => core?.handleMenuMouseLeave(i)}
    class={`context_menu tint--card ${size} ${animated ? `animated ${position.animationOrigin}` : ''}`}
    class:select={behavior}
    style:left={`${position.x}px`}
    style:top={`${position.y}px`}
    style:height={position.height ? `${position.height}px` : 'auto'}
    style:min-width={position.minWidth ? `${position.minWidth}px` : 'auto'}
  >
    {#if position.height && scrollPosition > -1}
      <div class="overflow_top" aria-hidden="true">
        {@html ArrowUp}
      </div>
    {/if}
    {#if position.height && scrollPosition < 1}
      <div class="overflow_bottom" aria-hidden="true">
        {@html ArrowDown}
      </div>
    {/if}
    <ul
      onscroll={(e) => {
        const el = e.target as HTMLElement
        core?.handleScroll(i, el.scrollTop, el.scrollHeight, el.clientHeight)
      }}
      {id}
      role={menuRole}
      tabIndex={-1}
    >
      <!-- eslint-disable-next-line svelte/require-each-key -->
      {#each core?.getMenuItemMeta(menuPath, i) ?? [] as info, j}
        {#if typeof info.item === 'object' && 'label' in info.item}
          {@const hint = info.hasSubMenu ? undefined : info.item.hint}
          <li
            class={`item item_default ${
              clickedItem && clickedItem[0] === i && clickedItem[1] === j
                ? 'clicked'
                : ''
            }`}
            class:hide-left-gutter={!showLeftGutter}
            class:hide-right-gutter={!showRightGutter}
            class:hide-all-gutters={!showLeftGutter && !showRightGutter}
            class:with-hint={!!hint}
            id={itemId(i, j)}
            role={itemRole ??
              (info.isChecked === undefined ? 'menuitem' : 'menuitemcheckbox')}
            aria-disabled={info.isDisabled}
            aria-haspopup={info.hasSubMenu || undefined}
            aria-expanded={info.hasSubMenu ? info.subMenuOpen : undefined}
            aria-checked={itemRole ? undefined : info.isChecked}
            aria-selected={itemRole ? info.selected : undefined}
            tabIndex={info.selected && !info.isDisabled ? 0 : -1}
            data-selected={info.selected}
            onclick={takeFocus ? () => core?.handleItemClick(i, j) : undefined}
            onmousedown={takeFocus
              ? undefined
              : (event) => {
                  // Activating on mousedown, and stopping it, keeps focus where it is. Waiting
                  // for click means the press has already moved focus, and a pointer that drifts
                  // off the item before release cancels an activation the person believed they
                  // had made.
                  event.preventDefault()
                  core?.handleItemClick(i, j)
                }}
            bind:this={setItemRefProxy[`${i}-${j}`]}
            data-menu={i}
            data-item={j}
          >
            {#if info.isChecked === true && showLeftGutter}{@html CheckIcon}{/if}
            {#if info.item.icon}<span class="item-icon" aria-hidden="true"
                >{@html info.item.icon}</span
              >{/if}
            <span
              >{info.item.label}{#if hint}<span
                  class="item-hint tint--type-ui-small">{hint}</span
                >{/if}</span
            >
            {#if info.hasSubMenu && showRightGutter}{@html ArrowIcon}{/if}
          </li>
        {:else}
          <!-- <li aria-hidden=true><hr></li> -->
          <hr />
        {/if}
      {/each}
    </ul>
  </div>
{/each}

<style lang="sass">
.fullscreen_overlay
  position: fixed
  inset-block-start: 0
  inset-inline-start: 0
  width: 100%
  height: 100%
  overflow: hidden
  z-index: 99

@media print
  .fullscreen_overlay
    display: none

.context_menu
  z-index: 100
  position: absolute
  display: flex
  flex-direction: column
  min-width: 172px
  border-radius: var(--tint-radius-menu)
  padding: var(--tint-size-4)
  overflow: hidden
  inset: unset
  color: var(--tint-text)

.context_menu:global(.select)
  min-width: auto

.context_menu.animated
  animation: menu-appear 350ms cubic-bezier(0.42, 1.67, 0.21, 0.90) forwards

.context_menu.animated.top-left
  transform-origin: top left

.context_menu.animated.top-right
  transform-origin: top right

.context_menu.animated.bottom-left
  transform-origin: bottom left

.context_menu.animated.bottom-right
  transform-origin: bottom right

.context_menu :global(> ul)
  margin: 0
  padding: 0
  list-style: none
  outline: none
  overflow-y: scroll
  overflow-x: hidden
  overscroll-behavior: contain
  scrollbar-width: none
  -ms-overflow-style: none

.context_menu :global(> ul)::-webkit-scrollbar
  display: none

.context_menu :global(hr)
  margin: var(--tint-size-4)
  border: 0
  border-block-start: 1px solid var(--tint-card-border)

.context_menu li
  text-indent: 0
  list-style-type: none

@media print
  .context_menu
    display: none

.overflow_top,
.overflow_bottom
  position: absolute
  inset-inline-start: 0
  inset-inline-end: 0
  pointer-events: none
  border-width: 1px
  border-color: rgba(0, 0, 0, 0.05)
  opacity: 0.8
  font-size: 6px
  text-align: center
  padding-inline: var(--tint-size-4)
  color: grey
  background: var(--tint-bg)
  height: var(--tint-size-12)
  display: flex
  justify-content: center

.overflow_top
  inset-block-start: 0
  border-block-end-style: solid
  padding-block-start: var(--tint-size-4)
  align-items: flex-start

.overflow_bottom
  inset-block-end: 0
  border-block-start-style: solid
  padding-block-end: var(--tint-size-4)
  align-items: flex-end

.item
  padding: 6px
  padding-inline-end: var(--tint-size-8)
  outline: none
  user-select: none
  border-radius: var(--tint-size-4)
  white-space: nowrap

.item[data-selected="true"]
  background: var(--tint-action-secondary-hover)

@media (forced-colors: active)
  .item[data-selected="true"]
    background: ButtonText
    color: ButtonFace

.item:global(.clicked)
  animation: clicked_animation 200ms linear

.item[aria-disabled="true"]
  opacity: 0.5
  cursor: default
  animation: none
  background: unset

@media (forced-colors: active)
  .item[aria-disabled="true"]
    color: GrayText

.item_default
  display: grid
  grid-template-columns: 14px auto minmax(0, 1fr) minmax(14px, auto)
  gap: var(--tint-size-4)
  align-items: center

.item_default :global(> span:not(.item-icon))
  grid-column: 3 / 4
  // The label and its hint share this cell, so the gutter variants below place one thing.
  display: flex
  align-items: center
  gap: var(--tint-size-16)
  min-inline-size: 0

// Pushed to the end so hints line up with each other, not after labels of different lengths.
.item_default :global(.item-hint)
  margin-inline-start: auto
  color: var(--tint-text-secondary)
  white-space: nowrap

.item_default :global(.item-icon)
  grid-column: 2 / 3
  display: flex
  align-items: center
  justify-content: center
  font-size: 14px

// Hide left gutter only
.item_default.hide-left-gutter
  grid-template-columns: auto minmax(0, 1fr) minmax(14px, auto)

.item_default.hide-left-gutter :global(.item-icon)
  grid-column: 1 / 2

.item_default.hide-left-gutter :global(> span:not(.item-icon))
  grid-column: 2 / 3

// Hide right gutter only
.item_default.hide-right-gutter
  grid-template-columns: 14px auto minmax(0, 1fr)

.item_default.hide-right-gutter :global(> span:not(.item-icon))
  grid-column: 3 / 4

// Hide both gutters
.item_default.hide-all-gutters
  grid-template-columns: auto minmax(0, 1fr)

.item_default.hide-all-gutters :global(> span:not(.item-icon))
  grid-column: 2 / 3

.item_default.hide-all-gutters :global(.item-icon)
  grid-column: 1 / 2

// Reaching the last line puts hints at the row end whichever gutters the menu draws, including the
// arrow gutter that any one submenu reserves for the whole menu. Only the end line moves, so the
// gutter variants above still set the start.
.item_default.with-hint :global(> span:not(.item-icon))
  grid-column-end: -1

.context_menu.large .item
  padding-block: var(--tint-size-12)
  padding-inline: var(--tint-size-8)
  gap: var(--tint-size-4)

.context_menu.large .item.hide-all-gutters
  padding-block: var(--tint-size-12)
  padding-inline: var(--tint-size-16)
  gap: var(--tint-size-8)

@keyframes clicked_animation
  0%, 40%
    background: transparent
  41%, 100%
    background: var(--tint-action-secondary-hover)

@keyframes menu-appear
  0%
    opacity: 0
    transform: scale(1)
  1%
    opacity: 0
    transform: scale(0.75)
  100%
    opacity: 1
    transform: scale(1)
</style>
