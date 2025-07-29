<template>
  <div class="flex flex-col items-center bg-black text-white p-4 gap-4">
    <div class="flex">
      <!-- 왼쪽: Globe + World Map (폭 600 고정) -->
      <div class="flex flex-col items-center mr-4" style="width: 600px">
        <div class="mb-1 font-bold text-center">🌍 Globe View</div>
        <canvas ref="globeCanvas" width="600" height="600" class="border" />

        <div class="mt-4 mb-1 font-bold text-center">🗺️ World Map View</div>
        <canvas ref="worldMapCanvas" width="600" height="300" class="border" />
      </div>

      <!-- 오른쪽: Polar + Equator (폭 300) -->
      <div>
        <div class="mb-1 font-bold text-center">🧊 Polar View</div>
        <canvas ref="polarCanvas" width="300" height="300" class="border mb-4" />
        <div class="mb-1 font-bold text-center">🌐 Equator View</div>
        <canvas ref="equatorCanvas" width="300" height="300" class="border" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const globeCanvas = ref<HTMLCanvasElement | null>(null)
const worldMapCanvas = ref<HTMLCanvasElement | null>(null)
const polarCanvas = ref<HTMLCanvasElement | null>(null)
const equatorCanvas = ref<HTMLCanvasElement | null>(null)

const width = 600
const height = 600
const centerX = width / 2
const centerY = height / 2
const radius = 200

const autoRotate = true
let azimuth = 0
let elevation = 0.3
let dragging = false
let lastX = 0
let lastY = 0

interface Point {
  lat: number
  lon: number
  r: number
  name: string
  color: string
}

const points: Point[] = [
  { lat: 0, lon: 0, r: 1, name: 'Equator Prime', color: '#ff4444' },
  { lat: 0, lon: 90, r: 1, name: 'Equator 90E', color: '#44ff44' },
  { lat: 0, lon: 180, r: 1, name: 'Equator 180', color: '#4444ff' },
  { lat: 0, lon: 270, r: 1, name: 'Equator 270', color: '#ffff44' },
  { lat: 90, lon: 0, r: 1, name: 'North Pole', color: 'white' },
  { lat: -90, lon: 0, r: 1, name: 'South Pole', color: 'white' },
  { lat: 45, lon: 45, r: 1, name: 'NE45', color: 'cyan' },
  { lat: -45, lon: 135, r: 1, name: 'SE135', color: 'magenta' },
  { lat: 30, lon: 210, r: 0.8, name: 'MidSouth', color: '#8888ff' },
  { lat: -30, lon: 300, r: 0.5, name: 'LowSouth', color: '#ff88ff' }
]

function toRad(deg: number): number {
  return deg * Math.PI / 180
}

