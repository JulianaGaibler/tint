<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import CollapsibleCard from '@src/lib/components/CollapsibleCard.svelte'
  import CollapsibleCardDocs from './docs/CollapsibleCard.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/CollapsibleCard',
    component: CollapsibleCard,
    parameters: { docs: { description: { component: CollapsibleCardDocs } } },
    render: card,
    args: {
      variant: 'bg',
      open: true,
      padded: true,
    },
    argTypes: {
      variant: { control: 'select', options: ['bg', 'bg-secondary'] },
      open: { control: 'boolean' },
      padded: { control: 'boolean' },
    },
  })
</script>

{#snippet summary()}
  Details
{/snippet}

{#snippet card(args: any)}
  <CollapsibleCard {...args} {summary}>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
      consectetur, nisl ut aliquam ultricies, nunc nisl aliquet sapien, eget
      aliquam nunc nisi quis nunc.
    </p>
  </CollapsibleCard>
{/snippet}

<Story name="Default" />
