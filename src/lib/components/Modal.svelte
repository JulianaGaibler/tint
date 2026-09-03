<script lang="ts">
  import { untrack } from 'svelte'
  import * as focusTrap from 'focus-trap'
  import {
    dismissTop,
    registerDismissLayer,
    type DismissLayer,
  } from '../dismiss/stack.js'
  import { lockBodyScroll } from '../dismiss/scroll-lock.js'

  interface Props {
    // If true, the modal will be open @type {boolean | undefined}
    open?: boolean
    // If true, the modal cannot be closed by user actions @type {boolean | undefined}
    notClosable?: boolean
    // If true, the dialog fills the viewport minus a small gap @type {boolean | undefined}
    fullscreen?: boolean
    // Where the dialog sits in the viewport. 'top' keeps a palette from walking down the screen as
    // its list grows. Ignored when fullscreen @type {'center' | 'top' | undefined}
    align?: 'center' | 'top'
    // Event handler for when the modal is closed. Never called for a non-closable modal @type {() => void | undefined}
    onclose?: () => void
    // Content of the modal @type {Snippet | undefined}
    children: import('svelte').Snippet
    // A space separated list of CSS classes.
    class?: string
  }

  let {
    open = $bindable(false),
    notClosable = false,
    fullscreen = false,
    align = 'center',
    onclose,
    children,
    class: className = '',
  }: Props = $props()

  let dialogElement: HTMLDialogElement | undefined = $state(undefined)
  // Plain rather than reactive: nothing reads it outside the effect that makes it, and writing
  // reactive state from the effect that reads it is how `state_unsafe_mutation` happens.
  let trap: focusTrap.FocusTrap | undefined = undefined

  const layer: DismissLayer = {
    dismiss: () => {
      open = false
    },
    modal: true,
    label: 'Modal',
  }

  function onCancelEvent(e: Event) {
    e.preventDefault()
    if (notClosable) return
    // Reached only when the dismissal stack's listener did not run, which means something between
    // the focused element and the window stopped the key without cancelling it. A close request is
    // aimed at whichever dialog is topmost, which need not be the layer that should go, so the
    // decision is handed back to the stack rather than made here.
    dismissTop()
  }

  function onCloseEvent() {
    if (notClosable) return
    // `close()` clears the attribute at once and queues this event, so an event that arrives while
    // the dialog is open again belongs to a close that a reopen has already superseded. Acting on
    // it would leave the state saying closed while the dialog is on screen, and nothing could then
    // reach it.
    if (dialogElement?.open) return
    open = false
    onclose?.()
  }

  $effect(() => {
    // Read both before the untracked body, so a dialog that binds after the first run still opens.
    const element = dialogElement
    const wanted = open
    if (!element) return

    return untrack(() => {
      if (wanted === element.open) return

      if (wanted) {
        const unlock = lockBodyScroll()

        if (notClosable) {
          // `show()` rather than `showModal()`, so the page stays live behind a dialog the user is
          // not allowed to dismiss. That costs the top layer, hence the rendered backdrop and the
          // focus trap.
          element.show()
          if (!trap) {
            trap = focusTrap.createFocusTrap(element, {
              escapeDeactivates: false,
              clickOutsideDeactivates: false,
              returnFocusOnDeactivate: true,
              allowOutsideClick: true,
            })
          }
          trap.activate()
          return () => {
            trap?.deactivate()
            unlock()
          }
        }

        element.showModal()
        const release = registerDismissLayer(layer)
        return () => {
          release()
          unlock()
        }
      }

      element.close()
      return undefined
    })
  })
</script>

<dialog
  bind:this={dialogElement}
  oncancel={onCancelEvent}
  onclose={onCloseEvent}
  class="tint--card tint--plain {className}"
  class:manual-modal={notClosable}
  class:align-top={align === 'top' && !fullscreen}
  class:fullscreen
>
  {@render children()}
</dialog>
{#if notClosable}
  <!-- ::backdrop belongs to showModal(), which a non-closable dialog does not use. Nothing is
  bound to this: a click outside a dialog the user cannot dismiss has nothing to do. -->
  <div aria-hidden="true" class="manual-backdrop" class:visible={open}></div>
{/if}

<style lang="sass">
  dialog, .manual-backdrop
    --ease-curve: cubic-bezier(0.42, 1.67, 0.21, 0.90)
    --ease-time: 350ms
  dialog
    box-sizing: border-box
    max-width: 100vw
    overflow-x: clip
    overscroll-behavior: contain
    position: fixed
    inset: 0
    margin: auto

    // How far a top aligned dialog keeps from the top of the viewport. A custom property rather
    // than a literal, because a command palette and a sheet want different values and the `class`
    // prop lands on this element, which is the only handle a caller has on it.
    --tint-modal-inset-block: var(--tint-size-80)

    opacity: 0.2
    transform: scale(0.5)
    animation: openDialog var(--ease-time) var(--ease-curve) forwards
    @media (prefers-reduced-motion: reduce)
      animation-name: openDialog-noMotion
    &::backdrop
      forced-color-adjust: none
      background-color: rgb(0 0 0 / 0%)
      animation: openBackdrop var(--ease-time) var(--ease-curve) forwards

    &.align-top
      // Anchored rather than given a margin, so there is no over-constrained resolution to reason
      // about. The box sits at the gap and shrinks to its content.
      inset-block: var(--tint-modal-inset-block) auto
      margin-block: 0
      // The browser caps a modal dialog at `calc(100% - 6px - 2em)`, a figure that assumes the box
      // is centred. Measured from the top instead, that cap lets a tall dialog run off the bottom,
      // so it is restated against the gap this one keeps, twice, so the space below matches the
      // space above.
      max-block-size: calc(100% - (var(--tint-modal-inset-block) * 2))

    &.fullscreen
      width: calc(100% - 16px)
      max-width: calc(100% - 16px)
      height: calc(100% - 16px)
      max-height: calc(100% - 16px)

    // Manual modal styling for non-closable dialogs
    &.manual-modal
      z-index: 9999

  // Create backdrop pseudo-element since ::backdrop won't work with show()
  .manual-backdrop
    position: fixed
    inset: 0
    background-color: rgb(0 0 0 / 0%)
    z-index: 9998
    display: none
    &.visible
      display: block
      animation: openBackdrop var(--ease-time) var(--ease-curve) forwards

  @keyframes openDialog
    from
      opacity: 0.2
      transform: scale(0.5)
    to
      opacity: 1
      transform: scale(1)

  @keyframes openDialog-noMotion
    from
      opacity: 0
      transform: scale(1)
    to
      opacity: 1
      transform: scale(1)

  @keyframes openBackdrop
    from
      background-color: rgb(0 0 0 / 0%)
    to
      background-color: rgb(0 0 0 / 25%)
</style>
