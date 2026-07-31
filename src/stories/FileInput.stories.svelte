<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import FileInput from '@lib/components/FileInput.svelte'
  import FileInputDocs from './docs/FileInput.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/FileInput',
    component: FileInput,
    parameters: { docs: { description: { component: FileInputDocs } } },
    render: child,
  })
</script>

{#snippet child(args: any)}
  <FileInput {...args} />
{/snippet}

<Story name="Basic" args={{ id: 'input', label: 'Label' }} />

<Story
  name="Helper text"
  args={{
    id: 'input',
    label: 'Profile picture',
    accept: 'image/*',
    helperText: 'Upload a profile picture',
  }}
/>

<Story
  name="Error text"
  args={{
    id: 'input',
    label: 'Profile picture',
    error: 'File needs to be an image',
    accept: 'image/*',
  }}
/>
