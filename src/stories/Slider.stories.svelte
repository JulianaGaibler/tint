<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Slider from '@lib/components/Slider.svelte'
  import { fn } from 'storybook/test'
  import SliderDocs from './docs/Slider.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/Slider',
    component: Slider,
    render: template,
    parameters: { docs: { description: { component: SliderDocs } } },
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
    },
    args: {
      onchange: fn(),
      oninput: fn(),
    },
  })
</script>

{#snippet template(args: any)}
  <div style="max-width: 400px;">
    <Slider {...args} />
  </div>
{/snippet}

<Story
  name="Basic"
  args={{
    id: 'slider-basic',
    value: 50,
    min: 0,
    max: 100,
    step: 1,
  }}
/>

<Story
  name="With Steps"
  args={{
    id: 'slider-steps',
    value: 50,
    min: 0,
    max: 100,
    step: 10,
    showSteps: true,
  }}
/>

<Story
  name="Disabled"
  args={{
    id: 'slider-disabled',
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    disabled: true,
  }}
/>

<Story
  name="Large"
  args={{
    id: 'slider-large',
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    small: false,
  }}
/>
