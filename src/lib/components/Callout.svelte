<script lang="ts">
  import { tick, untrack, type Snippet } from 'svelte'
  import {
    placeAnchored,
    type AnchoredPlacement,
    type AnchoredSide,
  } from '../positioning/anchored.js'
  import { registerDismissLayer, type DismissLayer } from '../dismiss/stack.js'
  import { generateUniqueId } from '../actions/utils.js'

  interface Props {
    // If true, the callout is showing. Nothing else closes it @type {boolean | undefined}
    open?: boolean
    // The element the callout points at. Nothing renders until this is set @type {HTMLElement | undefined}
    anchor?: HTMLElement | undefined
    // Preferred side of the anchor. Flips when that side has no room @type {'block-start' | 'block-end' | 'inline-start' | 'inline-end' | undefined}
    side?: AnchoredSide
    // Accessible name, and what a screen reader hears when the callout opens on its own @type {string}
    label: string
    // If true, focus moves into the callout on open @type {boolean | undefined}
    takeFocus?: boolean
    // Event handler for when the callout is closed @type {() => void | undefined}
    onclose?: () => void
    // Content of the callout. Carries no padding, and has to include a control that closes it @type {Snippet}
    children: Snippet
    // A space separated list of CSS classes.
    class?: string
  }

  let {
    open = $bindable(false),
    anchor = undefined,
    side = 'block-end',
    label,
    takeFocus = false,
    onclose,
    children,
    class: className = '',
  }: Props = $props()

  // Half the diagonal of the `.arrow` square, and that plus `--tint-radius-card`.
  // Both are read off the rule below, so resizing the arrow means changing these.
  const ARROW_REACH = 11
  const ARROW_PADDING = 23
  // Air between the arrow's tip and the anchor.
  const ANCHOR_GAP = 4

  const calloutId = generateUniqueId('callout')

  let calloutElement: HTMLDivElement | undefined = $state(undefined)
  let placement = $state<AnchoredPlacement | undefined>(undefined)
  let anchorVisible = $state(true)
  let announcement = $state('')

  function close() {
    if (!open) return
    // Before `onclose`, so a parent that reads its bound `open` from the
    // handler sees the callout closed rather than mid-close.
    open = false
    onclose?.()
  }

  function reposition() {
    const element = calloutElement
    if (!element || !anchor) return
    // The layout box, because the open animation scales the callout and the
    // visual rect under-reports its footprint while that runs.
    const surface = new DOMRect(0, 0, element.offsetWidth, element.offsetHeight)
    // `clientWidth` leaves out the scrollbar gutter that `innerWidth` includes.
    const root = document.documentElement
    placement = placeAnchored(
      anchor.getBoundingClientRect(),
      surface,
      {
        innerWidth: root.clientWidth || window.innerWidth,
        innerHeight: root.clientHeight || window.innerHeight,
      },
      {
        side,
        offset: ANCHOR_GAP,
        arrowSize: ARROW_REACH,
        arrowPadding: ARROW_PADDING,
      },
    )
  }

  const onBlockAxis = $derived((placement?.side ?? side).startsWith('block'))

  $effect(() => {
    const element = calloutElement
    const anchorElement = anchor
    if (!element || !anchorElement) return

    return untrack(() => {
      try {
        element.showPopover()
      } catch {
        // Popover API missing. The element still renders, just not on top.
      }
      reposition()

      const layer: DismissLayer = {
        dismiss: close,
        modal: false,
        label: 'Callout',
      }
      let release: (() => void) | undefined

      // Escape reaches the callout only from inside it or from its anchor. A
      // surface that blocks nothing must not answer for a key aimed elsewhere.
      const trackFocus = (target: EventTarget | null) => {
        const node = target as Node | null
        const near =
          !!node && (element.contains(node) || anchorElement.contains(node))
        if (near && !release) release = registerDismissLayer(layer)
        else if (!near && release) {
          release()
          release = undefined
        }
      }

      const onFocusIn = () => trackFocus(document.activeElement)
      // `document.activeElement` is still the outgoing element during
      // `focusout`, so the incoming one comes from the event.
      const onFocusOut = (event: FocusEvent) => trackFocus(event.relatedTarget)
      document.addEventListener('focusin', onFocusIn)
      document.addEventListener('focusout', onFocusOut)

      const onScroll = () => reposition()
      // Capturing on the document, since scroll does not bubble and a listener
      // on the window misses a scrolling container around the anchor.
      document.addEventListener('scroll', onScroll, {
        capture: true,
        passive: true,
      })
      window.addEventListener('resize', onScroll)

      // Only a real size change repositions, so a sub-pixel disagreement cannot
      // run the observer against itself.
      let lastWidth = -1
      let lastHeight = -1
      const sizeObserver = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect
        if (width === lastWidth && height === lastHeight) return
        lastWidth = width
        lastHeight = height
        reposition()
      })
      sizeObserver.observe(element)

      // A callout pinned to the viewport edge pointing at nothing is worse than
      // no callout, so it comes and goes with its anchor without touching `open`.
      const anchorObserver = new IntersectionObserver(
        ([entry]) => {
          if (
            !entry.isIntersecting &&
            element.contains(document.activeElement)
          ) {
            // Focus inside a hidden subtree would otherwise drop to the body.
            anchorElement.focus({ preventScroll: true })
          }
          anchorVisible = entry.isIntersecting
          if (entry.isIntersecting) reposition()
        },
        { threshold: 0 },
      )
      anchorObserver.observe(anchorElement)

      const hadDetails = anchorElement.hasAttribute('aria-details')
      if (!hadDetails) anchorElement.setAttribute('aria-details', calloutId)

      if (takeFocus) {
        // Focus cannot land in a subtree that is still `visibility: hidden`,
        // so it waits for the first placement to reveal the callout.
        tick().then(() => {
          if (!element.isConnected) return
          const first = element.querySelector<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          )
          ;(first ?? element).focus()
        })
      } else {
        // Taking focus already reads the callout out, so the live region would
        // only talk over it.
        announcement = label
      }
      trackFocus(document.activeElement)

      return () => {
        release?.()
        document.removeEventListener('focusin', onFocusIn)
        document.removeEventListener('focusout', onFocusOut)
        document.removeEventListener('scroll', onScroll, { capture: true })
        window.removeEventListener('resize', onScroll)
        sizeObserver.disconnect()
        anchorObserver.disconnect()
        if (!hadDetails) anchorElement.removeAttribute('aria-details')
        announcement = ''
        placement = undefined
        anchorVisible = true
        try {
          element.hidePopover()
        } catch {
          // Already hidden, or the element is on its way out of the DOM.
        }
      }
    })
  })

  $effect(() => {
    // Reads `side` and the anchor's element through `reposition`, so a change
    // to either moves the callout without remounting it.
    if (calloutElement) reposition()
  })
