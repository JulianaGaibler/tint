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
  import { expect, userEvent } from 'storybook/test'

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
      hint: '⌘1',
      onClick: noop,
    },
    {
      label: 'Item 2',
      hint: '⇧⌘2',
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
  /** A hint reaches the end of its row whichever gutters the menu draws. */
  const hintsReachTheEnd = async ({ canvas }: any) => {
    await userEvent.click(canvas.getByRole('button'))

    const rows = Array.from(
      document.querySelectorAll('li.item_default'),
    ).filter((li) => li.querySelector('.item-hint'))
    await expect(rows.length).toBeGreaterThan(0)

    for (const li of rows) {
      const hint = li.querySelector('.item-hint')!.getBoundingClientRect()
      // The row's own padding is all that may follow it. Anything more and it stopped at a gutter.
      const after = li.getBoundingClientRect().right - hint.right
      await expect(after).toBeLessThanOrEqual(9)
    }
  }

  /** A hint and a check, so both gutters are drawn. */
  const bothGutters: MenuItem[] = [
    { label: 'Cut', hint: '⌘X', checked: false, onClick: () => {} },
    { label: 'Copy', hint: '⇧⌘C', onClick: () => {} },
    { label: 'Share', items: [{ label: 'By link', onClick: () => {} }] },
  ]

  /** A hint and a submenu, and nothing checked. */
  const rightGutterOnly: MenuItem[] = [
    { label: 'Cut', hint: '⌘X', onClick: () => {} },
    { label: 'Copy', hint: '⇧⌘C', onClick: () => {} },
    { label: 'Share', items: [{ label: 'By link', onClick: () => {} }] },
  ]

  /** A hint and a check, and no submenu anywhere. */
  const leftGutterOnly: MenuItem[] = [
    { label: 'Cut', hint: '⌘X', checked: true, onClick: () => {} },
    { label: 'Copy', hint: '⇧⌘C', onClick: () => {} },
  ]

  /** A hint on a submenu item is dropped, so the arrow keeps the end of the row. */
  const submenuKeepsItsArrow = async ({ canvas }: any) => {
    await userEvent.click(canvas.getByRole('button'))

    const row = Array.from(document.querySelectorAll('li.item_default')).find(
      (li) => li.textContent?.includes('Share'),
    )!
    await expect(row.querySelector('.item-hint')).toBeNull()
    await expect(row.classList.contains('with-hint')).toBe(false)

    // Placing the label cell to the last line would leave the arrow to be auto placed into the
    // first free one, at the front of the row.
    const arrow = row.querySelector('svg')!.getBoundingClientRect()
    const after = row.getBoundingClientRect().right - arrow.right
    await expect(after).toBeLessThanOrEqual(9)
  }

  /** What a consumer without types can still write. The type forbids it. */
  const hintOnSubmenu = [
    { label: 'Copy', hint: '⇧⌘C', onClick: () => {} },
    {
      label: 'Share',
      hint: '⌘S',
      items: [{ label: 'By link', onClick: () => {} }],
    },
  ] as unknown as MenuItem[]

  /** Hints alone, so neither gutter is drawn. */
  const noGutters: MenuItem[] = [
    { label: 'Cut', hint: '⌘X', onClick: () => {} },
    { label: 'Copy', hint: '⇧⌘C', onClick: () => {} },
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

<Story
  name="Hints with both gutters"
  args={{ variant: 'button', items: bothGutters }}
  play={hintsReachTheEnd}
/>

<Story
  name="Hints with the arrow gutter"
  args={{ variant: 'button', items: rightGutterOnly }}
  play={hintsReachTheEnd}
/>

<Story
  name="Hints with the check gutter"
  args={{ variant: 'button', items: leftGutterOnly }}
  play={hintsReachTheEnd}
/>

<Story
  name="Hints with no gutters"
  args={{ variant: 'button', items: noGutters }}
  play={hintsReachTheEnd}
/>

<Story
  name="Hint on a submenu item"
  args={{ variant: 'button', items: hintOnSubmenu }}
  play={submenuKeepsItsArrow}
/>

<style lang="sass">
  .ctx-area
    padding: 2rem
    background: #eee
    border: 2px dashed #ccc
    user-select: none
</style>
