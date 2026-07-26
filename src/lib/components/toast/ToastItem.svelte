<script lang="ts">
  import type { ToastData, ToastPosition } from './types.js'
  import { toast } from '../../stores/toast.js'
  import LoadingIndicator from '../LoadingIndicator.svelte'
  import Button from '../Button.svelte'
  import IconCloseSmall from '@lib/icons/14-close.svg?raw'

  interface Props {
    toastData: ToastData
    expanded: boolean
    position: ToastPosition
    visibleToasts: number
    activeHeights: { id: number; height: number }[]
    setHeight: (id: number, height: number) => void
    removeHeight: (id: number) => void
    defaultCloseButton: boolean
    gap: number
    defaultDuration: number
    frontToastHeight: number
    onSwipeStart?: () => void
    onSwipeEnd?: () => void
    onRemoveStart?: () => void
    onRemoveEnd?: () => void
  }

  let {
    toastData,
    expanded,
    position,
    visibleToasts,
    activeHeights,
    setHeight,
    removeHeight,
    defaultCloseButton,
    gap,
    defaultDuration,
    frontToastHeight,
    onSwipeStart,
    onSwipeEnd,
    onRemoveStart,
    onRemoveEnd,
  }: Props = $props()

  let toastRef: HTMLLIElement | undefined = $state(undefined)
  let mounted = $state(false)
  let removing = $state(false)
  let swiping = $state(false)
  let swipeOut: 'left' | 'right' | null = $state(null)
  let initialHeight = $state(0)
  let offsetBeforeRemove = $state(0)

  const isTop = $derived(position.startsWith('top'))
  const lift = $derived(isTop ? 1 : -1)
  const showCloseButton = $derived(toastData.closeButton ?? defaultCloseButton)
  const toastDuration = $derived(toastData.duration ?? defaultDuration)

  // Timer state
  let remainingTime = $state(0)
  let lastTickTime = $state(0)
  let timerPaused = $state(false)
  let timerRafId: number | undefined

  // displayIndex: position in active (non-removed) heights array
  const displayIndex = $derived(
    activeHeights.findIndex((h) => h.id === toastData.id),
  )

  // Frozen displayIndex for use during removal animation
  let frozenDisplayIndex = $state(0)
  $effect(() => {
    if (displayIndex >= 0) frozenDisplayIndex = displayIndex
  })

  const effectiveDisplayIndex = $derived(
    displayIndex === -1 ? frozenDisplayIndex : displayIndex,
  )

  // Compute offset from activeHeights (sum of heights before this toast + gaps)
  // When displayIndex is -1 (removing), returns 0 — template uses offsetBeforeRemove instead
  const offset = $derived.by(() => {
    const idx = displayIndex
    if (idx === -1) return 0
    let total = 0
    for (let i = 0; i < idx; i++) {
      total += activeHeights[i].height + gap
    }
    return total
  })

  // Temporarily set height: auto to measure natural height,
  // then restore to let CSS control it via data attributes
  $effect(() => {
    if (!toastRef) return

    // Save current height style
    const prevHeight = toastRef.style.height

    // Temporarily set height: auto to measure natural (unclamped) height
    toastRef.style.height = 'auto'
    const newHeight = toastRef.getBoundingClientRect().height

    // Restore previous height
    toastRef.style.height = prevHeight

    // Store natural height
    initialHeight = newHeight
    setHeight(toastData.id, newHeight)

    // Mark as mounted after measurement
    requestAnimationFrame(() => {
      mounted = true
    })
  })

  // Auto-close timer
  $effect(() => {
    if (toastData.type === 'loading' || toastData.delete) return

    remainingTime = toastDuration
    lastTickTime = Date.now()

    function tick() {
      if (timerPaused) {
        timerRafId = requestAnimationFrame(tick)
        return
      }
      const now = Date.now()
      remainingTime -= now - lastTickTime
      lastTickTime = now
      if (remainingTime <= 0) {
        toastData.onAutoClose?.(toastData)
        handleDelete()
        return
      }
      timerRafId = requestAnimationFrame(tick)
    }
    timerRafId = requestAnimationFrame(tick)

    return () => {
      if (timerRafId !== undefined) cancelAnimationFrame(timerRafId)
    }
  })

  // Pause on document hidden
  $effect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        timerPaused = true
      } else {
        lastTickTime = Date.now()
        timerPaused = false
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  // Pause timer when expanded (hovered)
  $effect(() => {
    if (expanded) {
      timerPaused = true
    } else {
      lastTickTime = Date.now()
      timerPaused = false
    }
  })

  // Handle delete flag from store
  $effect(() => {
    if (toastData.delete && !removing) {
      handleDelete()
    }
  })

  function handleDelete() {
    if (removing) return
    // Freeze offset before removal for smooth exit animation
    offsetBeforeRemove = offset
    removing = true
    onRemoveStart?.()
    removeHeight(toastData.id)
    setTimeout(() => {
      onRemoveEnd?.()
      toast._removeToast(toastData.id)
    }, 400)
  }

  function handleDismiss() {
    toastData.onDismiss?.(toastData)
    handleDelete()
  }

  // Swipe-to-dismiss
  let pointerStartX = 0
  let pointerStartY = 0
  let pointerStartTime = 0
  let swipeDirection: 'x' | 'y' | null = null

  function onPointerDown(e: PointerEvent) {
    if (toastData.dismissible === false) return
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    pointerStartX = e.clientX
    pointerStartY = e.clientY
    pointerStartTime = Date.now()
    swipeDirection = null
    swiping = true
    toastRef?.style.setProperty('--swipe-x', '0px')
    onSwipeStart?.()
  }

  function onPointerMove(e: PointerEvent) {
    if (!swiping) return
    const xDelta = e.clientX - pointerStartX
    const yDelta = e.clientY - pointerStartY

    // Lock direction after initial movement
    if (!swipeDirection && (Math.abs(xDelta) > 1 || Math.abs(yDelta) > 1)) {
      swipeDirection = Math.abs(xDelta) > Math.abs(yDelta) ? 'x' : 'y'
    }

    let dx = xDelta
    // Dampen horizontal movement when locked to vertical
    if (swipeDirection === 'y') {
      dx = dx * (1 / (1.5 + Math.abs(dx) / 20))
    }

    toastRef?.style.setProperty('--swipe-x', `${dx}px`)
  }

  function onPointerUp(e: PointerEvent) {
    if (!swiping) return
    swiping = false
    onSwipeEnd?.()

    // If locked to vertical, snap back and skip dismiss
    if (swipeDirection === 'y') {
      toastRef?.style.setProperty('--swipe-x', '0px')
      return
    }

    const dx = e.clientX - pointerStartX
    const dt = Date.now() - pointerStartTime
    const velocity = Math.abs(dx) / dt

    if (Math.abs(dx) > 45 || velocity > 0.11) {
      // Set swipe-amount-x for keyframe animation start position
      toastRef?.style.setProperty('--swipe-amount-x', `${dx}px`)
      swipeOut = dx > 0 ? 'right' : 'left'
      handleDismiss()
    } else {
      toastRef?.style.setProperty('--swipe-x', '0px')
    }
  }
</script>

<li
  bind:this={toastRef}
  class="toast"
  data-type={toastData.type}
  data-mounted={mounted}
  data-removing={removing}
  data-swiping={swiping}
  data-expanded={expanded}
  data-is-top={isTop}
  data-front={effectiveDisplayIndex === 0}
  data-visible={effectiveDisplayIndex < visibleToasts}
  data-swipe-out={swipeOut}
  aria-live="polite"
  role="status"
  style:--index={effectiveDisplayIndex}
  style:--toasts-before={effectiveDisplayIndex}
  style:--offset="{removing ? offsetBeforeRemove : offset}px"
  style:--initial-height="{initialHeight}px"
  style:--lift={lift}
  style:--scale={Math.max(0, 1 - effectiveDisplayIndex * 0.05)}
  style:--gap="{gap}px"
  style:--front-toast-height="{frontToastHeight}px"
  style:z-index={visibleToasts - effectiveDisplayIndex}
  style:top={isTop ? '0' : undefined}
  style:bottom={isTop ? undefined : '0'}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
>
  {#if toastData.type === 'loading'}
    <div class="icon">
      <LoadingIndicator size={24} />
    </div>
  {:else if toastData.icon}
    <div class="icon">
      {@html toastData.icon}
    </div>
  {/if}

  <div class="content">
    <div class="title tint--type-ui">{toastData.title}</div>
    {#if toastData.description}
      <div class="description tint--type-ui-small">{toastData.description}</div>
    {/if}
  </div>

  {#if toastData.action || toastData.cancel}
    <div class="actions">
      {#if toastData.action}
        <Button variant="primary" small onclick={toastData.action.onClick}>
          {toastData.action.label}
        </Button>
      {/if}
      {#if toastData.cancel}
        <Button
          variant="secondary"
          small
          onclick={() => {
            toastData.cancel?.onClick()
            handleDismiss()
          }}
        >
          {toastData.cancel.label}
        </Button>
      {/if}
    </div>
  {/if}

  {#if showCloseButton}
    <Button
      variant="ghost"
      icon
      small
      aria-label="Close"
      onclick={handleDismiss}
    >
      {@html IconCloseSmall}
    </Button>
  {/if}
</li>

<style lang="sass">
  .toast
    position: absolute
    inset-inline-start: 0
    inset-inline-end: 0
    box-sizing: border-box
    display: flex
    align-items: center
    gap: var(--tint-size-12)
    padding: var(--tint-size-8)
    padding-inline-start: var(--tint-size-12)
    border-radius: var(--tint-radius-card)
    border: 1px solid var(--tint-card-border)
    background: var(--tint-bg)
    color: var(--tint-text)
    box-shadow: var(--tint-card-shadow, 0 4px 12px rgb(0 0 0 / 10%))
    transform: translateY(calc(var(--lift) * -100%)) scale(1) translateX(var(--swipe-x, 0px))
    opacity: 0
    will-change: transform, opacity, height
    transition: transform 400ms, opacity 400ms, height 400ms, box-shadow 200ms
    touch-action: none
    user-select: none

    // Safe area hover bridge between expanded toasts
    &[data-expanded="true"]::after
      content: ''
      position: absolute
      inset-inline-start: 0
      width: 100%
      height: calc(var(--gap) + 1px)

    &[data-expanded="true"][data-is-top="false"]::after
      inset-block-end: 100%

    &[data-expanded="true"][data-is-top="true"]::after
      inset-block-start: 100%

    // Disable transitions during swipe for instant feedback
    &[data-swiping="true"]
      transition: none

    // Mounted state: slide in and become visible
    &[data-mounted="true"]
      transform: translateY(0) scale(1) translateX(var(--swipe-x, 0px))
      opacity: 1
      height: var(--initial-height)

    // Hide toasts beyond visible limit in collapsed state
    // Allow opacity transition for smooth fade, but disable child transitions
    &[data-mounted="true"]:not([data-visible="true"]):not([data-expanded="true"])
      opacity: 0
      pointer-events: none

      > *
        opacity: 0
        transition: none

    // Expanded state: use full natural height and expanded offset
    &[data-expanded="true"][data-mounted="true"]
      transform: translateY(calc(var(--lift) * var(--offset))) scale(1) translateX(var(--swipe-x, 0px))
      height: var(--initial-height)
      opacity: 1

    // Collapsed non-front toasts: stack with peek effect
    &:not([data-front="true"]):not([data-expanded="true"])[data-mounted="true"]
      transform: translateY(calc(var(--lift) * var(--gap) * var(--toasts-before))) scale(var(--scale)) translateX(var(--swipe-x, 0px))
      height: var(--front-toast-height)
      overflow: hidden

      // Fade out content in collapsed non-front toasts
      > *
        opacity: 0
        transition: opacity 400ms

    // Swipe-out keyframe animations
    &[data-swipe-out="right"]
      animation: swipe-out-right 200ms ease-out forwards

    &[data-swipe-out="left"]
      animation: swipe-out-left 200ms ease-out forwards

    // Removal states (non-swipe)
    // Front toast or expanded non-front: slide out up/down
    &[data-removing="true"]:not([data-swipe-out]):is([data-front="true"], [data-expanded="true"])
      transform: translateY(calc(var(--lift) * -100%)) scale(1) translateX(var(--swipe-x, 0px))
      opacity: 0

    // Non-front collapsed toast: fade out with slight downward movement
    &[data-removing="true"]:not([data-swipe-out]):not([data-front="true"]):not([data-expanded="true"])
      transform: translateY(calc(var(--lift) * 40%)) scale(1) translateX(var(--swipe-x, 0px))
      opacity: 0
      transition: transform 200ms, opacity 200ms

    // Error type: use tint accent color for text
    &[data-type="error"]
      color: var(--tint-text-accent)

    @media (prefers-reduced-motion: reduce)
      transition: none

  @keyframes swipe-out-right
    from
      transform: translateX(var(--swipe-amount-x, 0px))
    to
      transform: translateX(100%)
      opacity: 0

  @keyframes swipe-out-left
    from
      transform: translateX(var(--swipe-amount-x, 0px))
    to
      transform: translateX(-100%)
      opacity: 0

  .icon
    flex-shrink: 0
    width: 20px
    height: 20px
    display: flex
    align-items: center
    justify-content: center
    color: currentColor

    :global(svg)
      width: 20px
      height: 20px

  .content
    flex: 1
    min-width: 0

  .description
    opacity: 0.8
    margin-block-start: var(--tint-size-2)

  .actions
    display: flex
    gap: var(--tint-size-8)
    flex-shrink: 0
</style>
