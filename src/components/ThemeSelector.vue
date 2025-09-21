<!-- ThemeSelector.vue -->
<script setup lang="ts">
import { useDark } from '@vueuse/core'
import BaseIcon from './BaseIcon.vue'
import { mdiWhiteBalanceSunny, mdiWeatherNight } from '@mdi/js'

const isDark = useDark({
  onChanged(dark) {
    document.documentElement.classList.toggle('dark', dark)
  },
})
</script>

<template>
  <button
    class="relative inline-flex items-center w-11 h-6 rounded-full transition-colors border-1 bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600 cursor-pointer"
    aria-label="Toggle theme" @click="isDark = !isDark">
    <span
      class="w-5 h-5 rounded-full bg-white dark:bg-gray-800 shadow transform flex items-center justify-center transition-transform duration-300 ease-in-out"
      :class="isDark ? 'translate-x-5' : 'translate-x-0.5'">
      <BaseIcon :path="isDark ? mdiWeatherNight : mdiWhiteBalanceSunny" class="w-4 h-4" />
    </span>
  </button>
</template>
