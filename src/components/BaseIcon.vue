<script setup lang="ts">
const props = defineProps<{
  path: string
}>()
</script>

<template>
  <svg class="fill-current" viewBox="0 0 24 24" aria-hidden="true" role="img">
    <path :d="props.path" />
  </svg>
</template>
