<script context="module" lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import TooltipDocs from './docs/Tooltip.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Actions/Tooltip',
    parameters: { docs: { description: { component: TooltipDocs } } },
  })
</script>

<script lang="ts">
  import { tooltip } from '@src/lib/actions/tooltip'
</script>

<Story name="Basic Usage">
  <button
    class="demo-button"
    use:tooltip={{
      text: 'This tooltip has a much longer text that might wrap to multiple lines',
    }}
  >
    Hover me
  </button>
</Story>

<Story name="Offset Options">
  <div class="offset-row">
    <button
      class="demo-button"
      use:tooltip={{ text: 'Default offset (0px)', offset: 0 }}
    >
      Default (0px)
    </button>

    <button
      class="demo-button"
      use:tooltip={{ text: 'Small offset (8px)', offset: 8 }}
    >
      Small (8px)
    </button>

    <button
      class="demo-button"
      use:tooltip={{ text: 'Medium offset (16px)', offset: 16 }}
    >
      Medium (16px)
    </button>

    <button
      class="demo-button"
      use:tooltip={{ text: 'Large offset (24px)', offset: 24 }}
    >
      Large (24px)
    </button>
  </div>
</Story>

<Story name="Auto Positioning">
  <div class="positioning-container">
    <!-- Top-left corner -->
    <button
      class="corner-button top-left"
      use:tooltip={{ text: 'Tooltip from top-left corner', offset: 24 }}
    >
      TL
    </button>

    <!-- Top-right corner -->
    <button
      class="corner-button top-right"
      use:tooltip={{ text: 'Tooltip from top-right corner', offset: 24 }}
    >
      TR
    </button>

    <!-- Bottom-left corner -->
    <button
      class="corner-button bottom-left"
      use:tooltip={{ text: 'Tooltip from bottom-left corner', offset: 24 }}
    >
      BL
    </button>

    <!-- Bottom-right corner -->
    <button
      class="corner-button bottom-right"
      use:tooltip={{ text: 'Tooltip from bottom-right corner', offset: 24 }}
    >
      BR
    </button>

    <!-- Center -->
    <button
      class="corner-button center"
      use:tooltip={{ text: 'Tooltip from center element', offset: 24 }}
    >
      C
    </button>
  </div>
</Story>

<style lang="sass">
  .offset-row
    display: flex
    gap: var(--tint-size-16)
    margin-block: 20px
    margin-inline: 0

  .demo-button
    padding-block: var(--tint-size-8)
    padding-inline: var(--tint-size-16)
    background: transparent
    border: 2px solid var(--tint-action-secondary)
    border-radius: var(--tint-size-8)
    cursor: pointer

  .positioning-container
    position: relative
    height: calc(100vh - 34px)
    width: 100%
    border: 2px solid var(--tint-card-border)
    background: var(--tint-bg)

  .corner-button
    position: absolute
    width: var(--tint-size-40)
    height: var(--tint-size-40)
    display: flex
    align-items: center
    justify-content: center
    background: var(--tint-action-primary)
    color: var(--tint-action-primary-text)
    border: none
    border-radius: 4px
    cursor: pointer

  .top-left
    inset-block-start: 12px
    inset-inline-start: 12px

  .top-right
    inset-block-start: 12px
    inset-inline-end: 12px

  .bottom-left
    inset-block-end: 12px
    inset-inline-start: 12px

  .bottom-right
    inset-block-end: 12px
    inset-inline-end: 12px

  .center
    inset-block-start: 50%
    inset-inline-start: 50%
    transform: translate(-50%, -50%)
</style>
