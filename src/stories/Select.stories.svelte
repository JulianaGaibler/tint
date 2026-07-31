<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Select, { SELECT_SEPARATOR } from '@lib/components/Select.svelte'
  import { fn } from 'storybook/test'
  import SelectDocs from './docs/Select.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/Select',
    component: Select,
    parameters: { docs: { description: { component: SelectDocs } } },
    args: {
      onchange: fn(),
    },
  })
</script>

<script lang="ts">
  let items = [
    { value: 1, label: 'Apple' },
    { value: 2, label: 'Cherry' },
    { value: 3, label: 'Lemon', disabled: true },
    { value: 4, label: 'Pear' },
  ]

  let itemsWithSeparators = [
    { value: 1, label: 'Apple' },
    { value: 2, label: 'Cherry' },
    SELECT_SEPARATOR as typeof SELECT_SEPARATOR,
    { value: 3, label: 'Lemon', disabled: true },
    { value: 4, label: 'Pear' },
  ]
</script>

<Story
  name="Basic"
  args={{ id: 'select', label: 'Fruit', value: undefined, items }}
>
  {#snippet template(args: any)}
    <Select {...args} />
  {/snippet}
</Story>

<Story
  name="With separators"
  args={{
    id: 'select-sep',
    label: 'Fruit',
    value: undefined,
    items: itemsWithSeparators,
  }}
>
  {#snippet template(args: any)}
    <Select {...args} />
  {/snippet}
</Story>
