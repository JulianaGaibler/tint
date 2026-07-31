<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Toggleable from '@lib/components/Toggleable.svelte'
  import { fn, expect, userEvent } from 'storybook/test'
  import ToggleableDocs from './docs/Toggleable.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/Toggleable',
    component: Toggleable,
    render: template,
    parameters: { docs: { description: { component: ToggleableDocs } } },
    argTypes: {
      type: {
        control: 'inline-radio',
        options: ['checkbox', 'radio', 'switch'],
      },
      id: {
        control: 'text',
      },
      checked: {
        control: 'boolean',
      },
      'aria-label': {
        control: 'text',
      },
      'aria-describedby': {
        control: 'text',
      },
      'aria-labelledby': {
        control: 'text',
      },
    },
    args: {
      onchange: fn(),
    },
  })
</script>

{#snippet template(args: any)}
  <Toggleable {...args} />
{/snippet}

<Story
  name="Checkbox"
  args={{ checked: false, id: 'checkbox-input', type: 'checkbox' }}
  play={async ({ args, canvas }: any) => {
    const checkbox = canvas.getByRole('checkbox')

    // Initial state should be unchecked
    await expect(checkbox).not.toBeChecked()

    // Click the checkbox to toggle it
    await userEvent.click(checkbox)

    // Should now be checked
    await expect(checkbox).toBeChecked()

    // Verify the onchange callback was called with { checked: true }
    await expect(args.onchange).toHaveBeenCalledWith({ checked: true })

    // Click again to uncheck
    await userEvent.click(checkbox)

    // Should be unchecked again
    await expect(checkbox).not.toBeChecked()

    // Verify the onchange callback was called with { checked: false }
    await expect(args.onchange).toHaveBeenCalledWith({ checked: false })
  }}
/>

<Story
  name="Radio"
  args={{ checked: false, id: 'radio-input', type: 'radio' }}
  play={async ({ args, canvas }: any) => {
    const radio = canvas.getByRole('radio')

    // Initial state should be unchecked
    await expect(radio).not.toBeChecked()

    // Click the radio button to toggle it
    await userEvent.click(radio)

    // Should now be checked
    await expect(radio).toBeChecked()

    // Verify the onchange callback was called with { checked: true }
    await expect(args.onchange).toHaveBeenCalledWith({ checked: true })
  }}
/>

<Story
  name="Switch"
  args={{
    checked: false,
    id: 'switch-input',
    type: 'switch',
    'aria-labelledby': 'switch-label',
  }}
  play={async ({ args, canvas }: any) => {
    const switchElement = canvas.getByRole('switch')

    // Initial state should be unchecked (aria-checked="false")
    await expect(switchElement).toHaveAttribute('aria-checked', 'false')

    // Click the switch to toggle it
    await userEvent.click(switchElement)

    // Should now be checked (aria-checked="true")
    await expect(switchElement).toHaveAttribute('aria-checked', 'true')

    // Verify the onchange callback was called with { checked: true }
    await expect(args.onchange).toHaveBeenCalledWith({ checked: true })

    // Click again to toggle back
    await userEvent.click(switchElement)

    // Should be unchecked again
    await expect(switchElement).toHaveAttribute('aria-checked', 'false')

    // Verify the onchange callback was called with { checked: false }
    await expect(args.onchange).toHaveBeenCalledWith({ checked: false })
  }}
/>
