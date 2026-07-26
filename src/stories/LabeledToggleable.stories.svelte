<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import LabeledToggleable from '@lib/components/LabeledToggleable.svelte'
  import { fn, expect, userEvent } from 'storybook/test'
  import { createRadioGroup, createCheckboxGroup } from '@lib/stores/index.js'
  import IconHome from '@lib/icons/20-home.svg?raw'

  const { Story } = defineMeta({
    title: 'Components/LabeledToggleable',
    component: LabeledToggleable,
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
      value: {
        control: 'text',
      },
      label: {
        control: 'text',
      },
      description: {
        control: 'text',
      },
      icon: {
        control: 'text',
      },
      disabled: {
        control: 'boolean',
      },
    },
    args: {
      onchange: fn(),
    },
  })
</script>

<script>
  // Create group stores for the examples
  const selectedInterests = createCheckboxGroup(['tech']) // Pre-select technology
  const notificationPreference = createRadioGroup('important') // Pre-select important only
</script>

<!-- Basic checkbox with text label and description -->
<Story
  name="Checkbox with Text"
  args={{
    checked: false,
    id: 'checkbox-labeled',
    type: 'checkbox',
    label: 'Enable notifications',
    description: 'Receive email notifications about important updates',
  }}
  play={async ({ canvas }: any) => {
    const checkbox = canvas.getByRole('checkbox')
    const label = canvas.getByText('Enable notifications')

    // Initial state should be unchecked
    await expect(checkbox).not.toBeChecked()

    // Click the label to toggle the checkbox
    await userEvent.click(label)

    // Should now be checked
    await expect(checkbox).toBeChecked()
  }}
>
  {#snippet template(args: any)}
    <div>
      <LabeledToggleable {...args} />
    </div>
  {/snippet}
</Story>

<!-- Checkbox with icon in label -->
<Story
  name="Checkbox with Icon"
  args={{
    checked: false,
    id: 'checkbox-icon',
    type: 'checkbox',
    label: 'Send marketing emails',
    icon: IconHome,
    description: 'Receive promotional offers and product updates',
  }}
>
  {#snippet template(args: any)}
    <div>
      <LabeledToggleable {...args} />
    </div>
  {/snippet}
</Story>

<!-- Radio button example -->
<Story
  name="Radio Button"
  args={{
    checked: false,
    id: 'radio-option1',
    type: 'radio',
    label: 'Option 1',
    description: 'This is the first option',
    value: 'option1',
  }}
  play={async ({ canvas }: any) => {
    const radio = canvas.getByRole('radio')

    // Initial state should be unchecked
    await expect(radio).not.toBeChecked()

    // Click to select
    await userEvent.click(radio)

    // Should now be checked
    await expect(radio).toBeChecked()
  }}
>
  {#snippet template(args: any)}
    <div>
      <LabeledToggleable {...args} />
    </div>
  {/snippet}
</Story>

<!-- Switch example -->
<Story
  name="Switch"
  args={{
    checked: false,
    id: 'switch-labeled',
    type: 'switch',
    label: 'Dark mode',
    description: 'Toggle between light and dark themes',
  }}
  play={async ({ canvas }: any) => {
    const switchElement = canvas.getByRole('switch')

    // Initial state should be unchecked
    await expect(switchElement).toHaveAttribute('aria-checked', 'false')

    // Click the switch
    await userEvent.click(switchElement)

    // Should now be checked
    await expect(switchElement).toHaveAttribute('aria-checked', 'true')
  }}
>
  {#snippet template(args: any)}
    <div>
      <LabeledToggleable {...args} />
    </div>
  {/snippet}
</Story>

<!-- Example with custom slots -->
<Story name="Custom Slots">
  {#snippet template(_args: any)}
    <div>
      <LabeledToggleable id="custom-slots" type="checkbox" checked={false}>
        {#snippet labelSlot()}
          <strong>Custom Label</strong>
          <em>(with emphasis)</em>
        {/snippet}

        {#snippet descriptionSlot()}
          <span style="color: #666;">
            This is a custom description with
            <button
              type="button"
              style="color: inherit; text-decoration: underline; background: none; border: none; padding: 0; cursor: pointer;"
              >a link</button
            >
          </span>
        {/snippet}

        Additional content can go here, like help text or other controls.
      </LabeledToggleable>
    </div>
  {/snippet}
</Story>

<!-- Disabled state -->
<Story
  name="Disabled"
  args={{
    checked: false,
    id: 'disabled-checkbox',
    type: 'checkbox',
    label: 'Disabled option',
    description: 'This option is currently disabled',
    disabled: true,
  }}
>
  {#snippet template(args: any)}
    <div>
      <LabeledToggleable {...args} />
    </div>
  {/snippet}
</Story>

<!-- Example with groupStore for checkboxes -->
<Story name="Checkbox Group">
  {#snippet template(_args: any)}
    <div>
      <h3>Select your interests:</h3>
      <div style="display: grid; gap: 1rem;">
        <LabeledToggleable
          id="interest-tech"
          type="checkbox"
          value="tech"
          groupStore={selectedInterests}
          label="Technology"
          description="Latest tech news and updates"
        />
        <LabeledToggleable
          id="interest-sports"
          type="checkbox"
          value="sports"
          groupStore={selectedInterests}
          label="Sports"
          description="Sports news and highlights"
        />
        <LabeledToggleable
          id="interest-music"
          type="checkbox"
          value="music"
          groupStore={selectedInterests}
          label="Music"
          description="New releases and music news"
        />
        <LabeledToggleable
          id="interest-travel"
          type="checkbox"
          value="travel"
          groupStore={selectedInterests}
          label="Travel"
          description="Travel tips and destination guides"
        />
      </div>
      <div class="result-display">
        <strong>Selected interests:</strong>
        {Array.isArray($selectedInterests) && $selectedInterests.length > 0
          ? $selectedInterests.join(', ')
          : 'None'}
      </div>
    </div>
  {/snippet}
</Story>

<!-- Radio button group with proper group binding -->
<Story name="Radio Group with Binding">
  {#snippet template(_args: any)}
    <div>
      <h3>Choose your notification preference:</h3>
      <div style="display: grid; gap: 1rem;">
        <LabeledToggleable
          id="notify-all"
          type="radio"
          value="all"
          groupStore={notificationPreference}
          label="All notifications"
          description="Receive all types of notifications immediately"
        />
        <LabeledToggleable
          id="notify-important"
          type="radio"
          value="important"
          groupStore={notificationPreference}
          label="Important only"
          description="Only receive notifications for critical updates"
        />
        <LabeledToggleable
          id="notify-digest"
          type="radio"
          value="digest"
          groupStore={notificationPreference}
          label="Daily digest"
          description="Get a summary of all notifications once per day"
        />
        <LabeledToggleable
          id="notify-none"
          type="radio"
          value="none"
          groupStore={notificationPreference}
          label="No notifications"
          description="Turn off all notifications"
        />
      </div>
      <div class="result-display">
        <strong>Selected preference:</strong>
        {$notificationPreference || 'None'}
      </div>
    </div>
  {/snippet}
</Story>

<style lang="sass">
div
  margin-block-end: 1rem

h3
  margin-block-end: 1rem
  font-size: 1.2em
  font-weight: 600

// Styles for result display boxes
:global(.result-display)
  margin-block-start: 1.5rem
  padding: 1rem
  background-color: var(--tint-background-accent, #f5f5f5)
  border-radius: 0.5rem
  border-inline-start: 4px solid var(--tint-action-primary, #007acc)

  strong
    color: var(--tint-text-primary, #333)

  &:empty
    display: none
</style>
