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
  import ArrowIcon from '../../icons/14-chevron-menu-right.svg?raw'
  import ArrowUp from '../../icons/14-chevron-menu-up.svg?raw'
  import ArrowDown from '../../icons/14-chevron-menu-down.svg?raw'
  import CheckIcon from '../../icons/14-check.svg?raw'
  import { onMount, onDestroy, tick } from 'svelte'
  import * as focusTrap from 'focus-trap'

  interface Props {
    id?: string
    anchorRef?: HTMLElement
    anchor?: Vec2 | undefined
    items: MenuItem[]
    behavior: MenuBehaviorType
    size?: 'tight' | 'large'
    animated?: boolean
    closeOnClick?: boolean
    hide: () => void
    onItemFocus?: (item: MenuItem) => void
    recalculatePosition?: () => void
    lastActiveElement?: HTMLElement
  }

  let {
    id = undefined,
    anchorRef = undefined,
    anchor = undefined,
    items,
    behavior,
    size = 'tight',
    animated = false,
    closeOnClick = true,
    hide,
    onItemFocus = undefined,
    recalculatePosition = $bindable(undefined),
    lastActiveElement = $bindable(undefined),
  }: Props = $props()

  // --------
  // Component State
  // --------

  let displayState: MenuDisplayState = $state({
    activeMenus: [],
    clickedItem: null,
  })
  let overlayRef: HTMLElement | null = null
  let trap: focusTrap.FocusTrap | null = null
  let core: MenuCore | null = null

  // Derived values
  let displayActiveMenus = $derived(displayState.activeMenus)
  let clickedItem = $derived(displayState.clickedItem)
  let menuRole = $derived(
    behavior === MenuBehavior.AUTOCOMPLETE ? 'listbox' : 'menu',
  )

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
      opts?: { block?: string; inline?: string },
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
    // Determine anchor position
    let anchorRect: DOMRect | null = null
    if (anchorRef) {
      anchorRect = anchorRef.getBoundingClientRect()
    } else if (anchor) {
      const rect = new DOMRect()
      rect.x = anchor.x
      rect.y = anchor.y
      anchorRect = rect
    }

    if (!anchorRect) return

    // Create core instance
    core = new MenuCore(
      {
        behavior,
        closeOnClick,
        items,
        anchorRect,
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
      core?.handleAnchorMove(anchorRef, anchor)
    }

    // Set up focus management after initial render
    tick().then(() => {
      lastActiveElement = document.activeElement as HTMLElement

      if (behavior === MenuBehavior.AUTOCOMPLETE) {
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

  onDestroy(() => {
    core?.destroy()
    trap?.deactivate()

    if (behavior === MenuBehavior.AUTOCOMPLETE) {
      lastActiveElement?.focus()
    }
  })

  // --------
  // Event Handlers (thin wrappers that delegate to core)
  // --------

  const handleKeydown = (event: KeyboardEvent) => {
    if (!core) return
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
</script>

<svelte:window
  onkeydown={handleKeydown}
  onresize={handleResize}
  onmouseup={handleMouseUp}
  onmousemove={updateMousePosition}
/>

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
          <li
            class={`item item_default ${
              clickedItem && clickedItem[0] === i && clickedItem[1] === j
                ? 'clicked'
                : ''
            }`}
            class:hide-left-gutter={!showLeftGutter}
            class:hide-right-gutter={!showRightGutter}
            class:hide-all-gutters={!showLeftGutter && !showRightGutter}
            role={info.isChecked === undefined
              ? 'menuitem'
              : 'menuitemcheckbox'}
            aria-disabled={info.isDisabled}
            aria-haspopup={info.hasSubMenu || undefined}
            aria-expanded={info.hasSubMenu ? info.subMenuOpen : undefined}
            aria-checked={info.isChecked}
            tabIndex={info.selected && !info.isDisabled ? 0 : -1}
            data-selected={info.selected}
            onclick={() => core?.handleItemClick(i, j)}
            bind:this={setItemRefProxy[`${i}-${j}`]}
            data-menu={i}
            data-item={j}
          >
            {#if info.isChecked === true && showLeftGutter}{@html CheckIcon}{/if}
            {#if info.item.icon}<span class="item-icon" aria-hidden="true"
                >{@html info.item.icon}</span
              >{/if}
            <span>{info.item.label}</span>
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

<style>.fullscreen_overlay {
  position: fixed;
  inset-block-start: 0;
  inset-inline-start: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 99;
}

@media print {
  .fullscreen_overlay {
    display: none;
  }
}
.context_menu {
  z-index: 100;
  position: absolute;
  display: flex;
  flex-direction: column;
  min-width: 172px;
  border-radius: var(--tint-radius-menu);
  padding: var(--tint-size-4);
  overflow: hidden;
  inset: unset;
  color: var(--tint-text);
}

.context_menu:global(.select) {
  min-width: auto;
}

.context_menu.animated {
  animation: menu-appear 350ms cubic-bezier(0.42, 1.67, 0.21, 0.9) forwards;
}

.context_menu.animated.top-left {
  transform-origin: top left;
}

.context_menu.animated.top-right {
  transform-origin: top right;
}

.context_menu.animated.bottom-left {
  transform-origin: bottom left;
}

.context_menu.animated.bottom-right {
  transform-origin: bottom right;
}

.context_menu :global(> ul) {
  margin: 0;
  padding: 0;
  list-style: none;
  outline: none;
  overflow-y: scroll;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.context_menu :global(> ul)::-webkit-scrollbar {
  display: none;
}

.context_menu :global(hr) {
  margin: var(--tint-size-4);
  border: 0;
  border-block-start: 1px solid var(--tint-card-border);
}

.context_menu li {
  text-indent: 0;
  list-style-type: none;
}

@media print {
  .context_menu {
    display: none;
  }
}
.overflow_top,
.overflow_bottom {
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  pointer-events: none;
  border-width: 1px;
  border-color: rgba(0, 0, 0, 0.05);
  opacity: 0.8;
  font-size: 6px;
  text-align: center;
  padding-inline: var(--tint-size-4);
  color: grey;
  background: var(--tint-bg);
  height: var(--tint-size-12);
  display: flex;
  justify-content: center;
}

.overflow_top {
  inset-block-start: 0;
  border-block-end-style: solid;
  padding-block-start: var(--tint-size-4);
  align-items: flex-start;
}

.overflow_bottom {
  inset-block-end: 0;
  border-block-start-style: solid;
  padding-block-end: var(--tint-size-4);
  align-items: flex-end;
}

.item {
  padding: 6px;
  padding-inline-end: var(--tint-size-8);
  outline: none;
  user-select: none;
  border-radius: var(--tint-size-4);
  white-space: nowrap;
}

.item[data-selected=true] {
  background: var(--tint-action-secondary-hover);
}

@media (forced-colors: active) {
  .item[data-selected=true] {
    background: ButtonText;
    color: ButtonFace;
  }
}
.item:global(.clicked) {
  animation: clicked_animation 200ms linear;
}

.item[aria-disabled=true] {
  opacity: 0.5;
  cursor: default;
  animation: none;
  background: unset;
}

@media (forced-colors: active) {
  .item[aria-disabled=true] {
    color: GrayText;
  }
}
.item_default {
  display: grid;
  grid-template-columns: 14px auto minmax(0, 1fr) minmax(14px, auto);
  gap: var(--tint-size-4);
  align-items: center;
}

.item_default :global(> span:not(.item-icon)) {
  grid-column: 3/4;
}

.item_default :global(.item-icon) {
  grid-column: 2/3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.item_default.hide-left-gutter {
  grid-template-columns: auto minmax(0, 1fr) minmax(14px, auto);
}

.item_default.hide-left-gutter :global(.item-icon) {
  grid-column: 1/2;
}

.item_default.hide-left-gutter :global(> span:not(.item-icon)) {
  grid-column: 2/3;
}

.item_default.hide-right-gutter {
  grid-template-columns: 14px auto minmax(0, 1fr);
}

.item_default.hide-right-gutter :global(> span:not(.item-icon)) {
  grid-column: 3/4;
}

.item_default.hide-all-gutters {
  grid-template-columns: auto minmax(0, 1fr);
}

.item_default.hide-all-gutters :global(> span:not(.item-icon)) {
  grid-column: 2/3;
}

.item_default.hide-all-gutters :global(.item-icon) {
  grid-column: 1/2;
}

.context_menu.large .item {
  padding-block: var(--tint-size-12);
  padding-inline: var(--tint-size-8);
  gap: var(--tint-size-4);
}

.context_menu.large .item.hide-all-gutters {
  padding-block: var(--tint-size-12);
  padding-inline: var(--tint-size-16);
  gap: var(--tint-size-8);
}

@keyframes clicked_animation {
  0%, 40% {
    background: transparent;
  }
  41%, 100% {
    background: var(--tint-action-secondary-hover);
  }
}
@keyframes menu-appear {
  0% {
    opacity: 0;
    transform: scale(1);
  }
  1% {
    opacity: 0;
    transform: scale(0.75);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}</style>
