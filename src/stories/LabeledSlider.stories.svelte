<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import LabeledSlider from '@lib/components/LabeledSlider.svelte'
  import { fn } from 'storybook/test'
  import IconHome from '@lib/icons/20-home.svg?raw'
  import LabeledSliderDocs from './docs/LabeledSlider.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/LabeledSlider',
    component: LabeledSlider,
    render: template,
    parameters: { docs: { description: { component: LabeledSliderDocs } } },
    argTypes: {
      id: {
        control: 'text',
      },
      value: {
        control: 'number',
      },
      min: {
        control: 'number',
      },
      max: {
        control: 'number',
      },
      step: {
        control: 'number',
      },
      disabled: {
        control: 'boolean',
      },
      showSteps: {
        control: 'boolean',
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
    },
    args: {
      onchange: fn(),
      oninput: fn(),
    },
  })
</script>

{#snippet template(args: any)}
  <div style="max-width: 500px;">
    <LabeledSlider {...args} />
  </div>
{/snippet}

<Story
  name="Basic"
  args={{
    id: 'slider-labeled-basic',
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    label: 'Volume',
    description: 'Adjust the playback volume',
  }}
/>

<Story
  name="With Icon"
  args={{
    id: 'slider-icon',
    value: 75,
    min: 0,
    max: 100,
    step: 5,
    label: 'Brightness',
    icon: IconHome,
    description: 'Control screen brightness level',
  }}
/>

<Story
  name="With Steps"
  args={{
    id: 'slider-steps-labeled',
    value: 50,
    min: 0,
    max: 100,
    step: 10,
    showSteps: true,
    label: 'Master Volume',
    description: 'Adjust the master volume in 10% increments',
  }}
/>

<Story
  name="Disabled"
  args={{
    id: 'slider-labeled-disabled',
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    disabled: true,
    label: 'Volume',
    description: 'Volume control is currently unavailable',
  }}
/>

<Story
  name="Large"
  args={{
    id: 'slider-large-labeled',
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    small: false,
    label: 'Master Volume',
    description: 'Adjust the main volume level',
  }}
/>
