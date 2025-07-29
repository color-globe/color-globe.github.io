<template>
  <div class="flex flex-col items-center bg-black text-white p-4 gap-4">
    <div class="flex">
      <!-- 왼쪽: Globe + World Map -->
      <div class="flex flex-col items-center mr-4" style="width: 600px">
        <div class="mb-1 font-bold text-center">🌍 Globe View</div>
        <canvas ref="globeCanvas" width="600" height="600" class="border" />
        <div class="mt-4 mb-1 font-bold text-center">🗺️ World Map View</div>
        <canvas ref="worldMapCanvas" width="600" height="300" class="border" />
      </div>

      <!-- 오른쪽: Polar + Equator -->
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

const autoRotate = true
let azimuth = 0
let elevation = 0.3
let dragging = false
let lastX = 0
let lastY = 0
let frameId = 0

const points = [
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

function toRad(deg: number) {
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
  const cx = 300
  const cy = 300
  const scale = 200
  return {
    x: cx + x * scale,
    y: cy - y * scale
  }
}

function drawCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, style = 'rgba(255,255,255,0.2)') {
  ctx.strokeStyle = style
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
}

function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, style = 'rgba(255,255,255,0.2)') {
  ctx.strokeStyle = style
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function drawLatLonLines(
  ctx: CanvasRenderingContext2D,
  project: (lat: number, lon: number) => { x: number; y: number },
  latRange = [-90, 90],
  lonRange = [0, 360],
  latStep = 15,
  lonStep = 30
) {
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  for (let lat = latRange[0]; lat <= latRange[1]; lat += latStep) {
    ctx.beginPath()
    let started = false
    for (let lon = lonRange[0]; lon <= lonRange[1]; lon += 5) {
      const { x, y } = project(lat, lon)
      if (started) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
      started = true
    }
    ctx.stroke()
  }

  for (let lon = lonRange[0]; lon < lonRange[1]; lon += lonStep) {
    ctx.beginPath()
    let started = false
    for (let lat = latRange[0]; lat <= latRange[1]; lat += 5) {
      const { x, y } = project(lat, lon)
      if (started) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
      started = true
    }
    ctx.stroke()
  }
}

function drawPoints2D(
  ctx: CanvasRenderingContext2D,
  project: (lat: number, lon: number, r: number) => { x: number; y: number }
) {
  ctx.font = '10px monospace'
  ctx.textBaseline = 'middle'

  for (const { lat, lon, r, name, color } of points) {
    const { x, y } = project(lat, lon, r)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.fillText(name, x + 6, y)
  }
}

function drawGlobe(ctx: CanvasRenderingContext2D) {
  drawLatLonLines(ctx, (lat, lon) => {
    const { x, y, z } = sphericalToXYZ(lat, lon, 1)
    return project3D(x, y, z)
  })

  const top = sphericalToXYZ(90, 0, 1.2)
  const bottom = sphericalToXYZ(-90, 0, 1.2)
  const pt = project3D(top.x, top.y, top.z)
  const pb = project3D(bottom.x, bottom.y, bottom.z)
  drawLine(ctx, pb.x, pb.y, pt.x, pt.y, 'red')
}

function drawWorldMap(ctx: CanvasRenderingContext2D) {
  const width = 600, height = 300
  const lonOffset = (azimuth * 180 / Math.PI) % 360
  const project = (lat: number, lon: number) => {
    const rotated = (lon + lonOffset + 360) % 360
    return { x: (rotated / 360) * width, y: height / 2 - (lat / 180) * height }
  }

  drawLatLonLines(ctx, project, [-75, 75], [0, 360])
  drawPoints2D(ctx, (lat, lon) => project(lat, lon))
}

function drawPolarView(ctx: CanvasRenderingContext2D) {
  const cx = 150, cy = 150, r = 120
  for (let lat = 15; lat <= 75; lat += 15) {
    drawCircle(ctx, cx, cy, r * Math.sin(toRad(90 - lat)))
  }
  for (let lon = 0; lon < 360; lon += 30) {
    const rad = toRad(lon + azimuth * 180 / Math.PI)
    drawLine(ctx, cx, cy, cx + r * Math.cos(rad), cy + r * Math.sin(rad))
  }

  drawPoints2D(ctx, (lat, lon, pr) => {
    const latRad = toRad(90 - lat)
    const lonRad = toRad(lon + azimuth * 180 / Math.PI)
    return {
      x: cx + pr * r * Math.sin(latRad) * Math.cos(lonRad),
      y: cy + pr * r * Math.sin(latRad) * Math.sin(lonRad)
    }
  })
}

function drawEquatorView(ctx: CanvasRenderingContext2D) {
  const cx = 150, cy = 150, r = 120

  for (let lat = -75; lat <= 75; lat += 15) {
    const y = cy - r * Math.sin(toRad(lat))
    drawLine(ctx, cx - r * Math.cos(toRad(lat)), y, cx + r * Math.cos(toRad(lat)), y)
  }

  for (let lon = 0; lon < 360; lon += 30) {
    ctx.beginPath()
    let started = false
    for (let lat = -90; lat <= 90; lat += 2) {
      const latRad = toRad(lat), lonRad = toRad(lon)
      const x0 = Math.cos(latRad) * Math.cos(lonRad)
      const y0 = Math.sin(latRad)
      const z0 = Math.cos(latRad) * Math.sin(lonRad)
      const x1 = x0 * Math.cos(azimuth) - z0 * Math.sin(azimuth)
      const y1 = y0
      const x = cx + x1 * r, y = cy - y1 * r
      if (started) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
      started = true
    }
    ctx.stroke()
  }

  drawPoints2D(ctx, (lat, lon, pr) => {
    const latRad = toRad(lat), lonRad = toRad(lon)
    const x0 = pr * Math.cos(latRad) * Math.cos(lonRad)
    const y0 = pr * Math.sin(latRad)
    const z0 = pr * Math.cos(latRad) * Math.sin(lonRad)
    const x1 = x0 * Math.cos(azimuth) - z0 * Math.sin(azimuth)
    const y1 = y0
    return { x: cx + x1 * r, y: cy - y1 * r }
  })
}

function drawAllCanvases() {
  const globe = globeCanvas.value
  const map = worldMapCanvas.value
  const polar = polarCanvas.value
  const equator = equatorCanvas.value

  if (!globe || !map || !polar || !equator) return

  const globeCtx = globe.getContext('2d')
  const mapCtx = map.getContext('2d')
  const polarCtx = polar.getContext('2d')
  const equatorCtx = equator.getContext('2d')

  if (!globeCtx || !mapCtx || !polarCtx || !equatorCtx) return

  globeCtx.clearRect(0, 0, 600, 600)
  mapCtx.clearRect(0, 0, 600, 300)
  polarCtx.clearRect(0, 0, 300, 300)
  equatorCtx.clearRect(0, 0, 300, 300)

  if (autoRotate) azimuth += 0.005

  drawGlobe(globeCtx)
  drawPoints2D(globeCtx, (lat, lon, r) => {
    const { x, y, z } = sphericalToXYZ(lat, lon, r)
    return project3D(x, y, z)
  })
  drawWorldMap(mapCtx)
  drawPolarView(polarCtx)
  drawEquatorView(equatorCtx)

  frameId = requestAnimationFrame(drawAllCanvases)
}

// Mouse handlers
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
