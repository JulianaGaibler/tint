<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Filmstrip from '@lib/components/Filmstrip.svelte'
  import type { FilmstripInstance } from '@lib/components/Filmstrip.svelte'
  import Button from '@lib/components/Button.svelte'
  import { fn, expect, userEvent, waitFor } from 'storybook/test'

  // A 90-frame 20px download indicator: the arrow drops into the tray and the
  // cycle repeats. Imported raw so the component receives an SVG string.
  import DOWNLOAD_SVG from './filmstrip-download.svg?raw'
  import FilmstripDocs from './docs/Filmstrip.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/Filmstrip',
    component: Filmstrip,
    parameters: { docs: { description: { component: FilmstripDocs } } },
    render: template,
    args: {
      svg: DOWNLOAD_SVG,
      oncomplete: fn(),
      onplay: fn(),
      onpause: fn(),
      loop: false,
      autoplay: true,
    },
    argTypes: {
      svg: { control: false },
      duration: { control: { type: 'range', min: 100, max: 5000, step: 50 } },
      fps: { control: { type: 'range', min: 1, max: 60, step: 1 } },
      frameCount: { control: 'number' },
      frameSize: { control: 'number' },
      renderSize: { control: { type: 'range', min: 16, max: 128, step: 4 } },
      loop: { control: 'boolean' },
      autoplay: { control: 'boolean' },
      playing: { control: 'boolean' },
      staticFrame: { control: 'text' },
      label: { control: 'text' },
    },
  })

  // State for the interactive controls story.
  let instance = $state<FilmstripInstance>()
  let isPlaying = $state(false)
</script>

{#snippet template(args: any)}
  <Filmstrip {...args} />
{/snippet}

<Story
  name="Looping"
  args={{ loop: true, renderSize: 32, label: 'Downloading' }}
/>

<Story
  name="Play once"
  args={{ loop: false, duration: 1500, renderSize: 48, label: 'Download' }}
  play={async ({ args }: any) => {
    // The animation runs for `duration`; wait for the completion callback.
    await waitFor(() => expect(args.oncomplete).toHaveBeenCalled(), {
      timeout: 3000,
    })
  }}
/>

<Story
  name="Interactive controls"
  args={{ duration: 2000 }}
  play={async ({ args, canvas }: any) => {
    // Start playback via the imperative API and confirm the callback fires.
    await userEvent.click(canvas.getByRole('button', { name: 'Play' }))
    await expect(args.onplay).toHaveBeenCalled()

    // Pause and confirm the pause callback fires.
    await userEvent.click(canvas.getByRole('button', { name: 'Pause' }))
    await expect(args.onpause).toHaveBeenCalled()
  }}
>
  {#snippet template(args: any)}
    <div class="controls-demo">
      <Filmstrip
        bind:this={instance}
        bind:playing={isPlaying}
        {...args}
        autoplay={false}
        renderSize={64}
      />
      <div class="buttons">
        <Button small onclick={() => instance?.play()}>Play</Button>
        <Button small onclick={() => instance?.pause()}>Pause</Button>
        <Button small onclick={() => instance?.stop()}>Stop</Button>
        <Button small onclick={() => instance?.restart()}>Restart</Button>
      </div>
      <p class="status">Playing: {isPlaying}</p>
    </div>
  {/snippet}
</Story>

<Story
  name="Scaled up"
  args={{ loop: true, renderSize: 128, label: 'Downloading' }}
/>

<Story
  name="Static frame"
  args={{
    autoplay: false,
    staticFrame: 'first',
    renderSize: 48,
    label: 'Download',
  }}
/>

<Story
  name="Frame overrides"
  args={{
    loop: true,
    frameCount: 90,
    frameSize: 20,
    renderSize: 32,
    label: 'Downloading',
  }}
/>

<style lang="sass">
  .controls-demo
    display: flex
    flex-direction: column
    gap: var(--tint-size-16)
    align-items: flex-start

  .buttons
    display: flex
    gap: var(--tint-size-8)

  .status
    margin: 0
    color: var(--tint-text-secondary)
</style>
