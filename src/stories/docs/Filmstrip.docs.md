Plays a filmstrip sprite-sheet SVG as a stepped CSS animation. Set the pace with `fps` or `duration`, and control playback with the bindable `playing` prop or the imperative methods through `bind:this`.

```svelte
<script>
  import { Filmstrip } from 'tint'
  let player
</script>

<Filmstrip bind:this={player} {svg} loop fps={60} />
<button onclick={() => player.play()}>Play</button>
<button onclick={() => player.pause()}>Pause</button>
```
