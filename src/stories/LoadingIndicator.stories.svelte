<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import LoadingIndicator from '@lib/components/LoadingIndicator.svelte'
  import LoadingIndicatorDocs from './docs/LoadingIndicator.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/LoadingIndicator',
    component: LoadingIndicator,
    parameters: { docs: { description: { component: LoadingIndicatorDocs } } },
  })
</script>

<Story name="Default">
  {#snippet template(args: any)}
    <LoadingIndicator {...args} />
  {/snippet}
</Story>