</script>

{#if open && anchor}
  <div
    bind:this={calloutElement}
    popover="manual"
    role="dialog"
    tabindex="-1"
    aria-label={label}
    id={calloutId}
    class="callout side-{placement?.side ?? side} {className}"
    class:placed={!!placement}
    class:hidden={!anchorVisible}
    style:inset-inline-start="{placement?.x ?? 0}px"
    style:inset-block-start="{placement?.y ?? 0}px"
    style:--callout-arrow-offset="{placement?.arrowOffset ?? 0}px"
  >
    <div
      class="surface tint--card"
      class:capped={placement?.maxSize !== undefined}
      style:max-block-size={placement?.maxSize !== undefined && onBlockAxis
        ? `${placement.maxSize}px`
        : undefined}
      style:max-inline-size={placement?.maxSize !== undefined && !onBlockAxis
        ? `${placement.maxSize}px`
        : undefined}
    >
      {@render children()}
    </div>
    <div class="arrow" aria-hidden="true"></div>
  </div>
{/if}

<span class="tint--visually-hidden" aria-live="polite">{announcement}</span>

<style lang="sass">
  .callout
    position: fixed
    z-index: 100
    // The UA popover sheet centres the box, draws a border and a background
    // around it, and clips to it. All of that has to go: the card is `.surface`
    // below, and the arrow reaches outside the box on purpose.
    inset: unset
    margin: 0
    border: none
    padding: 0
    background: none
    overflow: visible
    color: var(--tint-text)
    // Held back until the first placement lands, so the callout is never seen
    // at the UA's centred default before it reaches its anchor.
    visibility: hidden

  .callout.placed
    visibility: visible
    animation: callout-appear 250ms cubic-bezier(0.42, 1.67, 0.21, 0.90)

  .callout.hidden
    visibility: hidden
    animation: none

  // No padding of its own: the content snippet owns its spacing, as in Modal.
  .surface
    min-inline-size: 0

  // Set only when neither side of the anchor had room at full size. Scrolling
  // by default would clip anything the content overflows on purpose.
  .surface.capped
    overflow: auto
    overscroll-behavior: contain

  // A square turned 45 degrees and straddling the card's edge, bordered only on
  // the two sides that face out once turned. It paints after the card, so its
  // own background is what hides the card's border across the arrow's base.
  .arrow
    position: absolute
    inline-size: var(--tint-size-16)
    block-size: var(--tint-size-16)
    background: var(--tint-bg)
    rotate: 45deg

  .callout.side-block-end .arrow
    inset-block-start: 0
    inset-inline-start: calc(50% + var(--callout-arrow-offset))
    translate: -50% -50%
    border-block-start: 1px solid var(--tint-card-border)
    border-inline-start: 1px solid var(--tint-card-border)

  .callout.side-block-start .arrow
    inset-block-end: 0
    inset-inline-start: calc(50% + var(--callout-arrow-offset))
    translate: -50% 50%
    border-block-end: 1px solid var(--tint-card-border)
    border-inline-end: 1px solid var(--tint-card-border)

  .callout.side-inline-end .arrow
    inset-inline-start: 0
    inset-block-start: calc(50% + var(--callout-arrow-offset))
    translate: -50% -50%
    border-inline-start: 1px solid var(--tint-card-border)
    border-block-end: 1px solid var(--tint-card-border)

  .callout.side-inline-start .arrow
    inset-inline-end: 0
    inset-block-start: calc(50% + var(--callout-arrow-offset))
    translate: 50% -50%
    border-block-start: 1px solid var(--tint-card-border)
    border-inline-end: 1px solid var(--tint-card-border)

  .callout.side-block-end
    transform-origin: top center
  .callout.side-block-start
    transform-origin: bottom center
  .callout.side-inline-end
    transform-origin: left center
  .callout.side-inline-start
    transform-origin: right center

  @keyframes callout-appear
    0%
      opacity: 0
      transform: scale(0.92)
    100%
      opacity: 1
      transform: scale(1)

  @media (prefers-reduced-motion: reduce)
    .callout.placed
      animation: none

  @media (forced-colors: active)
    .surface
      border: 1px solid CanvasText
    .arrow
      background: Canvas
</style>
