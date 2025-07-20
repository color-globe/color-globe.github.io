<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue'
import Globe, { type GlobeInstance } from 'globe.gl'
import { MeshLambertMaterial, DoubleSide } from 'three'
import { getLandFeatures } from '@/data/land'

const globeContainer = ref<HTMLDivElement | null>(null)
let globeInstance: GlobeInstance | null = null

function resizeGlobe() {
  if (globeContainer.value && globeInstance) {
    const { offsetWidth, offsetHeight } = globeContainer.value
    globeInstance.width(offsetWidth).height(offsetHeight)
  }
}

onMounted(async () => {
  if (!globeContainer.value) return

  globeInstance = new Globe(globeContainer.value)
    .backgroundColor('#0000')
    .showGlobe(false)
    .showAtmosphere(false)

  resizeGlobe()
  window.addEventListener('resize', resizeGlobe)

  const land = getLandFeatures()
  globeInstance
    .polygonsData(land.features)
    .polygonCapMaterial(new MeshLambertMaterial({ color: 'darkslategrey', side: DoubleSide, transparent: true, opacity: 0.1 }))
    .polygonSideColor(() => '#0000')
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeGlobe)
})
</script>

<template>
  <main class="flex justify-center items-center">
    <div ref="globeContainer" class="w-full h-full border" />
  </main>
</template>
