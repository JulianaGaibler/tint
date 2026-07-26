<script lang="ts">
  import type { ToastData, ToastPosition } from './toast/types.js'
  import { toast } from '../stores/toast.js'
  import ToastItem from './toast/ToastItem.svelte'

  interface Props {
    /** Toast position on screen */
    position?: ToastPosition
    /** Whether toasts are expanded by default */
    expand?: boolean
    /** Show close button on all toasts */
    closeButton?: boolean
    /** Default toast duration in ms */
    duration?: number
    /** Maximum visible toasts in the stack */
    visibleToasts?: number
    /** Gap between toasts in px */
    gap?: number
    /** Offset from viewport edge */
    offset?: string
    /** A space separated list of CSS classes */
    class?: string
  }

  let {
    position = 'bottom-right',
    expand = false,
    closeButton = true,
    duration = 4000,
    visibleToasts = 3,
    gap = 14,
    offset = '24px',
    class: className = '',
  }: Props = $props()

  let toasts: ToastData[] = $state([])
  let heights: { id: number; height: number }[] = $state([])
  let overrideExpanded: boolean | undefined = $state(undefined)
  const expanded = $derived(overrideExpanded ?? expand)
  let interacting = $state(false)
  let removingCount = $state(0)
  let listRef: HTMLOListElement | undefined = $state(undefined)

  // Subscribe to toast store
  $effect(() => {
    const unsubscribe = toast.subscribe((newToasts) => {
      toasts = newToasts
    })
    return unsubscribe
  })

  function setHeight(id: number, height: number) {
    const existing = heights.findIndex((h) => h.id === id)
    if (existing !== -1) {
      if (heights[existing].height !== height) {
        heights[existing] = { id, height }
        heights = [...heights]
      }
    } else {
      heights = [...heights, { id, height }]
    }
  }

  function removeHeight(id: number) {
    heights = heights.filter((h) => h.id !== id)
  }

  // Active heights: ordered by toast position, excluding removed toasts
  const activeHeights = $derived(
    toasts
      .map((t) => heights.find((h) => h.id === t.id))
      .filter((h): h is { id: number; height: number } => h != null),
  )

  const frontToastHeight = $derived(activeHeights[0]?.height ?? 0)
</script>

{#if toasts.length > 0}
  <ol
    bind:this={listRef}
    class="toaster {className}"
    data-position={position}
    aria-live="polite"
    role="region"
    aria-label="Notifications"
    style:--offset={offset}
    onmouseenter={() => (overrideExpanded = true)}
    onmousemove={() => (overrideExpanded = true)}
    onmouseleave={() => {
      if (!interacting && removingCount === 0) overrideExpanded = undefined
    }}
  >
    {#each toasts as t (t.id)}
      <ToastItem
        toastData={t}
        {expanded}
        {position}
        {visibleToasts}
        {activeHeights}
        {setHeight}
        {removeHeight}
        defaultCloseButton={closeButton}
        {gap}
        defaultDuration={duration}
        {frontToastHeight}
        onSwipeStart={() => (interacting = true)}
        onSwipeEnd={() => (interacting = false)}
        onRemoveStart={() => removingCount++}
        onRemoveEnd={() => {
          removingCount--
          if (removingCount === 0 && !listRef?.matches(':hover')) {
            overrideExpanded = undefined
          }
        }}
      />
    {/each}
  </ol>
{/if}

<style>.toaster {
  position: fixed;
  z-index: 99999;
  list-style: none;
  margin: 0;
  padding: 0;
  width: 356px;
  box-sizing: border-box;
}
.toaster[data-position=bottom-right] {
  inset-block-end: var(--offset);
  inset-inline-end: var(--offset);
}
.toaster[data-position=bottom-left] {
  inset-block-end: var(--offset);
  inset-inline-start: var(--offset);
}
.toaster[data-position=bottom-center] {
  inset-block-end: var(--offset);
  inset-inline-start: 50%;
  transform: translateX(-50%);
}
.toaster[data-position=top-right] {
  inset-block-start: var(--offset);
  inset-inline-end: var(--offset);
}
.toaster[data-position=top-left] {
  inset-block-start: var(--offset);
  inset-inline-start: var(--offset);
}
.toaster[data-position=top-center] {
  inset-block-start: var(--offset);
  inset-inline-start: 50%;
  transform: translateX(-50%);
}</style>
