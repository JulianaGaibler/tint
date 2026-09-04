<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Callout from '@lib/components/Callout.svelte'
  import Button from '@lib/components/Button.svelte'
  import { expect, fn, userEvent, waitFor } from 'storybook/test'
  import CalloutDocs from './docs/Callout.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/Callout',
    component: Callout,
    render: template,
    args: {
      side: 'block-end',
      label: 'Filters are new',
      takeFocus: false,
      onclose: fn(),
    },
    parameters: { docs: { description: { component: CalloutDocs } } },
    argTypes: {
      side: {
        control: 'select',
        options: ['block-start', 'block-end', 'inline-start', 'inline-end'],
      },
      takeFocus: { control: 'boolean' },
    },
    // Module state outlives a story in the browser runner, so a story that
    // leaves a callout up would hand the next one one it never opened.
    beforeEach: () => {
      open = false
      anchor = undefined
      edgeAnchor = undefined
      timedOpen = false
      edgeOpen = false
      scrollAnchor = undefined
      scrollOpen = false
    },
  })

  let anchor: HTMLElement | undefined = $state(undefined)
  let open = $state(false)
  let timedOpen = $state(false)
  let edgeAnchor: HTMLElement | undefined = $state(undefined)
  let edgeOpen = $state(false)
  let scrollAnchor: HTMLElement | undefined = $state(undefined)
  let scrollOpen = $state(false)

  /** The callout in the top layer, which is the one a press would reach. */
  function openCallout() {
    return document.querySelector('[role="dialog"][id^="callout-"]')
  }
</script>

