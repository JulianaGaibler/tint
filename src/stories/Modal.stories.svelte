<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Modal from '@lib/components/Modal.svelte'
  import Button from '@lib/components/Button.svelte'
  import ButtonMenu from '@lib/components/Menu.svelte'
  import TextField from '@lib/components/TextField.svelte'
  import { expect, fn, userEvent, waitFor } from 'storybook/test'
  import ModalDocs from './docs/Modal.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/Modal',
    component: Modal,
    render: template,
    args: {
      onclose: fn(),
    },
    parameters: { docs: { description: { component: ModalDocs } } },
    // Module state outlives a story in the browser runner, so a story that leaves a modal open
    // would hand the next one a dialog it never opened.
    beforeEach: () => {
      modalOpen = false
      outerOpen = false
      innerOpen = false
      fieldValue = 'start'
    },
  })
  let modalOpen = $state(false)
  let outerOpen = $state(false)
  let innerOpen = $state(false)
  let fieldValue = $state('start')
  let openMenu: ((e: Event) => void) | undefined = $state()

  /** The dialog in the top layer, which is the one a press would reach. */
  function openDialog() {
    return document.querySelector('dialog[open]')
  }
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

<Story name="Top aligned" args={{ align: 'top' }} />

<Story
  name="Escape closes once"
  play={async ({ args, canvas }: any) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open modal' }))
    await waitFor(() => expect(openDialog()).not.toBeNull())

    await userEvent.keyboard('{Escape}')

    await waitFor(() => expect(openDialog()).toBeNull())
    // `close()` removes the attribute at once and queues the event that reports it, so the count
    // has to be waited for rather than read straight after the dialog goes.
    await waitFor(() => expect(args.onclose).toHaveBeenCalledTimes(1))
  }}
/>

<Story
  name="Reopening beats the close event"
  play={async ({ canvas }: any) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open modal' }))
    await waitFor(() => expect(openDialog()).not.toBeNull())

    await userEvent.click(
      canvas.getByRole('button', { name: 'Close, then reopen' }),
    )

    // `close()` queues its event, so the reopen lands first and the event arrives against a dialog
    // that is open again. Reading that event as a close leaves the state saying closed while the
    // dialog is on screen, and then nothing can reach it.
    await waitFor(() => expect(openDialog()).not.toBeNull())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(openDialog()).toBeNull())
  }}
>
  {#snippet template()}
    <div>
      <Button onclick={() => (modalOpen = true)}>Open modal</Button>
      <Button
        onclick={() => {
          modalOpen = false
          queueMicrotask(() => (modalOpen = true))
        }}>Close, then reopen</Button
      >
      <Modal bind:open={modalOpen}>
        <div class="content"><p>Content</p></div>
      </Modal>
    </div>
  {/snippet}
</Story>

<Story
  name="Escape reaches the innermost layer"
  play={async ({ canvas }: any) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open modal' }))
    await waitFor(() => expect(openDialog()).not.toBeNull())

    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await waitFor(() =>
      expect(document.querySelector('[role="menu"]')).not.toBeNull(),
    )

    await userEvent.keyboard('{Escape}')

    // The menu goes and the dialog it sits in stays, which is the whole point of the stack.
    await waitFor(() =>
      expect(document.querySelector('[role="menu"]')).toBeNull(),
    )
    await expect(openDialog()).not.toBeNull()

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(openDialog()).toBeNull())
  }}
>
  {#snippet template()}
    <div>
      <Button onclick={() => (modalOpen = true)}>Open modal</Button>
      <Modal bind:open={modalOpen}>
        <div class="content">
          <Button onclick={openMenu}>Menu</Button>
          <ButtonMenu
            bind:contextClick={openMenu}
            items={[{ label: 'One', onClick: () => {} }]}
          />
        </div>
      </Modal>
    </div>
  {/snippet}
</Story>

<Story
  name="A field that takes Escape keeps the modal open"
  play={async ({ canvas }: any) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open modal' }))
    await waitFor(() => expect(openDialog()).not.toBeNull())

    const field = document.querySelector(
      'dialog[open] input',
    ) as HTMLInputElement
    await userEvent.click(field)
    await userEvent.keyboard('edited')

    await userEvent.keyboard('{Escape}')

    // The field cancels the key to revert itself, and the stack stands down on a cancelled key.
    // Moving the listener to the capture phase is what would break this.
    await waitFor(() => expect(field.value).toBe('start'))
    await expect(openDialog()).not.toBeNull()

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(openDialog()).toBeNull())
  }}
>
  {#snippet template()}
    <div>
      <Button onclick={() => (modalOpen = true)}>Open modal</Button>
      <Modal bind:open={modalOpen}>
        <div class="content">
          <TextField id="modal-field" label="Field" bind:value={fieldValue} />
        </div>
      </Modal>
    </div>
  {/snippet}
</Story>

<Story
  name="Not closable ignores Escape"
  args={{ notClosable: true }}
  play={async ({ args, canvas }: any) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open modal' }))
    await waitFor(() =>
      expect(document.querySelector('dialog[open]')).not.toBeNull(),
    )

    await userEvent.keyboard('{Escape}')

    // It never joins the stack, so nothing above or below it can be asked to close it either.
    await expect(document.querySelector('dialog[open]')).not.toBeNull()
    await expect(args.onclose).not.toHaveBeenCalled()
  }}
/>

<Story
  name="Nested modals share one scroll lock"
  play={async ({ canvas }: any) => {
    document.body.style.removeProperty('overflow')

    await userEvent.click(canvas.getByRole('button', { name: 'Open outer' }))
    await waitFor(() =>
      expect(document.querySelectorAll('dialog[open]')).toHaveLength(1),
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Open inner' }))
    await waitFor(() =>
      expect(document.querySelectorAll('dialog[open]')).toHaveLength(2),
    )

    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(document.querySelectorAll('dialog[open]')).toHaveLength(1),
    )
    // The outer one is still up, so the page must not have its scrollbar back yet.
    await expect(document.body.style.overflow).toBe('hidden')

    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(document.querySelectorAll('dialog[open]')).toHaveLength(0),
    )
    await expect(document.body.style.overflow).toBe('')
  }}
>
  {#snippet template()}
    <div>
      <Button onclick={() => (outerOpen = true)}>Open outer</Button>
      <Modal bind:open={outerOpen}>
        <div class="content">
          <Button onclick={() => (innerOpen = true)}>Open inner</Button>
        </div>
      </Modal>
      <Modal bind:open={innerOpen}>
        <div class="content"><p>Inner</p></div>
      </Modal>
    </div>
  {/snippet}
</Story>

<Story
  name="Top alignment sits at the inset"
  args={{ align: 'top' }}
  play={async ({ canvas }: any) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open modal' }))
    await waitFor(() => expect(openDialog()).not.toBeNull())

    // The dialog scales up as it opens and a rect includes the transform, so this settles only
    // once the animation has finished.
    await Promise.all(
      (openDialog() as HTMLElement).getAnimations().map((a) => a.finished),
    )

    const rect = (openDialog() as HTMLElement).getBoundingClientRect()
    expect(Math.abs(rect.top - 80)).toBeLessThan(1.5)
    expect(
      Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2),
    ).toBeLessThan(1.5)
    // The browser's own cap assumes a centred dialog, so a top aligned one has to restate it.
    expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight - 79)
  }}
/>

<style lang="sass">
  .content
    padding: 32px
    h2
      margin-block-end: 4px
    p
      margin-block-end: 16px
</style>
