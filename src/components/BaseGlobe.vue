<template>
  <div ref="container" class="w-[600px] h-[600px]" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { shared } from './SceneManager'

const container = ref<HTMLDivElement | null>(null)
let renderer: THREE.WebGLRenderer
let camera: THREE.PerspectiveCamera
let controls: OrbitControls
let frameId = 0

onMounted(() => {
  const width = 600
  const height = 600

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100)
  camera.position.z = 3

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  container.value?.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.autoRotate = true
  controls.enableDamping = true

  shared.scene.add(new THREE.AxesHelper(1.5))
  shared.scene.add(shared.axisLine)
  shared.createPoints()
  shared.points.forEach(p => shared.scene.add(p))

  const sphereWire = new THREE.WireframeGeometry(new THREE.SphereGeometry(1, 30, 30))
  const wireLine = new THREE.LineSegments(sphereWire, new THREE.LineBasicMaterial({ color: 0x888888 }))
  shared.scene.add(wireLine)

  const animate = () => {
    controls.update()
    renderer.render(shared.scene, camera)
    frameId = requestAnimationFrame(animate)
  }
  animate()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId)
  renderer.dispose()
})
</script>