{#snippet body(close: () => void, text: string)}
  <div class="body">
    <h3 class="tint--type-ui-bold">Filters are new</h3>
    <p class="tint--type-ui-small">{text}</p>
    <Button small onclick={close}>Got it</Button>
  </div>
{/snippet}

{#snippet sideTemplate(args: any)}
  <div class="middle-stage">
    <Button bind:element={anchor} onclick={() => (open = true)}>
      Show the callout
    </Button>
    <Callout {...args} {anchor} bind:open>
      {@render body(() => (open = false), 'The arrow follows the side.')}
    </Callout>
  </div>
{/snippet}

{#snippet template(args: any)}
  <div class="stage">
    <Button bind:element={anchor} onclick={() => (open = true)}>
      Show the callout
    </Button>
    <Callout {...args} {anchor} bind:open>
      {@render body(
        () => (open = false),
        'Narrow the list down to what you are looking for.',
      )}
    </Callout>
  </div>
{/snippet}

<Story name="Default" />

<Story name="Block start" args={{ side: 'block-start' }}>
  {#snippet template(args: any)}{@render sideTemplate(args)}{/snippet}
</Story>
<Story name="Block end" args={{ side: 'block-end' }}>
  {#snippet template(args: any)}{@render sideTemplate(args)}{/snippet}
</Story>
<Story name="Inline start" args={{ side: 'inline-start' }}>
  {#snippet template(args: any)}{@render sideTemplate(args)}{/snippet}
</Story>
<Story name="Inline end" args={{ side: 'inline-end' }}>
  {#snippet template(args: any)}{@render sideTemplate(args)}{/snippet}
</Story>

<Story
  name="Points at the anchor"
  play={async ({ canvas }: any) => {
    await userEvent.click(canvas.getByRole('button', { name: /Show the/ }))
    await waitFor(() => expect(openCallout()).not.toBeNull())
    const card = openCallout() as HTMLElement
    const anchorRect = (
      canvas.getByRole('button', { name: /Show the/ }) as HTMLElement
    ).getBoundingClientRect()
    const cardRect = card.getBoundingClientRect()
    // The default side is block-end, so the card starts below the anchor.
    expect(cardRect.top).toBeGreaterThanOrEqual(anchorRect.bottom)
  }}
/>

<Story
  name="Opening leaves focus alone"
  play={async ({ canvas }: any) => {
    const trigger = canvas.getByRole('button', { name: /Show the/ })
    trigger.focus()
    await userEvent.click(trigger)
    await waitFor(() => expect(openCallout()).not.toBeNull())
    // A callout can appear without the user asking for it, so it never takes
    // the caret out of whatever they were doing.
    expect(document.activeElement).toBe(trigger)
  }}
/>

<Story
  name="Takes focus when asked"
  args={{ takeFocus: true }}
  play={async ({ canvas }: any) => {
    await userEvent.click(canvas.getByRole('button', { name: /Show the/ }))
    await waitFor(() => expect(openCallout()).not.toBeNull())
    await waitFor(() =>
      expect(openCallout()?.contains(document.activeElement)).toBe(true),
    )
  }}
/>

<Story
  name="A click outside leaves it up"
  play={async ({ args, canvas }: any) => {
    await userEvent.click(canvas.getByRole('button', { name: /Show the/ }))
    await waitFor(() => expect(openCallout()).not.toBeNull())
    const bystander = canvas.getByRole('button', { name: 'Bystander' })
    await userEvent.click(bystander)
    // The click reaches the page underneath, and the callout stays.
    expect(bystander.dataset.clicked).toBe('yes')
    expect(openCallout()).not.toBeNull()
    expect(args.onclose).not.toHaveBeenCalled()
  }}
>
  {#snippet template(args: any)}
    <div class="stage">
      <Button bind:element={anchor} onclick={() => (open = true)}>
        Show the callout
      </Button>
      <Callout {...args} {anchor} bind:open>
        {@render body(() => (open = false), 'A click outside changes nothing.')}
      </Callout>
      <button
        type="button"
        onclick={(e) =>
          ((e.currentTarget as HTMLElement).dataset.clicked = 'yes')}
      >
        Bystander
      </button>
    </div>
  {/snippet}
</Story>

<Story
  name="Escape only near the callout"
  play={async ({ args, canvas }: any) => {
    await userEvent.click(canvas.getByRole('button', { name: /Show the/ }))
    await waitFor(() => expect(openCallout()).not.toBeNull())

    // Focus somewhere unrelated. Escape belongs to the page there.
    canvas.getByRole('button', { name: 'Bystander' }).focus()
    await userEvent.keyboard('{Escape}')
    expect(openCallout()).not.toBeNull()
    expect(args.onclose).not.toHaveBeenCalled()

    // On the anchor it closes, which is where focus sits after the click that
    // usually opens a callout.
    canvas.getByRole('button', { name: /Show the/ }).focus()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(openCallout()).toBeNull())
    expect(args.onclose).toHaveBeenCalledTimes(1)
  }}
>
  {#snippet template(args: any)}
    <div class="stage">
      <Button bind:element={anchor} onclick={() => (open = true)}>
        Show the callout
      </Button>
      <Callout {...args} {anchor} bind:open>
        {@render body(() => (open = false), 'Escape works from the anchor.')}
      </Callout>
      <button type="button">Bystander</button>
    </div>
  {/snippet}
</Story>

<Story name="Opens on its own">
  {#snippet template(args: any)}
    <div class="stage">
      <Button
        bind:element={anchor}
        onclick={() => {
          timedOpen = false
          setTimeout(() => (timedOpen = true), 1000)
        }}
      >
        Open in a second
      </Button>
      <Callout
        {...args}
        {anchor}
        bind:open={timedOpen}
        label="Something worth a look"
      >
        {@render body(
          () => (timedOpen = false),
          'This one opened without anyone asking, so it announces itself instead of taking focus.',
        )}
      </Callout>
    </div>
  {/snippet}
</Story>

<Story
  name="Against a viewport edge"
  play={async ({ canvas }: any) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Corner' }))
    await waitFor(() => expect(openCallout()).not.toBeNull())
    const anchorRect = (
      canvas.getByRole('button', { name: 'Corner' }) as HTMLElement
    ).getBoundingClientRect()
    const card = openCallout() as HTMLElement
    const cardRect = card.getBoundingClientRect()
    const arrowRect = (
      card.querySelector('.arrow') as HTMLElement
    ).getBoundingClientRect()
    const arrowCentre = arrowRect.x + arrowRect.width / 2

    // The window edge pushes the card off the anchor rather than letting it
    // hang over the edge.
    expect(cardRect.right).toBeLessThanOrEqual(window.innerWidth)
    expect(cardRect.x + cardRect.width / 2).toBeLessThan(
      anchorRect.x + anchorRect.width / 2,
    )
    // The arrow gives that shift back, so it still points at the anchor.
    expect(arrowCentre).toBeGreaterThan(cardRect.x + cardRect.width / 2)
    expect(arrowCentre).toBeGreaterThan(anchorRect.x)
    expect(arrowCentre).toBeLessThan(anchorRect.right)
  }}
>
  {#snippet template(args: any)}
    <div class="edge-stage">
      <Button bind:element={edgeAnchor} onclick={() => (edgeOpen = true)}>
        Corner
      </Button>
      <Callout
        {...args}
        anchor={edgeAnchor}
        bind:open={edgeOpen}
        label="Pushed off centre"
      >
        {@render body(
          () => (edgeOpen = false),
          'The card is held inside the window and the arrow slides back over the anchor.',
        )}
      </Callout>
    </div>
  {/snippet}
</Story>

<Story name="Inside a scrolling container">
  {#snippet template(args: any)}
    <div class="scroller">
      <div class="filler"></div>
      <Button bind:element={scrollAnchor} onclick={() => (scrollOpen = true)}>
        Scroll me out of view
      </Button>
      <Callout
        {...args}
        anchor={scrollAnchor}
        bind:open={scrollOpen}
        label="Follows its anchor"
      >
        {@render body(
          () => (scrollOpen = false),
          'Scrolling the container moves the callout, and takes it away once the anchor is gone.',
        )}
      </Callout>
      <div class="filler"></div>
    </div>
  {/snippet}
</Story>

<style lang="sass">
  .stage
    display: flex
    gap: var(--tint-size-16)
    align-items: flex-start
    padding-block: var(--tint-size-80)
    padding-inline: var(--tint-size-24)

  // Room on every side of the anchor, so the requested side is the one used.
  .middle-stage
    display: flex
    align-items: center
    justify-content: center
    block-size: 560px

  .edge-stage
    display: flex
    justify-content: flex-end
    padding-block: var(--tint-size-8)
    padding-inline: var(--tint-size-8)

  .scroller
    block-size: 300px
    overflow-y: auto
    border: 1px solid var(--tint-card-border)
    border-radius: var(--tint-radius-card)
    padding-inline: var(--tint-size-24)

  .filler
    block-size: 400px

  .body
    display: flex
    flex-direction: column
    align-items: flex-start
    gap: var(--tint-size-8)
    padding-block: var(--tint-size-16)
    padding-inline: var(--tint-size-16)
    max-inline-size: 260px
</style>
