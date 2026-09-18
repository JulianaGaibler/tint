<script lang="ts">
  import { onMount } from 'svelte'

  interface Props {
    size?: 16 | 24 | 32 | 48 | 64
    outline?: boolean
    label?: string
    // A space separated list of CSS classes.
    class?: string
  }

  let {
    size = 32,
    outline = false,
    label = 'Loading',
    class: className = '',
  }: Props = $props()

  let srLabelElement = $state<HTMLSpanElement | null>(null)

  onMount(() => {
    setTimeout(() => {
      if (srLabelElement) {
        srLabelElement.classList.remove('label-hidden')
      }
    }, 10)
  })
</script>

<div
  class={`loading-indicator size-${size} ${className}`}
  class:outline
  role="status"
  aria-live="polite"
>
  <svg
    aria-hidden="true"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M25.0062 5.71542C27.5107 -0.628636 36.4893 -0.628638 38.9938 5.71542V5.71542C40.4344 9.36446 44.4384 11.2927 48.1895 10.1438V10.1438C54.7111 8.14652 60.3091 15.1662 56.9107 21.0798V21.0798C54.9559 24.4813 55.9448 28.8139 59.1818 31.0304V31.0304C64.8095 34.8838 62.8116 43.6373 56.0693 44.6673V44.6673C52.1912 45.2598 49.4203 48.7344 49.7057 52.6471V52.6471C50.2017 59.4496 42.1123 63.3452 37.1032 58.7161V58.7161C34.222 56.0535 29.778 56.0535 26.8968 58.7161V58.7161C21.8877 63.3452 13.7983 59.4496 14.2943 52.6471V52.6471C14.5797 48.7344 11.8088 45.2598 7.9307 44.6673V44.6673C1.18839 43.6373 -0.809526 34.8838 4.81816 31.0304V31.0304C8.05515 28.8139 9.04405 24.4813 7.08931 21.0798V21.0798C3.69089 15.1662 9.28892 8.14652 15.8105 10.1438V10.1438C19.5616 11.2927 23.5656 9.36446 25.0062 5.71542V5.71542Z"
    />
  </svg>
  <span bind:this={srLabelElement} class="tint--visually-hidden label-hidden"
    >{label}</span
  >
</div>

<style>.loading-indicator.size-16 {
  --size: 16px;
}
.loading-indicator.size-24 {
  --size: 24px;
}
.loading-indicator.size-32 {
  --size: 32px;
}
.loading-indicator.size-48 {
  --size: 48px;
}
.loading-indicator.size-64 {
  --size: 64px;
}

.loading-indicator {
  line-height: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--size, 32px);
  height: var(--size, 32px);
  will-change: transform;
}
.loading-indicator svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
  animation: rotate 750ms cubic-bezier(0.7, 0, 0.3, 1) infinite;
}
@media (prefers-reduced-motion: reduce) {
  .loading-indicator svg {
    animation: pulse 2s infinite;
  }
}
.loading-indicator svg path {
  transform-origin: center;
}
@media (prefers-reduced-motion: no-preference) {
  .loading-indicator svg path {
    animation: squish 750ms cubic-bezier(0.9, 0, 0.3, 1) infinite;
  }
}
.loading-indicator.outline svg path {
  stroke: currentColor;
  stroke-width: 4;
  scale: 0.9;
  transform-origin: center;
  fill: none;
}
.loading-indicator .label-hidden {
  display: none;
}

@keyframes rotate {
  0% {
    transform: rotate(1deg);
  }
  100% {
    transform: rotate(103.8571428571deg);
  }
}
@keyframes squish {
  0%, 100% {
    transform: scaleX(1);
  }
  50% {
    transform: scaleX(0.9);
  }
}
@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}</style>
