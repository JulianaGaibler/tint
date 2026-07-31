<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import MessageBox from '@src/lib/components/MessageBox.svelte'
  import IconHome from '@lib/icons/20-home.svg?raw'
  import { fn } from 'storybook/test'
  import MessageBoxDocs from './docs/MessageBox.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/MessageBox',
    component: MessageBox,
    parameters: { docs: { description: { component: MessageBoxDocs } } },
    render: child,
    args: {
      onclose: fn(),
    },
  })
</script>

{#snippet child(args: any)}
  <MessageBox {...args}>
    <h2>Title</h2>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
      consectetur, nisl ut aliquam ultricies, nunc nisl aliquet sapien, eget
      aliquam nunc nisi quis nunc. Nulla facilisi.
    </p>
  </MessageBox>
{/snippet}

<Story name="Default" args={{ icon: IconHome, dismissable: true }} />

<Story name="Not dismissable" args={{ icon: IconHome, dismissable: false }} />

<Story name="No icon" args={{ icon: undefined, dismissable: true }} />
