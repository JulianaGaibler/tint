Mount one `Toaster` near the root of your app, then call `toast()` from anywhere. Helpers cover errors, loading, and promises, and each call returns an id you can pass to `toast.dismiss`.

```svelte
<script>
  import { Toaster } from 'tint'
  import { toast } from 'tint/stores'
</script>

<Toaster />

<button onclick={() => toast('Saved')}>Save</button>
<button
  onclick={() =>
    toast.promise(save(), {
      loading: 'Saving',
      success: 'Saved',
      error: 'Could not save',
    })}
>
  Save async
</button>
```
