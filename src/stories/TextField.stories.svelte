<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import TextField from '@lib/components/TextField.svelte'
  import TextFieldDocs from './docs/TextField.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/TextField',
    component: TextField,
    render: child,
    parameters: { docs: { description: { component: TextFieldDocs } } },
    argTypes: {
      autocomplete: { control: 'select' },
    },
  })
</script>

{#snippet child(args: any)}
  <TextField {...args} />
{/snippet}

<Story name="Basic" args={{ id: 'input', label: 'Label' }} />

<Story
  name="Helper text"
  args={{
    id: 'input',
    label: 'New password',
    helperText: 'Should contain a special character',
  }}
/>

<Story
  name="Error text"
  args={{
    id: 'input',
    label: 'New password',
    error: 'Password must be at least 8 characters long',
  }}
/>

<Story
  name="Number"
  args={{
    id: 'input',
    label: 'Quantity',
    type: 'number',
    value: '1',
    min: 0,
    max: 10,
    step: 1,
  }}
/>
