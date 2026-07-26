<script lang="ts" module>
  export type DialogResult = boolean
  export interface DialogOptions {
    variant?: 'transaction' | 'acknowledge'
    heading?: string
    actionLabel?: string
    children?: string | import('svelte').Snippet
  }
  export type OpenDialog = (options?: DialogOptions) => Promise<DialogResult>
</script>

<script lang="ts">
  import Button from '@lib/components/Button.svelte'
  import Modal from './Modal.svelte'

  interface Props {
    // Whether the user is presenting a transaction or an acknowledge dialog @type {'transaction' | 'acknowledge'}
    variant?: 'transaction' | 'acknowledge'
    // The heading of the dialog @type {string}
    heading?: string
    // The label of the primary action button @type {string}
    actionLabel?: string
    // Function to open the dialog. Returns a promise that resolves when the dialog is closed @type {OpenDialog | undefined}
    openDialog?: OpenDialog
    // Content of the dialog between the heading and the action buttons @type {Snippet | undefined}
    children?: import('svelte').Snippet
    // A space separated list of CSS classes.
    class?: string
  }

  let {
    variant = 'acknowledge',
    heading,
    actionLabel,
    openDialog = $bindable(undefined),
    children,
    class: className = '',
  }: Props = $props()

  let open = $state(false)
  let promiseResolve: ((value: DialogResult) => void) | undefined =
    $state(undefined)

  // Current dialog content (can be overridden by openDialog arguments)
  let currentVariant = $state<'transaction' | 'acknowledge' | undefined>(
    undefined,
  )
  let currentHeading = $state<string | undefined>(undefined)
  let currentActionLabel = $state<string | undefined>(undefined)
  let currentChildren = $state<string | import('svelte').Snippet | undefined>(
    undefined,
  )

  function createDialog(options?: DialogOptions) {
    if (open) {
      promiseResolve?.(false)
    }

    // Use provided options or fall back to props
    currentVariant = options?.variant ?? variant
    currentHeading = options?.heading ?? heading
    currentActionLabel = options?.actionLabel ?? actionLabel
    currentChildren = options?.children ?? children

    open = true
    window.addEventListener('keydown', onKeyDown)
    return new Promise<DialogResult>((resolve) => {
      promiseResolve = resolve
    })
  }

  function onclose() {
    if (!promiseResolve) {
      return
    }
    promiseResolve(false)
    promiseResolve = undefined
    window.removeEventListener('keydown', onKeyDown)
  }

  function resolvePromise(result: DialogResult) {
    promiseResolve?.(result)
    promiseResolve = undefined
    open = false
    window.removeEventListener('keydown', onKeyDown)
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      resolvePromise(true)
    }
  }

  openDialog = createDialog
</script>

<Modal bind:open {onclose}>
  <div class="dialog tint--type-body-sans {className}">
    <div class="content">
      {#if currentHeading}
        <h2 class="tint--type-title-sans-3">{currentHeading}</h2>
      {/if}
      {#if currentChildren}
        {#if typeof currentChildren === 'string'}
          <p>{currentChildren}</p>
        {:else}
          {@render currentChildren()}
        {/if}
      {/if}
    </div>
    <div class="actions">
      {#if currentVariant === 'transaction'}
        <Button onclick={() => resolvePromise(false)}>Cancel</Button>
        <Button onclick={() => resolvePromise(true)} variant="primary"
          >{currentActionLabel || 'Okay'}</Button
        >
      {:else}
        <Button onclick={() => resolvePromise(true)}
          >{currentActionLabel || 'OK'}</Button
        >
      {/if}
    </div>
  </div>
</Modal>

<style lang="sass">
  .dialog
    padding: var(--tint-size-24)
    display: flex
    flex-direction: column
    gap: var(--tint-size-16)
    max-width: 448px
    min-width: min(calc(100vw - 128px), 448px)

  .content
    h2
      margin-block-end: var(--tint-size-8)

  .actions
    display: flex
    flex-wrap: wrap
    justify-content: flex-end
    gap: var(--tint-size-8)
</style>
