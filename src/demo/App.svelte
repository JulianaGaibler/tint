<script lang="ts">
  import Button from '@lib/components/Button.svelte'
  import ColorPicker from '@lib/components/ColorPicker/ColorPicker.svelte'
  import Toggleable from '@src/lib/components/Toggleable.svelte'
  import TextField from '@src/lib/components/TextField.svelte'
  import Select from '@src/lib/components/Select.svelte'
  import SearchField from '@src/lib/components/SearchField.svelte'
  import IconHome from '@lib/icons/20-home.svg?raw'
  import Menu, {
    MENU_SEPARATOR,
    type MenuItem,
  } from '@src/lib/components/Menu.svelte'
  import MessageBox from '@src/lib/components/MessageBox.svelte'
  import FileUpload from '@src/lib/components/FileInput.svelte'
  import AttributePicker from '@src/lib/components/AttributePicker.svelte'
  import Autocomplete from '@src/lib/components/Autocomplete.svelte'
  import Modal from '@src/lib/components/Modal.svelte'
  import Toaster from '@src/lib/components/Toaster.svelte'
  import { toast } from '@src/lib/stores/toast.js'
  import Dialog, { type OpenDialog } from '@src/lib/components/Dialog.svelte'
  import LoadingIndicator from '@src/lib/components/LoadingIndicator.svelte'
  import ProgressIndicator from '@src/lib/components/ProgressBar.svelte'
  import { tooltip } from '@src/lib/actions'
  let modalOpen1 = $state(false)
  let modalOpen2 = $state(false)
  let openDialog1 = $state<OpenDialog | undefined>(undefined)
  let openDialog2 = $state<OpenDialog | undefined>(undefined)
  let option = $state(1)
  let demoHex = $state('#3366cc')
  let demoOklch = $state({ l: 0.7, c: 0.18, h: 22, alpha: 1 })
  let demoAlpha = $state('#3366cc99')
  let demoContrast = $state('#1e1d25')

  let contextClickHandlers: ((e: Event) => void)[] = $state([])

  function handleContextClick(e: Event | MouseEvent, i: number, j: number) {
    contextClickHandlers[j + i * 2](e)
  }

  const items: MenuItem[] = [
    {
      label: 'Item 1',
      onClick: () => console.log('Item 1'),
    },
    {
      label: 'Item 2',
      checked: true,
      onClick: () => console.log('Item 2'),
    },
    {
      label: 'Item 3',
      disabled: true,
      onClick: () => console.log('Item 3'),
    },
    MENU_SEPARATOR,
    {
      label: 'Item 4',
      items: [
        {
          label: 'Item 4.1',
          onClick: () => console.log('Item 4.1'),
        },
        {
          label: 'Item 4.2',
          onClick: () => console.log('Item 4.2'),
        },
      ],
    },
    {
      label: 'Item 5',
      onClick: () => console.log('Item 5'),
    },
  ]

  let attributeValue = $state<string[]>([])
  let attributesItems = [
    {
      value: 'bunny',
      label: 'Bunny',
    },
    {
      value: 'cat',
      label: 'Cat',
    },
    {
      value: 'fox',
      label: 'Fox',
    },
  ]

  let autocompleteValue = $state<string | undefined>(undefined)
  let autocompleteItems = [
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
  ]

  let active = $state(false)

  $effect(() => {
    // every 5 seconds toggle active state
    const interval = setInterval(() => {
      active = !active
    }, 1000)
    return () => clearInterval(interval)
  })
</script>

