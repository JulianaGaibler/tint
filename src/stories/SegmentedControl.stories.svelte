<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import SegmentedControl from '@lib/components/SegmentedControl.svelte'
  import { fn } from 'storybook/test'
  import IconHome from '@lib/icons/20-home.svg?raw'
  import IconInfo from '@lib/icons/20-info.svg?raw'
  import IconWarning from '@lib/icons/20-warning.svg?raw'
  import IconSearch from '@lib/icons/20-search.svg?raw'
  import SegmentedControlDocs from './docs/SegmentedControl.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/SegmentedControl',
    component: SegmentedControl,
    parameters: { docs: { description: { component: SegmentedControlDocs } } },
    render: child,
    argTypes: {
      value: {
        control: 'text',
      },
      disabled: {
        control: 'boolean',
      },
      small: {
        control: 'boolean',
      },
    },
    args: {
      onchange: fn(),
    },
  })

  // Sample items for text-based segmented control
  const textItems = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'option4', label: 'Option 4', disabled: true },
  ]

  // Sample items for icon-based segmented control
  const iconItems = [
    { value: 'home', icon: IconHome, 'aria-label': 'Home', title: 'Home' },
    {
      value: 'info',
      icon: IconInfo,
      'aria-label': 'Information',
      title: 'Information',
    },
    {
      value: 'warning',
      icon: IconWarning,
      'aria-label': 'Warning',
      title: 'Warning',
    },
    {
      value: 'search',
      icon: IconSearch,
      'aria-label': 'Search',
      title: 'Search',
    },
  ]

  // Sample items with tooltips
  const itemsWithTooltips = [
    { value: 'option1', label: 'Home', tooltip: 'Navigate to the home page' },
    { value: 'option2', label: 'Profile', tooltip: 'View your user profile' },
    {
      value: 'option3',
      label: 'Settings',
      tooltip: 'Adjust application settings',
    },
  ]
</script>

{#snippet child(args: any)}
  <SegmentedControl {...args} />
{/snippet}

<Story
  name="Text Options"
  args={{
    id: 'text-segmented',
    label: 'Choose an option',
    items: textItems,
    value: 'option2',
    disabled: false,
    small: false,
  }}
/>

<Story
  name="Icon Options"
  args={{
    id: 'icon-segmented',
    label: 'Choose a view',
    items: iconItems,
    value: 'home',
    disabled: false,
    small: false,
  }}
/>

<Story
  name="Small"
  args={{
    id: 'small-segmented',
    label: 'Size options',
    items: textItems,
    value: 'option1',
    disabled: false,
    small: true,
  }}
/>

<Story
  name="Disabled"
  args={{
    id: 'disabled-segmented',
    label: 'Disabled options',
    items: textItems,
    value: 'option1',
    disabled: true,
    small: false,
  }}
/>

<Story
  name="With Tooltips"
  args={{
    id: 'tooltip-segmented',
    label: 'Options with tooltips',
    items: itemsWithTooltips,
    value: 'option1',
    disabled: false,
    small: false,
  }}
/>
