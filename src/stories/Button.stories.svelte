<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Button from '@lib/components/Button.svelte'
  import { expect, fn, userEvent } from 'storybook/test'
  import Menu, { type ContextClickHandler } from '@lib/components/Menu.svelte'
  import IconHome from '@lib/icons/20-home.svg?raw'
  import ButtonDocs from './docs/Button.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/Button',
    component: Button,
    render: child,
    parameters: {
      docs: { description: { component: ButtonDocs } },
    },
    argTypes: {
      toggled: {
        control: 'boolean',
        defaultValue: undefined,
      },
      href: {
        control: 'text',
      },
      external: {
        control: 'boolean',
        if: { arg: 'href' },
      },
      download: {
        control: 'text',
        if: { arg: 'href' },
      },
    },
    args: {
      onclick: fn(),
      onkeypress: fn(),
      onkeydown: fn(),
    },
  })

  let openMenu: ContextClickHandler | undefined = $state(undefined)
  let revealed = $state(false)

  /**
   * An icon button's tooltip is its only name, and a later render must not take
   * it away.
   */
  const keepsItsName = async ({ canvas }: any) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Reveal' }))
    await expect(canvas.getByRole('button', { name: 'Home' })).toBeVisible()
  }
</script>

{#snippet child(args: any)}
  <Button {...args}>
    {#if args.icon}
      {@html IconHome}
    {:else}
      Hello!
    {/if}
  </Button>
{/snippet}

<Story
  name="Primary"
  args={{ variant: 'primary', small: false, disabled: false, icon: false }}
/>

<Story
  name="Secondary"
  args={{ variant: 'secondary', small: false, disabled: false, icon: false }}
/>

<Story
  name="Ghost"
  args={{ variant: 'ghost', small: false, disabled: false, icon: false }}
/>

<Story
  name="Icon"
  args={{
    variant: 'secondary',
    small: false,
    disabled: false,
    icon: true,
    'aria-label': 'Home',
  }}
/>

<Story
  name="Small"
  args={{ variant: 'secondary', small: true, disabled: false, icon: false }}
/>

<Story name="Loading" args={{ variant: 'secondary', loading: true }} />

<Story
  name="With Tooltip"
  args={{
    variant: 'secondary',
    tooltip: 'This is a helpful tooltip explaining this button',
  }}
/>

<Story name="Icon trigger for a menu" play={keepsItsName}>
  {#snippet template(args: any)}
    <Button onclick={() => (revealed = true)}>Reveal</Button>
    {#if revealed}
      <Button {...args} icon variant="ghost" tooltip="Home" onclick={openMenu}>
        {@html IconHome}
      </Button>
      <Menu
        variant="button"
        bind:contextClick={openMenu}
        items={[{ label: 'Here', onClick: () => {} }]}
      />
    {/if}
  {/snippet}
</Story>
