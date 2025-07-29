<template>
  <canvas ref="canvas" width="600" height="600" />
</template>

<script setup lang="ts">
import { onMounted, ref, watchEffect } from 'vue'

interface Point {
  lat: number
  lon: number
  r: number
  name: string
  color: string
}

const props = defineProps<{
  points: Point[]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const width = 600
const height = 600
const centerX = width / 2
const centerY = height / 2
const maxRadius = 250

function latToRadius(lat: number) {
  return ((90 - lat) / 180) * maxRadius
}

function degToRad(deg: number) {
  return deg * Math.PI / 180
}

function draw() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, width, height)

  // 위도선 (거리는 일정)
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.beginPath()
  for (let lat = 15; lat <= 90; lat += 15) {
    const r = latToRadius(lat)
    ctx.beginPath()
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  // 경도선
  for (let lon = 0; lon < 360; lon += 30) {
    const rad = degToRad(lon)
    const x = centerX + maxRadius * Math.cos(rad)
    const y = centerY + maxRadius * Math.sin(rad)
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  // 점 및 텍스트
  ctx.font = '12px monospace'
  ctx.textBaseline = 'middle'
  for (const { lat, lon, r: alt, name, color } of props.points) {
    const r = latToRadius(lat) * alt // 고도 r 비율 포함
    const rad = degToRad(lon)
    const x = centerX + r * Math.cos(rad)
    const y = centerY + r * Math.sin(rad)

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'white'
    const label = `${name} (${lat}, ${lon}, ${alt})`
    ctx.fillText(label, x + 8, y)
  }
}

onMounted(draw)
watchEffect(draw)
</script>
