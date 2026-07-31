<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import AttributePicker from '@lib/components/AttributePicker.svelte'
  import { fn } from 'storybook/test'
  import AttributePickerDocs from './docs/AttributePicker.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/AttributePicker',
    component: AttributePicker,
    parameters: { docs: { description: { component: AttributePickerDocs } } },
    render: child,
    argTypes: {
      autocomplete: { control: 'select' },
    },
    args: {
      onitemadded: fn(),
    },
  })
</script>

{#snippet child(args: any)}
  <AttributePicker {...args} />
{/snippet}

<Story
  name="Basic"
  args={{
    id: 'attribute-picker-basic',
    label: 'Label',
    value: ['apple', 'pear'],
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'orange', label: 'Orange' },
      { value: 'grape', label: 'Grape' },
      { value: 'kiwi', label: 'Kiwi' },
      { value: 'mango', label: 'Mango' },
      { value: 'peach', label: 'Peach' },
      { value: 'pear', label: 'Pear' },
      { value: 'pineapple', label: 'Pineapple' },
      { value: 'strawberry', label: 'Strawberry' },
      { value: 'watermelon', label: 'Watermelon' },
    ],
  }}
/>

<Story
  name="Helper text"
  args={{
    id: 'attribute-picker-helper',
    label: 'Select fruits',
    value: ['apple'],
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'orange', label: 'Orange' },
    ],
    helperText: 'Choose your favorite fruits',
  }}
/>

<Story
  name="Error text"
  args={{
    id: 'attribute-picker-error',
    label: 'Select fruits',
    value: [],
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'orange', label: 'Orange' },
    ],
    error: 'You must select at least one fruit',
  }}
/>
