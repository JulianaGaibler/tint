<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Menu, {
    MENU_SEPARATOR,
    type MenuItem,
  } from '@lib/components/Menu.svelte'
  import Btn from '@src/lib/components/Button.svelte'
  import StarIcon from '@lib/icons/20-crown.svg?raw'
  import InfoIcon from '@lib/icons/20-info.svg?raw'
  import MenuDocs from './docs/Menu.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/Menu',
    component: Menu,
    parameters: { docs: { description: { component: MenuDocs } } },
    render: child,
  })
  let contextClickHandlers: ((e: Event) => void) | undefined = $state()

  const noop = () => {}

  const items: MenuItem[] = [
    {
      label: 'Item 1',
      onClick: noop,
    },
    {
      label: 'Item 2',
      checked: true,
      onClick: () => noop,
    },
    {
      label: 'Item 3',
      disabled: true,
      onClick: () => noop,
    },
    MENU_SEPARATOR,
    {
      label: 'Item 4',
      items: [
        {
          label: 'Item 4.1',
          onClick: () => noop,
        },
        {
          label: 'Item 4.2',
          onClick: () => noop,
        },
      ],
    },
    {
      label: 'Item 5',
      onClick: () => console.log('Item 5'),
    },
  ]

  const itemsWithIcons: MenuItem[] = [
    {
      label: 'Starred',
      icon: StarIcon,
      onClick: noop,
    },
    {
      label: 'Information',
      icon: InfoIcon,
      checked: true,
      onClick: () => noop,
    },
    {
      label: 'Disabled Item',
      icon: StarIcon,
      disabled: true,
      onClick: () => noop,
    },
    MENU_SEPARATOR,
    {
      label: 'More Options',
      icon: InfoIcon,
      items: [
        {
          label: 'Sub Item 1',
          icon: StarIcon,
          onClick: () => noop,
        },
        {
          label: 'Sub Item 2',
          icon: InfoIcon,
          onClick: () => noop,
        },
      ],
    },
  ]

  const itemsHiddenGutter: MenuItem[] = [
    {
      label: 'Home',
      icon: StarIcon,
      onClick: noop,
    },
    {
      label: 'Settings',
      icon: InfoIcon,
      onClick: () => noop,
    },
    {
      label: 'Profile',
      onClick: () => noop,
    },
    MENU_SEPARATOR,
    {
      label: 'Help',
      icon: InfoIcon,
      onClick: () => noop,
    },
    {
      label: 'About',
      icon: StarIcon,
      disabled: true,
      onClick: () => noop,
    },
  ]
</script>

{#snippet child(args: any)}
  {#if args.variant === 'button'}
    <Btn onclick={contextClickHandlers}>Open menu</Btn>
  {:else}
    <div
      role="button"
      tabindex="0"
      class="ctx-area"
      oncontextmenu={contextClickHandlers}
    >
      Right click here
    </div>
  {/if}
  <Menu bind:contextClick={contextClickHandlers} {...args} />
{/snippet}

<Story name="Button" args={{ variant: 'button', items }} />

<Story name="Context" args={{ variant: 'context', items }} />

<Story name="Animated" args={{ variant: 'button', items, animated: true }} />

<Story name="Large size" args={{ variant: 'button', items, size: 'large' }} />

<Story name="With icons" args={{ variant: 'button', items: itemsWithIcons }} />

<Story
  name="Auto-hidden gutters"
  args={{
    variant: 'button',
    items: itemsHiddenGutter,
    size: 'large',
    animated: true,
  }}
/>

<style lang="sass">
  .ctx-area
    padding: 2rem
    background: #eee
    border: 2px dashed #ccc
    user-select: none
</style>
