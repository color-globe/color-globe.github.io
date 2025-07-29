<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'
import ThemeSelector from '@/components/ThemeSelector.vue'
import { mdiGithub } from '@mdi/js'
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <nav class="bg-white dark:bg-gray-800 shadow-md">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center space-x-8">
          <RouterLink to="/" class="flex items-center space-x-2 font-bold text-xl text-gray-800 dark:text-white">
            <img src="@/assets/logo.svg" alt="Logo" class="h-8 w-8" />
            <span>ColorGlobe</span>
          </RouterLink>
          <RouterLink to="/oklab" class="text-gray-700 dark:text-gray-200 hover:text-blue-600 font-medium">Oklab
          </RouterLink>
          <RouterLink to="/cylinder" class="text-gray-700 dark:text-gray-200 hover:text-blue-600 font-medium">Cylinder
          </RouterLink>
          <RouterLink to="/bicone" class="text-gray-700 dark:text-gray-200 hover:text-blue-600 font-medium">Bicone
          </RouterLink>
          <RouterLink to="/globe" class="text-gray-700 dark:text-gray-200 hover:text-blue-600 font-medium">Globe
          </RouterLink>
          <RouterLink to="/globe2" class="text-gray-700 dark:text-gray-200 hover:text-blue-600 font-medium">Globe2
          </RouterLink>
          <RouterLink to="/globe3" class="text-gray-700 dark:text-gray-200 hover:text-blue-600 font-medium">Globe3
          </RouterLink>
          <RouterLink to="/docs" class="text-gray-700 dark:text-gray-200 hover:text-blue-600 font-medium">Docs
          </RouterLink>
        </div>
        <div class="flex items-center space-x-6">
          <ThemeSelector />
          <a href="https://github.com/color-globe/color-globe.github.io" target="_blank" rel="noopener"
            class="ml-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition" aria-label="GitHub">
            <BaseIcon class="w-6 h-6" :path="mdiGithub" />
          </a>
        </div>
      </div>
    </nav>

    <main class="flex-1 container mx-auto px-4 py-8">
      <RouterView />
    </main>

    <footer class="bg-gray-100 dark:bg-gray-800 text-center py-4 text-gray-500 text-sm">
      Color Globe
    </footer>
  </div>
</template>
