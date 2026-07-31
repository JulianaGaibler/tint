<script lang="ts">
  import IconWarning from '@lib/icons/20-warning.svg?raw'
  import MessageBox from '@lib/components/MessageBox.svelte'
  import Button from '@lib/components/Button.svelte'

  interface Props {
    /** Human-readable name of the output gamut, e.g. "sRGB" or "Display-P3". */
    gamut: string
    /** The clipped CSS string we'd emit if the user accepts the clip. */
    clippedCss: string
    /** Apply the clipped value. */
    onClip: () => void
  }

  let { gamut, clippedCss, onClip }: Props = $props()
</script>

<MessageBox icon={IconWarning}>
  <p class="title">Outside {gamut}</p>
  <p class="detail">
    Will be clipped to <code>{clippedCss}</code>.
  </p>
  {#snippet actions()}
    <Button small variant="secondary" onclick={onClip}>Clip to {gamut}</Button>
  {/snippet}
</MessageBox>

<style lang="sass">
.title
  margin: 0
  font-size: 0.85em
  font-weight: 600

.detail
  margin-block: var(--tint-size-2) 0
  margin-inline: 0
  font-size: 0.78em
  color: var(--tint-text-secondary)
  overflow-wrap: anywhere
</style>
