<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import ProgressBar from '@src/lib/components/ProgressBar.svelte'
  import ProgressBarDocs from './docs/ProgressBar.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/ProgressBar',
    component: ProgressBar,
    parameters: { docs: { description: { component: ProgressBarDocs } } },
    argTypes: {
      progress: {
        control: { type: 'range', min: 0, max: 100, step: 1 },
        description: 'Progress percentage (0-100)',
      },
      active: {
        control: 'boolean',
        description:
          'Whether the progress indicator is active (shows squiggle animation)',
      },
      showProgress: {
        control: 'boolean',
        description: 'Whether to show the progress percentage text',
      },
    },
    args: {
      progress: 75,
      active: true,
      showProgress: false,
    },
  })
</script>

<Story name="Default" args={{ progress: 75 }}>
  {#snippet template(args: any)}
    <div style="width: 300px;">
      <ProgressBar {...args} />
    </div>
  {/snippet}
</Story>

<Story name="With Progress Text" args={{ progress: 45, showProgress: true }}>
  {#snippet template(args: any)}
    <div style="width: 300px;">
      <ProgressBar {...args} />
    </div>
  {/snippet}
</Story>

<Story name="Inactive" args={{ progress: 60, active: false }}>
  {#snippet template(args: any)}
    <div style="width: 300px;">
      <ProgressBar {...args} />
    </div>
  {/snippet}
</Story>

<Story name="Complete" args={{ progress: 100, showProgress: true }}>
  {#snippet template(args: any)}
    <div style="width: 300px;">
      <ProgressBar {...args} />
    </div>
  {/snippet}
</Story>

<Story name="Just Started" args={{ progress: 5, showProgress: true }}>
  {#snippet template(args: any)}
    <div style="width: 300px;">
      <ProgressBar {...args} />
    </div>
  {/snippet}
</Story>

<Story name="No Progress" args={{ progress: 0, showProgress: true }}>
  {#snippet template(args: any)}
    <div style="width: 300px;">
      <ProgressBar {...args} />
    </div>
  {/snippet}
</Story>