<main>
  {#each [0, 1] as i (i)}
    <div class:tint--tinted={i === 1} class="panel">
      <div class="category tint--card">
        <h2>Headline</h2>
        <div class="rows">
          <div class="row">
            <h1 class="tint--type">Headline 1</h1>
            <h2 class="tint--type">Headline 2</h2>
            <h3 class="tint--type">Headline 3</h3>
          </div>
        </div>
      </div>

      <div class="category tint--card">
        <h2>Button</h2>
        <div class="rows">
          <div class="row">
            <Button variant="primary">Hello!</Button>
            <Button>Hello!</Button>
            <Button variant="ghost">Hello!</Button>
            <Button disabled variant="primary">Hello!</Button>
            <Button disabled>Hello!</Button>
            <Button disabled variant="ghost">Hello!</Button>
          </div>
          <div class="row">
            <Button small variant="primary">Hello!</Button>
            <Button small>Hello!</Button>
            <Button small variant="ghost">Hello!</Button>
            <Button disabled small variant="primary">Hello!</Button>
            <Button disabled small>Hello!</Button>
            <Button disabled small variant="ghost">Hello!</Button>
          </div>
          <div class="row">
            <Button icon aria-label="home" variant="primary"
              >{@html IconHome}</Button
            >
            <Button icon aria-label="home">{@html IconHome}</Button>
            <Button icon aria-label="home" variant="ghost"
              >{@html IconHome}</Button
            >
            <Button disabled icon aria-label="home" variant="primary"
              >{@html IconHome}</Button
            >
            <Button disabled icon aria-label="home">{@html IconHome}</Button>
            <Button disabled icon aria-label="home" variant="ghost"
              >{@html IconHome}</Button
            >
          </div>
          <div class="row">
            <Button loading variant="primary">Hello!</Button>
            <Button loading>Hello!</Button>
            <Button icon loading aria-label="home">{@html IconHome}</Button>
          </div>
          <div class="row">
            <Button loading small variant="primary">Hi!</Button>
            <Button loading small>Hi!</Button>
            <Button icon loading small aria-label="home"
              >{@html IconHome}</Button
            >
          </div>
          <div class="row">
            <Button icon aria-label="home" small>{@html IconHome}</Button>
            <Button icon aria-label="home" small variant="primary"
              >{@html IconHome}</Button
            >
            <Button icon aria-label="home" small variant="ghost"
              >{@html IconHome}</Button
            >
            <Button disabled icon aria-label="home" small
              >{@html IconHome}</Button
            >
            <Button disabled icon aria-label="home" small variant="primary"
              >{@html IconHome}</Button
            >
            <Button disabled icon aria-label="home" small variant="ghost"
              >{@html IconHome}</Button
            >
          </div>
        </div>
      </div>

      <div class="category tint--card">
        <h2>Toggleable</h2>
        <div class="rows">
          <div class="row">
            <Toggleable id="checkbox" checked={true} />
            <Toggleable id="checkbox" checked={false} />
            <Toggleable disabled id="checkbox" checked={true} />
            <Toggleable disabled id="checkbox" checked={false} />
          </div>
          <div class="row">
            <Toggleable type="radio" id="radio" checked={true} />
            <Toggleable type="radio" id="radio" checked={false} />
            <Toggleable disabled type="radio" id="radio" checked={true} />
            <Toggleable disabled type="radio" id="radio" checked={false} />
          </div>
          <div class="row">
            <Toggleable type="switch" id="switch" checked />
            <Toggleable type="switch" id="switch" checked={false} />
            <Toggleable type="switch" disabled id="switch" checked />
            <Toggleable type="switch" disabled id="switch" checked={false} />
          </div>
        </div>
      </div>

      <div class="category tint--card">
        <h2>Message Boxe</h2>
        <div class="rows">
          <MessageBox icon={IconHome}>
            <h2>Hello</h2>
            <p>Test test test test Test test</p>
          </MessageBox>
        </div>
      </div>

      <div class="category tint--card">
        <h2>Text Field</h2>
        <div class="rows">
          <div class="row">
            <TextField id="textfield" label="Label" value="Value" />
            <TextField
              id="textfield"
              label="Label"
              value=""
              helperText="Password"
            />
            <TextField
              disabled
              id="textfield"
              label="Label"
              value=""
              helperText="Password"
            />
          </div>
          <div class="row">
            <TextField
              id="textfield"
              label="Label"
              value=""
              error="Error: Don't"
            />
            <TextField
              disabled
              id="textfield"
              label="Label"
              value=""
              error="Error: Don't"
            />
          </div>
          <div class="row">
            <TextField
              variant="textarea"
              id="textfield"
              label="Label"
              value="Value"
            />
            <TextField
              variant="textarea"
              id="textfield"
              label="Label"
              value=""
              helperText="Password"
            />
            <TextField
              variant="textarea"
              disabled
              id="textfield"
              label="Label"
              value=""
              helperText="Password"
            />
          </div>
        </div>
      </div>

      <div class="category tint--card">
        <h2>Select</h2>
        <div class="rows">
          <div class="row">
            <Select
              id="textfield"
              label="Label"
              value={undefined}
              items={[
                { value: 1, label: 'Option 1' },
                { value: 2, label: 'Option 2' },
                { value: 3, label: 'Option 3' },
              ]}
            />
            <Select
              id="textfield"
              label="Label"
              bind:value={option}
              error="Error: Don't"
              items={[
                { value: 1, label: 'Option 1' },
                { value: 2, label: 'Option 2' },
                { value: 3, label: 'Option 3' },
              ]}
            />
          </div>
        </div>
      </div>

      <div class="category tint--card">
        <h2>Color Picker</h2>
        <div class="rows">
          <div class="row">
            <ColorPicker
              id="cp-demo-hex"
              label="Brand color"
              bind:value={demoHex}
            />
            <ColorPicker
              id="cp-demo-oklch"
              label="Accent (OKLCH)"
              format="oklch"
              bind:value={demoOklch}
            />
          </div>
          <div class="row">
            <ColorPicker
              id="cp-demo-alpha"
              label="Translucent"
              alpha
              bind:value={demoAlpha}
            />
            <ColorPicker
              id="cp-demo-contrast"
              label="Body text"
              bind:value={demoContrast}
              contrast={{ against: '#ffffff', role: 'foreground' }}
            />
          </div>
        </div>
      </div>

      <div class="category tint--card">
        <h2>Attribute Picker</h2>
        <div class="rows">
          <div class="row">
            <AttributePicker
              id={`attribute-picker1-${i}`}
              label="Label"
              value={['apple', 'pear']}
              items={[
                {
                  value: 'apple',
                  label: 'Apple',
                },
                {
                  value: 'banana',
                  label: 'Banana',
                },
                {
                  value: 'orange',
                  label: 'Orange',
                },
                {
                  value: 'grape',
                  label: 'Grape',
                },
                {
                  value: 'kiwi',
                  label: 'Kiwi',
                },
                {
                  value: 'mango',
                  label: 'Mango',
                },
                {
                  value: 'peach',
                  label: 'Peach',
                },
                {
                  value: 'pear',
                  label: 'Pear',
                },
                {
                  value: 'pineapple',
                  label: 'Pineapple',
                },
                {
                  value: 'strawberry',
                  label: 'Strawberry',
                },
                {
                  value: 'watermelon',
                  label: 'Watermelon',
                },
              ]}
            />
            <AttributePicker
              id={`attribute-picker2-${i}`}
              label="Label"
              bind:value={attributeValue}
              items={attributesItems}
              dynamicItems={async (search) => {
                await new Promise((resolve) => setTimeout(resolve, 250))
                return {
                  allowAdd: search.startsWith('a'),
                  items: attributesItems,
                }
              }}
              onitemadded={(label) => {
                console.log('Item added:', label)
                console.log('Current value:', attributeValue)
                attributesItems.push({
                  value: label,
                  label: label,
                })
                attributeValue.push(label)
              }}
            />
          </div>
        </div>
      </div>

      <div class="category tint--card">
        <h2>Autocomplete</h2>
        <div class="rows">
          <div class="row">
            <Autocomplete
              id={`autocomplete1-${i}`}
              label="Country"
              bind:value={autocompleteValue}
              items={autocompleteItems}
            />
            <Autocomplete
              id={`autocomplete2-${i}`}
              label="Country with helper text"
              value={undefined}
              items={autocompleteItems}
              helperText="Start typing to search for countries"
            />
            <Autocomplete
              disabled
              id={`autocomplete3-${i}`}
              label="Disabled"
              value="us"
              items={autocompleteItems}
            />
          </div>
          <div class="row">
            <Autocomplete
              id={`autocomplete4-${i}`}
              label="Required field"
              value={undefined}
              items={autocompleteItems}
              error="This field is required"
            />
          </div>
        </div>
      </div>

      <div class="category tint--card">
        <h2>Search Fields</h2>
        <div class="rows">
          <div class="row">
            <SearchField id="searchfield" label="Label" value="Value" />
            <SearchField id="searchfield" label="Label" value="" />
          </div>
        </div>
      </div>

      <div class="category tint--card">
        <h2>File Upload</h2>
        <div class="rows">
          <div class="row">
            <FileUpload id="fileupload" label="Label" />
            <FileUpload error="Error: Don't" id="fileupload" label="Label" />
          </div>
        </div>
      </div>
      <div class="category tint--card">
        <h2>Dialog & Modal</h2>
        <div class="rows">
          <div class="row">
            <Button onclick={() => (modalOpen1 = true)}>Open modal</Button>
            <Button onclick={() => (modalOpen2 = true)}
              >Open modal (uncloseable)</Button
            >
          </div>
          <div class="row">
            <Button onclick={() => openDialog1?.().then(console.log)}
              >Open transactional dialog</Button
            >
            <Button onclick={() => openDialog2?.().then(console.log)}
              >Open acknowledgment dialog</Button
            >
          </div>
        </div>
      </div>

      <div class="category tint--card">
        <h2>Context Menu</h2>
        <div class="rows">
          <div class="row">
            <div
              class="ctxarea"
              oncontextmenu={(e) => handleContextClick(e, i, 0)}
              role="button"
              tabindex="0"
            >
              Context Menu
            </div>
            <Button onclick={(e) => handleContextClick(e, i, 1)}>Hello!</Button>
            <Menu
              variant="context"
              bind:contextClick={contextClickHandlers[0 + i * 2]}
              {items}
            />
            <Menu
              variant="button"
              bind:contextClick={contextClickHandlers[1 + i * 2]}
              {items}
            />
          </div>
        </div>
      </div>
      <div class="category tint--card">
        <h2>Loading indicator</h2>
        <div class="rows">
          <div class="row">
            <LoadingIndicator />
            <ProgressIndicator {active} showProgress />
          </div>
        </div>
      </div>
      <div class="category tint--card">
        <h2>Toast</h2>
        <div class="rows">
          <div class="row">
            <Button onclick={() => toast('This is a toast message')}
              >Default</Button
            >
            <Button onclick={() => toast.error('Error toast')}>Error</Button>
            <Button onclick={() => toast.loading('Loading toast')}
              >Loading</Button
            >
          </div>
          <div class="row">
            <Button
              onclick={() =>
                toast('Event created', {
                  description: 'Scheduled for tomorrow at 3pm.',
                })}>With Description</Button
            >
            <Button
              onclick={() =>
                toast.promise(
                  new Promise((resolve) => setTimeout(resolve, 2000)),
                  { loading: 'Saving...', success: 'Saved!', error: 'Failed!' },
                )}>Promise</Button
            >
          </div>
        </div>
      </div>
      <div class="category tint--card">
        <h2>Tooltips</h2>
        <div class="rows">
          <div class="row">
            <button use:tooltip={{ text: 'Hello tooltip!' }}
              >Hover for tooltip!</button
            >
          </div>
        </div>
      </div>
    </div>
  {/each}
  <Modal bind:open={modalOpen1}>Hello!</Modal>
  <Modal bind:open={modalOpen2} notClosable
    ><p>Hello!</p>
    <Button onclick={() => (modalOpen2 = false)}>Close</Button></Modal
  >
  <Dialog
    bind:openDialog={openDialog1}
    variant="transaction"
    heading="Delete selected images?"
    actionLabel="Delete"
  >
    <p>
      Images will be permanently removed from your account and all synced
      devices
    </p>
  </Dialog>
  <Toaster />
  <Dialog
    bind:openDialog={openDialog2}
    heading="Images deleted"
    actionLabel="Okay"
  >
    <p>Images have been deleted</p>
  </Dialog>
</main>

<style lang="sass">
main
  display: flex
  width: 100%
  box-sizing: border-box

.panel
  flex: 1
  background-color: var(--tint-bg)
  padding: 16px

.category
  padding: 16px
  margin-block-end: 16px
  > h2
    border-block-end: 1px solid var(--tint-card-border)
    padding-block-end: 12px
    margin-block-end: 24px

.row
  display: flex
  gap: 16px
  margin-block-end: 16px

.ctxarea
  user-select: none
  padding: 16px
  background-color: var(--tint-action-secondary-hover)
</style>
