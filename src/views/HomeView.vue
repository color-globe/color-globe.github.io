<!-- HomeView.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { feature } from 'topojson-client'
import worldAtlasLand from 'world-atlas/land-110m.json'
import type { Topology } from 'topojson-specification'
import type { FeatureCollection } from 'geojson'
import { geoOrthographic, geoGraticule, geoPath } from 'd3-geo'
import { getPoints } from '@/lib/point'
import type { Point, Geo } from '@/lib/point'

const points: Point[] = getPoints().filter(p => p.group === 'x11')

/* state */
const centerLon = ref(0)
const tiltLat = ref(23.5)
const paused = ref(false)
const showBackside = false
let zoom = 0.75
const MIN_ZOOM = 0.5
const MAX_ZOOM = 8
const ZOOM_STEP = 0.1

const POINT_RADIUS = 5
const TEXT_SIZE = 20

/* DOM / size */
let containerEl: HTMLDivElement | null = null
let canvasEl: HTMLCanvasElement | null = null
let ro: ResizeObserver | null = null
let width = 300, height = 300
const dpr = window.devicePixelRatio || 1

function resizeCanvas() {
  if (!containerEl || !canvasEl) return
  // Actual box size
  const rect = containerEl.getBoundingClientRect()
  width = Math.max(1, Math.round(rect.width))
  height = Math.max(1, Math.round(rect.height))
  // Update backing store only (keep CSS size)
  canvasEl.width = Math.round(width * dpr)
  canvasEl.height = Math.round(height * dpr)
}

/* world layers */
const landTopology = worldAtlasLand as unknown as Topology
const landFeatures = (feature(landTopology, landTopology.objects.land) as FeatureCollection).features
const graticule = geoGraticule().step([30, 15])()

const baseScale = () => (Math.min(width, height) / 2) * 0.93
const centerSnap = () => {
  const cx = Math.floor(width / 2) + 0.5
  const cy = Math.floor(height / 2) + 0.5
  return { cx, cy }
}
function projectionForGlobe() {
  const { cx, cy } = centerSnap()
  return geoOrthographic()
    .rotate([centerLon.value, -tiltLat.value, 0])
    .translate([cx, cy])
    .scale(baseScale() * zoom)
    .clipAngle(90)
}

/* project points */
function geoToXY(geo: Geo): [number, number] | null {
  const { cx, cy } = centerSnap()
  const { lat, lon, r } = geo
  const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180
  let x3 = r * Math.cos(la) * Math.sin(lo)
  let y3 = r * Math.sin(la)
  let z3 = r * Math.cos(la) * Math.cos(lo)
  { // rotate Y (lon)
    const c = Math.cos((centerLon.value * Math.PI) / 180), s = Math.sin((centerLon.value * Math.PI) / 180)
    const x1 = x3 * c + z3 * s, z1 = -x3 * s + z3 * c; x3 = x1; z3 = z1
  }
  { // rotate X (tilt)
    const c = Math.cos((tiltLat.value * Math.PI) / 180), s = Math.sin((tiltLat.value * Math.PI) / 180)
    const y1 = y3 * c - z3 * s, z1 = y3 * s + z3 * c; y3 = y1; z3 = z1
  }
  if (!showBackside && z3 <= 0) return null
  const scale = baseScale() * zoom
  return [cx + x3 * scale, cy - y3 * scale]
}

/* draw */
let needsRedraw = true
function invalidate() { needsRedraw = true }
function draw() {
  if (!canvasEl) return
  const ctx = canvasEl.getContext('2d'); if (!ctx) return
  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, width, height)

  const { cx, cy } = centerSnap()
  const R = baseScale() * zoom

  // horizon
  ctx.beginPath(); ctx.lineWidth = 1; ctx.strokeStyle = '#9aa3ab80'
  ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke()

  // land + graticule
  const proj = projectionForGlobe()
  const path = geoPath(proj, ctx)
  ctx.fillStyle = '#9aa3ab66'
  ctx.beginPath(); path({ type: 'FeatureCollection', features: landFeatures }); ctx.fill()
  ctx.strokeStyle = '#9aa3ab66'; ctx.lineWidth = 1
  ctx.beginPath(); path(graticule); ctx.stroke()

  // points + labels
  for (const p of points) {
    const xy = geoToXY(p.geo); if (!xy) continue
    const [px, py] = xy

    // point
    ctx.beginPath()
    ctx.fillStyle = p.hex
    ctx.globalAlpha = 0.95
    ctx.arc(px, py, POINT_RADIUS, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1

    // label
    ctx.fillStyle = '#6668'
    ctx.font = `${TEXT_SIZE}px monospace`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(p.name, px + POINT_RADIUS + 4, py)
  }
  ctx.restore()
}

/* spin */
const spinDegPerSec = 12
let rid: number | null = null, last = 0
function tick(t: number) {
  if (!last) last = t
  const dt = t - last; last = t
  if (!paused.value) { centerLon.value = (centerLon.value + spinDegPerSec * (dt / 1000)) % 360; invalidate() }
  if (needsRedraw) { needsRedraw = false; draw() }
  rid = requestAnimationFrame(tick)
}

/* drag */
let dragging = false, startX = 0, startY = 0, startLon = 0, startTilt = 0
const wrapLon = (v: number) => ((v + 180) % 360 + 360) % 360 - 180
const clamp = (a: number, b: number, x: number) => Math.max(a, Math.min(b, x))
function onMouseDown(e: MouseEvent) { dragging = true; paused.value = true; startX = e.clientX; startY = e.clientY; startLon = centerLon.value; startTilt = tiltLat.value }
function onMouseMove(e: MouseEvent) { if (!dragging) return; const dx = e.clientX - startX, dy = e.clientY - startY; centerLon.value = wrapLon(startLon + dx * 0.5); tiltLat.value = clamp(-90, 90, startTilt + dy * 0.5); invalidate() }
function onMouseUp() { dragging = false; paused.value = false }

function onWheel(e: WheelEvent) {
  // prevent page scroll
  e.preventDefault()

  // wheel: deltaY > 0 = zoom out, < 0 = zoom in
  const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP

  // optional smoothing for trackpads
  // const scale = e.ctrlKey ? 0.25 : 1
  // zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta * scale))

  zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta))
  invalidate()
}

/* mount */
onMounted(() => {
  containerEl = document.getElementById('globe-container') as HTMLDivElement
  canvasEl = document.getElementById('globe-canvas') as HTMLCanvasElement
  resizeCanvas()
  ro = new ResizeObserver(() => { resizeCanvas(); invalidate() })
  if (containerEl) {
    ro.observe(containerEl)
  }
  containerEl?.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  if (containerEl) {
    containerEl.addEventListener('wheel', onWheel, { passive: false })
  }
  requestAnimationFrame(tick)
  invalidate()
})
onBeforeUnmount(() => {
  ro?.disconnect()
  containerEl?.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  if (containerEl) {
    containerEl.removeEventListener('wheel', onWheel)
  }
  if (rid != null) cancelAnimationFrame(rid)
})
</script>

<template>
  <div class="p-4">
    <div id="globe-container" class="relative mx-auto w-[90wh] min-h-[90vh]"
      style="contain: layout paint size">
      <canvas id="globe-canvas" class="absolute inset-0 w-full h-full block"></canvas>
    </div>
  </div>
</template>
