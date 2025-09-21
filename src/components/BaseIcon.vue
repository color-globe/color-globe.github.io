<!-- BaseIcon.vue -->
<script setup lang="ts">
type Props = {
  path: string
  size?: number
}

withDefaults(defineProps<Props>(), {
  size: 24,
})
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
    class="inline-block">
    <path :d="path" />
  </svg>
</template>
