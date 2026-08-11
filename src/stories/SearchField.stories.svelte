<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import SearchField from '@lib/components/SearchField.svelte'
  import { fn } from 'storybook/test'
  import SearchFieldDocs from './docs/SearchField.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/SearchField',
    component: SearchField,
    parameters: { docs: { description: { component: SearchFieldDocs } } },
    args: {
      onsearch: fn(),
    },
  })
</script>

<Story name="Basic" args={{ id: 'input' }}>
  {#snippet template(args: any)}
    <SearchField {...args} />
  {/snippet}
</Story>

<Story
  name="Filled backdrop"
  args={{ id: 'input-filled-backdrop', filledBackdrop: true }}
>
  {#snippet template(args: any)}
    <SearchField {...args} />
  {/snippet}
</Story>
