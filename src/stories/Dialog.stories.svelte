<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Dialog, { type OpenDialog } from '@lib/components/Dialog.svelte'
  import Button from '@lib/components/Button.svelte'
  import DialogDocs from './docs/Dialog.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/Dialog',
    component: Dialog,
    parameters: { docs: { description: { component: DialogDocs } } },
  })
</script>

<script lang="ts">
  let openTransactionalDialog = $state<OpenDialog | undefined>(undefined)
  let openAcknowledgmentDialog = $state<OpenDialog | undefined>(undefined)
</script>

<Story
  name="Transactional"
  args={{
    variant: 'transaction',
    heading: 'Delete selected images?',
    actionLabel: 'Delete',
  }}
>
  {#snippet template(args: any)}
    <Button onclick={() => openTransactionalDialog?.()}>
      Open transactional dialog
    </Button>
    <Dialog bind:openDialog={openTransactionalDialog} {...args}>
      <p>
        Images will be permanently removed from your account and all synced
        devices
      </p>
    </Dialog>{/snippet}</Story
>

<Story
  name="Acknowledgment"
  args={{
    heading: 'Images deleted',
    actionLabel: 'Okay',
  }}
>
  {#snippet template(args: any)}
    <Button onclick={() => openAcknowledgmentDialog?.()}>
      Open acknowledgment dialog
    </Button>
    <Dialog bind:openDialog={openAcknowledgmentDialog} {...args}>
      <p>Images have been deleted</p>
    </Dialog>{/snippet}</Story
>

<style lang="sass">
  p
    margin-block-end: 16px
</style>
