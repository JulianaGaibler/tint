<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Modal from '@lib/components/Modal.svelte'
  import Button from '@lib/components/Button.svelte'
  import { fn } from 'storybook/test'
  import ModalDocs from './docs/Modal.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/Modal',
    component: Modal,
    render: template,
    args: {
      onclose: fn(),
    },
    parameters: { docs: { description: { component: ModalDocs } } },
  })
  let modalOpen = $state(false)
</script>

{#snippet template(args: any)}
  <div>
    <Button onclick={() => (modalOpen = true)}>Open modal</Button>
    <Modal bind:open={modalOpen} {...args}>
      <div
        class="content"
        style={args.fullscreen ? 'max-width: 600px; margin-inline: auto' : ''}
      >
        <h2 class="tint--type">This is a modal</h2>
        {#if !args.notClosable}
          <p>You can press the Escape key to close it.</p>
        {/if}
        <Button
          variant="secondary"
          onclick={() => {
            modalOpen = false
          }}>Close</Button
        >
      </div>
    </Modal>
  </div>
{/snippet}

<Story name="Basic" />

<Story name="Not closable" args={{ notClosable: true }} />

<Story name="Fullscreen" args={{ fullscreen: true }} />

<style lang="sass">
  .content
    padding: 32px
    h2
      margin-block-end: 4px
    p
      margin-block-end: 16px
</style>
