<script setup lang="ts">
import { onMounted, ref, watch, onBeforeUnmount } from 'vue'
import Globe, { type GlobeInstance } from 'globe.gl'
import { MeshLambertMaterial, DoubleSide } from 'three'
import { getFeatures } from '@/data/landTopology'
import { useClassDark } from '@/composables/useClassDark'
import { Vector3, Line, BufferGeometry, LineBasicMaterial } from 'three'

const globeContainer = ref<HTMLDivElement | null>(null)
let globeInstance: GlobeInstance | null = null

const isDark = useClassDark()

function resizeGlobe() {
  if (globeContainer.value && globeInstance) {
    const { offsetWidth, offsetHeight } = globeContainer.value
    globeInstance.width(offsetWidth).height(offsetHeight)
  }
}

function drawRotationAxis() {
  if (!globeInstance) return

  const axisLength = 110
  const axisMaterial = new LineBasicMaterial({ color: 'grey' })
  const axisGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, -axisLength, 0),  // South Pole
    new Vector3(0, axisLength, 0),   // North Pole
  ])

  const axisLine = new Line(axisGeometry, axisMaterial)
  globeInstance.scene().add(axisLine)
}

function applyTheme() {
  if (!globeInstance) return

  const capColor = isDark.value ? 'white' : 'darkslategrey'
  const textColor = isDark.value ? 'white' : 'black'

  globeInstance
    .polygonCapMaterial(
      new MeshLambertMaterial({
        color: capColor,
        side: DoubleSide,
        transparent: true,
        opacity: 0.15,
      }),
    )
    .polygonSideColor(() => '#0000')
    .labelColor(() => textColor)
}

onMounted(async () => {
  if (!globeContainer.value) return

  globeInstance = new Globe(globeContainer.value)
    .backgroundColor('#0000')
    .showGlobe(false)
    .showAtmosphere(false)
    .showGraticules(true)

    .labelDotRadius(() => 0.4)
    .labelSize(() => 1.2)
    .labelText('name')
    .labelsData([
      { lat: 37.5665, lng: 126.9780, name: 'Seoul' },
      { lat: 90, lng: 0, name: 'North Pole' },
      { lat: -90, lng: 0, name: 'South Pole' },
    ])

  const controls = globeInstance.controls()
  controls.autoRotate = true
  controls.enableZoom = false

  resizeGlobe()
  window.addEventListener('resize', resizeGlobe)

  const features = getFeatures()
  globeInstance
    .polygonsData(features)


  drawRotationAxis()
  applyTheme()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeGlobe)
})

watch(isDark, () => {
  applyTheme()
})
</script>

<template>
  <main class="flex justify-center items-center w-full h-full">
    <div ref="globeContainer" class="w-full h-[70vh]" />
  </main>
</template>
