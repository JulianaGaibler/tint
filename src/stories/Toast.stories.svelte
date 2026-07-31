<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Toaster from '@lib/components/Toaster.svelte'
  import Button from '@lib/components/Button.svelte'
  import { toast } from '@lib/stores/toast.js'
  import IconCrown from '@lib/icons/20-crown.svg?raw'
  import IconInfo from '@lib/icons/20-info.svg?raw'
  import ToastDocs from './docs/Toast.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/Toast',
    component: Toaster,
    parameters: { docs: { description: { component: ToastDocs } } },
  })
</script>

<Story name="Default" args={{}}>
  {#snippet template(args: any)}
    <Button onclick={() => toast('This is a toast message')}>Show Toast</Button>
    <Toaster {...args} />
  {/snippet}
</Story>

<Story name="Loading" args={{}}>
  {#snippet template(args: any)}
    <Button onclick={() => toast.loading('Loading...')}>
      Show Loading Toast
    </Button>
    <Toaster {...args} />
  {/snippet}
</Story>

<Story name="Error" args={{}}>
  {#snippet template(args: any)}
    <Button onclick={() => toast.error('Failed to save changes')}>
      Show Error Toast
    </Button>
    <Toaster {...args} />
  {/snippet}
</Story>

<Story name="With Description" args={{}}>
  {#snippet template(args: any)}
    <Button
      onclick={() =>
        toast('Event created', {
          description: 'Your event has been scheduled for tomorrow at 3pm.',
        })}
    >
      Show Toast with Description
    </Button>
    <Toaster {...args} />
  {/snippet}
</Story>

<Story name="With Custom Icon" args={{}}>
  {#snippet template(args: any)}
    <div style="display: flex; gap: 8px;">
      <Button
        onclick={() =>
          toast('You earned a badge!', {
            icon: IconCrown,
            description: 'Keep up the great work!',
          })}
      >
        Show with Crown Icon
      </Button>
      <Button
        onclick={() =>
          toast('System update available', {
            icon: IconInfo,
          })}
      >
        Show with Info Icon
      </Button>
    </div>
    <Toaster {...args} />
  {/snippet}
</Story>

<Story name="Promise" args={{}}>
  {#snippet template(args: any)}
    <div style="display: flex; gap: 8px;">
      <Button
        onclick={() =>
          toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
            loading: 'Saving changes...',
            success: 'Changes saved!',
            error: 'Failed to save changes',
          })}
      >
        Success Promise
      </Button>
      <Button
        onclick={() =>
          toast.promise(
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Network error')), 2000),
            ),
            {
              loading: 'Uploading file...',
              success: 'File uploaded!',
              error: 'Failed to upload file',
            },
          )}
      >
        Error Promise
      </Button>
    </div>
    <Toaster {...args} />
  {/snippet}
</Story>

<Story name="With Action" args={{}}>
  {#snippet template(args: any)}
    <Button
      onclick={() =>
        toast('File uploaded successfully', {
          action: {
            label: 'View',
            onClick: () => alert('Opening file...'),
          },
        })}
    >
      Show Toast with Action
    </Button>
    <Toaster {...args} />
  {/snippet}
</Story>

<Story name="With Action & Cancel" args={{}}>
  {#snippet template(args: any)}
    <Button
      onclick={() =>
        toast('Are you sure you want to continue?', {
          action: {
            label: 'Confirm',
            onClick: () => alert('Confirmed!'),
          },
          cancel: {
            label: 'Cancel',
            onClick: () => console.log('Cancelled'),
          },
          duration: 10000,
        })}
    >
      Show Confirmation Toast
    </Button>
    <Toaster {...args} />
  {/snippet}
</Story>