function sphericalToXYZ(lat: number, lon: number, r: number) {
  const latRad = toRad(lat)
  const lonRad = toRad(lon)
  const x = r * Math.cos(latRad) * Math.cos(lonRad)
  const y = r * Math.sin(latRad)
  const z = r * Math.cos(latRad) * Math.sin(lonRad)

  const x1 = x * Math.cos(azimuth) - z * Math.sin(azimuth)
  const z1 = x * Math.sin(azimuth) + z * Math.cos(azimuth)
  const y1 = y * Math.cos(elevation) - z1 * Math.sin(elevation)
  const z2 = y * Math.sin(elevation) + z1 * Math.cos(elevation)

  return { x: x1, y: y1, z: z2 }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function project3D(x: number, y: number, z: number) {
  return {
    x: centerX + x * radius,
    y: centerY - y * radius
  }
}

function drawAllCanvases() {
  const globeCtx = globeCanvas.value?.getContext('2d')
  const mapCtx = worldMapCanvas.value?.getContext('2d')
  const polarCtx = polarCanvas.value?.getContext('2d')
  const equatorCtx = equatorCanvas.value?.getContext('2d')
  if (!globeCtx || !mapCtx || !polarCtx || !equatorCtx) return

  globeCtx.clearRect(0, 0, width, height)
  mapCtx.clearRect(0, 0, 600, 300)
  polarCtx.clearRect(0, 0, 300, 300)
  equatorCtx.clearRect(0, 0, 300, 300)

  if (autoRotate) azimuth += 0.005

  drawGlobe(globeCtx)
  drawPoints(globeCtx)
  drawWorldMap(mapCtx)
  drawPolarView(polarCtx)
  drawEquatorView(equatorCtx)

  frameId = requestAnimationFrame(drawAllCanvases)
}


function drawGlobe(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'

  // 위도선
  for (let lat = -75; lat <= 75; lat += 15) {
    ctx.beginPath()
    for (let lon = 0; lon <= 360; lon += 5) {
      const { x, y, z } = sphericalToXYZ(lat, lon, 1)
      const p = project3D(x, y, z)
      if (lon === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()
  }

  // 경도선
  for (let lon = 0; lon < 360; lon += 30) {
    ctx.beginPath()
    for (let lat = -90; lat <= 90; lat += 5) {
      const { x, y, z } = sphericalToXYZ(lat, lon, 1)
      const p = project3D(x, y, z)
      if (lat === -90) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()
  }

  // 자전축
  const top = sphericalToXYZ(90, 0, 1.2)
  const bottom = sphericalToXYZ(-90, 0, 1.2)
  const pt = project3D(top.x, top.y, top.z)
  const pb = project3D(bottom.x, bottom.y, bottom.z)
  ctx.strokeStyle = 'red'
  ctx.beginPath()
  ctx.moveTo(pb.x, pb.y)
  ctx.lineTo(pt.x, pt.y)
  ctx.stroke()
}

function drawPoints(ctx: CanvasRenderingContext2D) {
  ctx.font = '12px monospace'
  ctx.textBaseline = 'middle'

  for (const { lat, lon, r, name, color } of points) {
    const { x, y, z } = sphericalToXYZ(lat, lon, r)
    const p = project3D(x, y, z)

    // 점
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
    ctx.fill()

    // 텍스트
    ctx.fillStyle = 'white'
    const label = `${name} (${lat}, ${lon}, ${r})`
    ctx.fillText(label, p.x + 8, p.y)
  }
}

function drawWorldMap(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, 600, 300)
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.font = '10px monospace'
  ctx.textBaseline = 'middle'

  const mapWidth = 600
  const mapHeight = 300
  const lonOffset = (azimuth * 180 / Math.PI) % 360

  function project(lat: number, lon: number) {
    const rotatedLon = (lon + lonOffset + 360) % 360
    const x = (rotatedLon / 360) * mapWidth
    const y = mapHeight / 2 - (lat / 180) * mapHeight
    return { x, y }
  }

  // 위도선
  for (let lat = -75; lat <= 75; lat += 15) {
    ctx.beginPath()
    ctx.moveTo(0, mapHeight / 2 - (lat / 180) * mapHeight)
    ctx.lineTo(mapWidth, mapHeight / 2 - (lat / 180) * mapHeight)
    ctx.stroke()
  }

  // 경도선
  for (let lon = 0; lon <= 360; lon += 30) {
    ctx.beginPath()
    for (let lat = -90; lat <= 90; lat += 5) {
      const p = project(lat, lon)
      if (lat === -90) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()
  }

  for (const { lat, lon, name, color } of points) {
    const p = project(lat, lon)

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'white'
    ctx.fillText(name, p.x + 6, p.y)
  }
}


function drawPolarView(ctx: CanvasRenderingContext2D) {
  const size = 300
  const r = 120
  const cx = size / 2
  const cy = size / 2

  ctx.clearRect(0, 0, size, size)

  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 1

  // 위도선 (동심원)
  for (let lat = 15; lat <= 75; lat += 15) {
    const radius = r * Math.sin(toRad(90 - lat))
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  // 경도선 (방사선)
  for (let lon = 0; lon < 360; lon += 30) {
    const rad = toRad(lon + azimuth * 180 / Math.PI)
    const x = cx + r * Math.cos(rad)
    const y = cy + r * Math.sin(rad)
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  // 점 렌더링
  for (const { lat, lon, r: pr, name, color } of points) {
    const latRad = toRad(90 - lat)
    const lonRad = toRad(lon + azimuth * 180 / Math.PI)

    const x = cx + pr * r * Math.sin(latRad) * Math.cos(lonRad)
    const y = cy + pr * r * Math.sin(latRad) * Math.sin(lonRad)

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'white'
    ctx.font = '10px monospace'
    ctx.fillText(name, x + 6, y)
  }
}

function drawEquatorView(ctx: CanvasRenderingContext2D) {
  const size = 300
  const radiusView = 120
  const cx = size / 2
  const cy = size / 2

  ctx.clearRect(0, 0, size, size)

  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'

  // 위도선 (수평선)
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = cy - radiusView * Math.sin(toRad(lat))
    ctx.beginPath()
    ctx.moveTo(cx - radiusView * Math.cos(toRad(lat)), y)
    ctx.lineTo(cx + radiusView * Math.cos(toRad(lat)), y)
    ctx.stroke()
  }

  // 경도선 (곡선)
  for (let lon = 0; lon < 360; lon += 30) {
    ctx.beginPath()
    let started = false
    for (let lat = -90; lat <= 90; lat += 2) {
      const latRad = toRad(lat)
      const lonRad = toRad(lon)
      const az = azimuth

      const x0 = Math.cos(latRad) * Math.cos(lonRad)
      const y0 = Math.sin(latRad)
      const z0 = Math.cos(latRad) * Math.sin(lonRad)

      const x1 = x0 * Math.cos(az) - z0 * Math.sin(az)
      const y1 = y0

      const x = cx + x1 * radiusView
      const y = cy - y1 * radiusView

      if (!started) {
        ctx.moveTo(x, y)
        started = true
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
  }

  // 점
  for (const { lat, lon, r, name, color } of points) {
    const latRad = toRad(lat)
    const lonRad = toRad(lon)
    const az = azimuth

    const x0 = r * Math.cos(latRad) * Math.cos(lonRad)
    const y0 = r * Math.sin(latRad)
    const z0 = r * Math.cos(latRad) * Math.sin(lonRad)

    const x1 = x0 * Math.cos(az) - z0 * Math.sin(az)
    const y1 = y0

    const x = cx + x1 * radiusView
    const y = cy - y1 * radiusView

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'white'
    ctx.font = '10px monospace'
    ctx.fillText(name, x + 6, y)
  }
}

let frameId = 0

function onMouseDown(e: MouseEvent) {
  dragging = true
  lastX = e.clientX
  lastY = e.clientY
}
function onMouseMove(e: MouseEvent) {
  if (!dragging) return
  const dx = e.clientX - lastX
  const dy = e.clientY - lastY
  azimuth += dx * 0.005
  elevation += dy * 0.005
  elevation = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, elevation))
  lastX = e.clientX
  lastY = e.clientY
}
function onMouseUp() {
  dragging = false
}

onMounted(() => {
  globeCanvas.value?.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  drawAllCanvases()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId)
  globeCanvas.value?.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>
