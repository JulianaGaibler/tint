<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Autocomplete from '@lib/components/Autocomplete.svelte'
  import { fn } from 'storybook/test'
  import AutocompleteDocs from './docs/Autocomplete.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/Autocomplete',
    component: Autocomplete,
    parameters: { docs: { description: { component: AutocompleteDocs } } },
    render: child,
    argTypes: {
      autocomplete: { control: 'select' },
      allowFreeText: { control: 'boolean' },
    },
    args: {
      onitemadded: fn(),
    },
  })
</script>

{#snippet child(args: any)}
  <Autocomplete {...args} />
{/snippet}

<Story
  name="Basic"
  args={{
    id: 'autocomplete-basic',
    label: 'Country',
    value: undefined,
    items: [
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
      { value: 'mx', label: 'Mexico' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'fr', label: 'France' },
      { value: 'de', label: 'Germany' },
      { value: 'it', label: 'Italy' },
      { value: 'es', label: 'Spain' },
      { value: 'jp', label: 'Japan' },
      { value: 'kr', label: 'South Korea' },
      { value: 'cn', label: 'China' },
      { value: 'in', label: 'India' },
      { value: 'au', label: 'Australia' },
      { value: 'br', label: 'Brazil' },
      { value: 'ar', label: 'Argentina' },
    ],
  }}
/>

<Story
  name="With value"
  args={{
    id: 'autocomplete-value',
    label: 'Favorite fruit',
    value: 'apple',
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'orange', label: 'Orange' },
      { value: 'grape', label: 'Grape' },
      { value: 'kiwi', label: 'Kiwi' },
      { value: 'mango', label: 'Mango' },
      { value: 'peach', label: 'Peach' },
      { value: 'pear', label: 'Pear' },
      { value: 'pineapple', label: 'Pineapple' },
      { value: 'strawberry', label: 'Strawberry' },
      { value: 'watermelon', label: 'Watermelon' },
    ],
  }}
/>

<Story
  name="With hints"
  args={{
    id: 'autocomplete-hints',
    label: 'Assignee',
    items: [
      { value: 'jdoe', label: 'Jane Doe', hint: 'jane.doe@example.com' },
      { value: 'jdoe2', label: 'Jane Doe', hint: 'j.doe@example.org' },
      { value: 'jroe', label: 'Jane Roe', hint: 'jane.roe@example.com' },
      { value: 'jdoe1998', label: 'jdoe1998' },
    ],
  }}
/>

<Story
  name="Disabled"
  args={{
    id: 'autocomplete-disabled',
    label: 'Disabled field',
    value: 'option1',
    items: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
    disabled: true,
  }}
/>

<Story
  name="Free Text"
  args={{
    id: 'autocomplete-free-text',
    label: 'Enter any country',
    value: undefined,
    allowFreeText: true,
    items: [
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
      { value: 'mx', label: 'Mexico' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'fr', label: 'France' },
      { value: 'de', label: 'Germany' },
      { value: 'it', label: 'Italy' },
      { value: 'es', label: 'Spain' },
      { value: 'jp', label: 'Japan' },
      { value: 'au', label: 'Australia' },
    ],
  }}
/>

<Story
  name="Free Text with value"
  args={{
    id: 'autocomplete-free-text-value',
    label: 'Favorite fruit',
    value: 'Custom Berry',
    allowFreeText: true,
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'orange', label: 'Orange' },
      { value: 'grape', label: 'Grape' },
      { value: 'kiwi', label: 'Kiwi' },
      { value: 'mango', label: 'Mango' },
      { value: 'peach', label: 'Peach' },
      { value: 'pear', label: 'Pear' },
      { value: 'pineapple', label: 'Pineapple' },
      { value: 'strawberry', label: 'Strawberry' },
      { value: 'watermelon', label: 'Watermelon' },
    ],
  }}
/>

<Story
  name="Dynamic Items"
  args={{
    id: 'autocomplete-dynamic',
    label: 'Search users',
    value: undefined,
    items: [
      // The selected item must be present in the items array
      { value: 'john_doe', label: 'John Doe' },
      { value: 'jane_smith', label: 'Jane Smith' },
      { value: 'bob_johnson', label: 'Bob Johnson' },
      { value: 'alice_brown', label: 'Alice Brown' },
      { value: 'charlie_davis', label: 'Charlie Davis' },
      { value: 'diana_wilson', label: 'Diana Wilson' },
      { value: 'edward_garcia', label: 'Edward Garcia' },
      { value: 'fiona_martinez', label: 'Fiona Martinez' },
      { value: 'george_anderson', label: 'George Anderson' },
      { value: 'helen_taylor', label: 'Helen Taylor' },
      { value: 'ivan_thomas', label: 'Ivan Thomas' },
      { value: 'julia_white', label: 'Julia White' },
    ],
    dynamicItems: async (search: string) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Mock user data (same as items array)
      const allUsers = [
        { value: 'john_doe', label: 'John Doe' },
        { value: 'jane_smith', label: 'Jane Smith' },
        { value: 'bob_johnson', label: 'Bob Johnson' },
        { value: 'alice_brown', label: 'Alice Brown' },
        { value: 'charlie_davis', label: 'Charlie Davis' },
        { value: 'diana_wilson', label: 'Diana Wilson' },
        { value: 'edward_garcia', label: 'Edward Garcia' },
        { value: 'fiona_martinez', label: 'Fiona Martinez' },
        { value: 'george_anderson', label: 'George Anderson' },
        { value: 'helen_taylor', label: 'Helen Taylor' },
        { value: 'ivan_thomas', label: 'Ivan Thomas' },
        { value: 'julia_white', label: 'Julia White' },
      ]

      // Filter users based on search term
      const filteredUsers = allUsers.filter((user) =>
        user.label.toLowerCase().includes(search.toLowerCase()),
      )

      return {
        items: filteredUsers,
        allowAdd: true, // Allow adding new users
      }
    },
  }}
/>
