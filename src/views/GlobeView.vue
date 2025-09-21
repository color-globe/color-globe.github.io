<!-- MultiView.vue -->
<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="flex flex-col">
    <div class="flex items-start p-4 gap-4">
      <div class="flex flex-col items-center w-[600px] gap-4">
        <CanvasPanel title="Globe" mode="globe" :width="600" :height="600" :points="points" :checked-ids="checkedIds"
          :group-index="groupIndex" :connect-tailwind-lines="connectTailwindLines" v-model:center-lon="centerLon"
          v-model:tilt-lat="tiltLat" :paused="paused" @pause="handlePause" :show-name="showName"
          :show-backside="showBacksideGlobe" />
        <CanvasPanel title="Map" mode="map" :width="600" :height="300" :points="points" :checked-ids="checkedIds"
          :group-index="groupIndex" :connect-tailwind-lines="connectTailwindLines" v-model:center-lon="centerLon"
          :paused="paused" @pause="handlePause" :show-name="showName" />
      </div>

      <div class="flex flex-col gap-4">
        <CanvasPanel title="Polar" mode="polar" :width="300" :height="300" :points="points" :checked-ids="checkedIds"
          :group-index="groupIndex" :connect-tailwind-lines="connectTailwindLines" v-model:center-lon="centerLon"
          :paused="paused" @pause="handlePause" :show-name="showName" />
        <CanvasPanel title="Equator" mode="equator" :width="300" :height="300" :points="points"
          :checked-ids="checkedIds" :group-index="groupIndex" :connect-tailwind-lines="connectTailwindLines"
          v-model:center-lon="centerLon" :paused="paused" @pause="handlePause" :show-name="showName" />
      </div>

      <aside class="w-[320px] shrink-0">
        <div class="sticky top-4 flex flex-col gap-4 max-h-[calc(100vh-2rem)] overflow-auto">
          <!-- Objects -->
          <div class="border rounded-xl p-3">
            <div class="font-semibold mb-2">Objects</div>

            <!-- x11 colors -->
            <label class="flex items-center gap-2 mb-2">
              <input type="checkbox" v-model="toggles.x11">
              <span>x11 colors</span>
            </label>

            <!-- tailwind -->
            <div class="mb-2">
              <div class="text-sm opacity-70 mb-1">tailwind</div>
              <label class="flex items-center gap-2 ml-4">
                <input type="checkbox" v-model="toggles.tailwindChroma">
                <span>chroma</span>
              </label>
              <label class="flex items-center gap-2 ml-4">
                <input type="checkbox" v-model="toggles.tailwindGray">
                <span>gray</span>
              </label>
              <label class="flex items-center gap-2 ml-4">
                <input type="checkbox" v-model="toggles.tailwindLines">
                <span>lines</span>
              </label>
            </div>

            <!-- globe -->
            <div>
              <div class="text-sm opacity-70 mb-1">globe</div>
              <label class="flex items-center gap-2 ml-4">
                <input type="checkbox" v-model="toggles.places">
                <span>places</span>
              </label>
              <label class="flex items-center gap-2 ml-4">
                <input type="checkbox" v-model="toggles.land">
                <span>land</span>
              </label>
              <label class="flex items-center gap-2 ml-4">
                <input type="checkbox" v-model="toggles.graticuleAxis">
                <span>graticule &amp; axis</span>
              </label>
            </div>
          </div>

          <!-- Options -->
          <div class="border rounded-xl p-3">
            <div class="font-semibold mb-2">Options</div>
            <label class="flex items-center gap-2 mb-2">
              <input type="checkbox" v-model="toggles.textName">
              <span>show name</span>
            </label>
            <label class="flex items-center gap-2 mb-3">
              <input type="checkbox" v-model="showBacksideGlobe">
              <span>show backside objects</span>
            </label>

            <div class="flex items-center gap-2">
              <span class="text-sm opacity-70">speed</span>
              <select v-model="spinSpeed" class="border rounded px-2 py-1 bg-white dark:bg-black">
                <option v-for="o in spinOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, onMounted, onBeforeUnmount, ref, watch, computed, watchEffect, reactive } from 'vue'
import { useMouse, useMousePressed, useDark } from '@vueuse/core'
import { feature } from 'topojson-client'
import worldAtlasLand from 'world-atlas/land-110m.json'
import type { Topology } from 'topojson-specification'
import type { FeatureCollection } from 'geojson'
import { geoEquirectangular, geoGraticule, geoOrthographic, geoPath, type GeoProjection } from 'd3-geo'

import { getPoints } from '@/lib/point'
import type { Point, Geo } from '@/lib/point'

/* -------------------------------
   체크박스 상태 (TriStateTree 제거)
---------------------------------*/
type Toggles = {
  // objects
  x11: boolean
  tailwindChroma: boolean
  tailwindGray: boolean
  tailwindLines: boolean
  places: boolean
  land: boolean
  graticuleAxis: boolean
  // options
  textName: boolean
}

const toggles = reactive<Toggles>({
  // objects
  x11: true,
  tailwindChroma: false,
  tailwindGray: false,
  tailwindLines: false,
  places: false,
  land: true,
  graticuleAxis: true,
  // options
  textName: true,
})

// CanvasPanel이 쓰는 그룹키 매핑(변경 없음)
const groupIndex = {
  places: 'places',
  tailwindChroma: 'tailwind.chroma',
  tailwindGray: 'tailwind.gray',
  x11: 'x11',
  land: 'globe.land',
  graticule: 'globe.graticule',
  axis: 'globe.axis',
} as const

// 체크 → id 배열
const checkedIds = computed<string[]>(() => {
  const ids: string[] = []
  if (toggles.x11) ids.push('x11')
  if (toggles.tailwindChroma) ids.push('tailwind.chroma')
  if (toggles.tailwindGray) ids.push('tailwind.gray')
  if (toggles.places) ids.push('places')
  if (toggles.land) ids.push('globe.land')
  // graticule & axis 묶어서 제어
  if (toggles.graticuleAxis) {
    ids.push('globe.graticule', 'globe.axis')
  }
  // options: 라벨 표시만
  if (toggles.textName) ids.push('text.name')
  return ids
})

/** 선 연결 여부 / 라벨 표시 여부 */
const connectTailwindLines = computed(() => toggles.tailwindLines)
const showName = computed(() => toggles.textName)
const showBacksideGlobe = ref(true)

/* -------------------------------
   데이터/공용 상태
---------------------------------*/
const points: Point[] = getPoints()
const centerLon = ref(0)
const tiltLat = ref(23.5)
const paused = ref(false)

const POINT_RADIUS = 3.5

function handlePause(v: boolean) { paused.value = v }

const spinOptions = [
  { label: '0°/s (stop)', value: 0 },
  { label: '3°/s', value: 3 },
  { label: '6°/s', value: 6 },
  { label: '12°/s', value: 12 },
  { label: '24°/s', value: 24 },
  { label: '48°/s', value: 48 },
] as const
const spinSpeed = ref<number>(12)

/* -------------------------------
   rAF (부모 중앙 집중)
---------------------------------*/
const rafSubs = new Set<() => void>()
function onRaf(cb: () => void) { rafSubs.add(cb); return () => rafSubs.delete(cb) }

let rid: number | null = null
let last = 0
function tick(t: number) {
  if (!last) last = t
  const dt = t - last
  last = t

  if (!paused.value) {
    centerLon.value = (centerLon.value + spinSpeed.value * (dt / 1000)) % 360
  }

  rafSubs.forEach(cb => cb())
  rid = requestAnimationFrame(tick)
}
function start() { if (rid == null) rid = requestAnimationFrame(tick) }
function stop() { if (rid != null) { cancelAnimationFrame(rid); rid = null; last = 0 } }
onMounted(() => start())
onBeforeUnmount(() => stop())

/* -------------------------------
   CanvasPanel (selection 코드 제거)
---------------------------------*/
const CanvasPanel = defineComponent({
  name: 'CanvasPanel',
  props: {
    mode: { type: String as () => 'globe' | 'map' | 'polar' | 'equator', required: true },
    title: { type: String, default: '' },
    centerLon: { type: Number, required: true },
    tiltLat: { type: Number, default: 0 },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    points: { type: Array as () => Point[], required: true },
    checkedIds: { type: Array as () => string[], required: true },
    groupIndex: { type: Object as () => Record<string, string>, required: true },
    connectTailwindLines: { type: Boolean, default: false },
    paused: { type: Boolean, default: false },
    showName: { type: Boolean, default: true },
    showBackside: { type: Boolean, default: false },
  },
  emits: ['update:centerLon', 'update:tiltLat', 'pause'],
  setup(props, { emit }) {
    const isDark = useDark()
    watch(isDark, () => invalidate())

    // DPR
    const dpr = window.devicePixelRatio || 1
    function ensureCanvasSize(c: HTMLCanvasElement, w: number, h: number) {
      const W = Math.round(w * dpr), H = Math.round(h * dpr)
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H }
      c.style.width = w + 'px'; c.style.height = h + 'px'
    }
    function withDpr(ctx: CanvasRenderingContext2D, fn: () => void) {
      ctx.save(); ctx.scale(dpr, dpr); fn(); ctx.restore()
    }

    // draw scheduler
    let needsRedraw = true
    function invalidate() { needsRedraw = true }
    function drawIfNeeded() {
      if (!needsRedraw) return
      needsRedraw = false
      drawBaseLayerAndPoints()
    }

    const container = ref<HTMLDivElement | null>(null)
    const baseCanvas = ref<HTMLCanvasElement | null>(null)
    const { x, y } = useMouse({ target: container })
    const { pressed } = useMousePressed({ target: container })

    let startX = 0, startY = 0, startLon = 0, startTilt = 0, zoom = 0.8
    const minZoom = 0.5, maxZoom = 8

    const graticule = geoGraticule().step([30, 15])()
    const landTopology = worldAtlasLand as unknown as Topology
    const raw = feature(landTopology, landTopology.objects.land) as FeatureCollection
    const landFeatures = raw.features

    const enabled = computed(() => new Set(props.checkedIds))
    const isVisible = (groupKey: string): boolean => {
      const id = props.groupIndex[groupKey]
      return id ? enabled.value.has(id) : false
    }

    type Series = { color: string; points: Point[] }

    const tailwindSeries = computed<Record<string, Array<{ p: Point; step: number }>>>(() => {
      const obj: Record<string, Array<{ p: Point; step: number }>> = {}
      for (const p of props.points as Point[]) {
        if (p.group !== 'tailwindGray' && p.group !== 'tailwindChroma') continue
        const m = /^([^\s-]+)-(\d+)$/.exec(p.name)
        if (!m) continue
        const family = m[1]
        const step = parseInt(m[2], 10)
        if (!obj[family]) obj[family] = []
        obj[family].push({ p, step })
      }
      for (const k of Object.keys(obj)) obj[k].sort((a, b) => a.step - b.step)
      return obj
    })

    const tailwindSeriesBuilt = ref<Series[]>([])
    watch([tailwindSeries, isDark], () => {
      const seriesMap = tailwindSeries.value
      const out: Series[] = []
      for (const fam of Object.keys(seriesMap)) {
        const arr = seriesMap[fam]
        if (!arr.length) continue
        const midHex =
          arr.find(e => e.step === 500)?.p.hex
          ?? arr[Math.floor(arr.length / 2)]?.p.hex
          ?? (isDark.value ? '#aaa' : '#666')
        out.push({ color: midHex, points: arr.map(e => e.p) })
      }
      tailwindSeriesBuilt.value = out
    }, { immediate: true })

    function buildAxisSeries(points: Point[]): Series[] {
      const north = points.find(p => p.group === 'axis' && p.geo.lat > 0)
      const south = points.find(p => p.group === 'axis' && p.geo.lat < 0)
      if (!north || !south) return []
      return [{ color: 'gray', points: [north, south] }]
    }

    function drawSeriesList(ctx: CanvasRenderingContext2D, projection: GeoProjection | null, seriesList: Series[]) {
      for (const s of seriesList) {
        ctx.strokeStyle = s.color
        ctx.lineWidth = props.mode === 'map' ? 1 : 1.2
        ctx.globalAlpha = 0.8

        let started = false
        let prevLonRot: number | null = null
        let prevPx: number | null = null

        ctx.beginPath()
        for (const p of s.points) {
          const xy = projectXY(p.geo, projection)
          if (!xy) continue
          const [px, py] = xy
          const lonRot = rotatedLon(p.geo.lon)

          if (!started) {
            ctx.moveTo(px, py)
            started = true
          } else {
            let crossSeam = false
            if (props.mode === 'map' && prevLonRot !== null) {
              const diffLon = wrapLonDiff(lonRot, prevLonRot)
              if (diffLon > 179.5) crossSeam = true
              if (!crossSeam && prevPx !== null) {
                const diffPx = Math.abs(px - prevPx)
                if (diffPx > props.width * 0.5) crossSeam = true
              }
            }
            if (crossSeam) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          prevLonRot = lonRot
          prevPx = px
        }
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }

    function wrapLon(lon: number): number {
      return ((lon + 180) % 360 + 360) % 360 - 180
    }

    function drawLabelAt(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
      ctx.beginPath()
      ctx.fillStyle = isDark.value ? '#aaa8' : '#6668'
      ctx.font = '12px monospace'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, x + 6, y)
    }

    // 수동 오소그래픽 (tilt/zoom 일관 적용)
    function geoToXY(geo: Geo): [number, number] | null {
      const { lat, lon, r } = geo
      const latRad = (lat * Math.PI) / 180
      const lonRad = (lon * Math.PI) / 180

      let x3 = r * Math.cos(latRad) * Math.sin(lonRad)
      let y3 = r * Math.sin(latRad)
      let z3 = r * Math.cos(latRad) * Math.cos(lonRad)

      const centerRad = (props.centerLon * Math.PI) / 180
      {
        const x1 = x3 * Math.cos(centerRad) + z3 * Math.sin(centerRad)
        const z1 = -x3 * Math.sin(centerRad) + z3 * Math.cos(centerRad)
        x3 = x1; z3 = z1
      }

      const tiltLat = props.mode === 'globe'
        ? props.tiltLat
        : props.mode === 'polar'
          ? 90
          : 0
      const tiltRad = (tiltLat * Math.PI) / 180
      {
        const y1 = y3 * Math.cos(tiltRad) - z3 * Math.sin(tiltRad)
        const z1 = y3 * Math.sin(tiltRad) + z3 * Math.cos(tiltRad)
        y3 = y1; z3 = z1
      }

      if (props.mode === 'globe') {
        if (!props.showBackside && z3 <= 0) return null
      }

      const minSide = Math.min(props.width, props.height)
      const scale = (minSide / 600) * 280 * (props.mode === 'globe' ? zoom : 1)
      const cx = props.width / 2, cy = props.height / 2
      return [cx + x3 * scale, cy - y3 * scale]
    }

    function baseScale() { return (Math.min(props.width, props.height) / 600) * 280 }

    function getProjectionForLand(): GeoProjection {
      if (props.mode === 'globe') {
        return geoOrthographic()
          .rotate([props.centerLon, -props.tiltLat, 0])
          .translate([props.width / 2, props.height / 2])
          .scale(baseScale() * zoom)
          .clipAngle(90)
      }
      const isMap = props.mode === 'map'
      const rotate: [number, number, number] = props.mode === 'polar'
        ? [props.centerLon, -90, 0]
        : [props.centerLon, 0, 0]
      const proj = isMap ? geoEquirectangular() : geoOrthographic()
      return proj
        .rotate(rotate)
        .translate([props.width / 2, props.height / 2])
        .scale(isMap ? 95 : 140)
    }

    function buildLabelText(p: Point) {
      const parts: string[] = []
      if (props.showName) parts.push(p.name)
      return parts.join(' · ')
    }

    function drawBaseLayerAndPoints() {
      const canvas = baseCanvas.value; if (!canvas) return null
      ensureCanvasSize(canvas, props.width, props.height)
      const ctx = canvas.getContext('2d'); if (!ctx) return null

      return withDpr(ctx, () => {
        const projection = getProjectionForLand()
        const path = geoPath(projection, ctx as unknown as CanvasRenderingContext2D)

        ctx.clearRect(0, 0, props.width, props.height)

        const landFill = isDark.value ? '#9996' : '#9996'
        const gridStroke = isDark.value ? '#9996' : '#9996'

        if (isVisible('land')) {
          ctx.fillStyle = landFill
          ctx.beginPath()
          path({ type: 'FeatureCollection', features: landFeatures })
          ctx.fill()
        }
        if (isVisible('graticule')) {
          ctx.strokeStyle = gridStroke
          ctx.lineWidth = 1
          ctx.beginPath()
          path(graticule)
          ctx.stroke()
        }

        if (isVisible('axis')) {
          const axisSeries = buildAxisSeries(props.points)
          drawSeriesList(ctx, projection, axisSeries)
        }

        if (props.connectTailwindLines) {
          const tailwindVisible = isVisible('tailwindGray') || isVisible('tailwindChroma')
          if (tailwindVisible) {
            const visibleGroups = new Set<string>()
            if (isVisible('tailwindGray')) visibleGroups.add('tailwindGray')
            if (isVisible('tailwindChroma')) visibleGroups.add('tailwindChroma')

            const filtered = tailwindSeriesBuilt.value
              .map(s => ({ ...s, points: s.points.filter(p => visibleGroups.has(p.group)) }))
              .filter(s => s.points.length >= 2)

            drawSeriesList(ctx, projection, filtered)
          }
        }

        for (const p of props.points) {
          if (!isVisible(p.group)) continue
          const xy = projectXY(p.geo, projection)
          if (!xy) continue
          const [px, py] = xy

          ctx.beginPath()
          ctx.fillStyle = p.hex
          ctx.globalAlpha = 0.95
          ctx.arc(px, py, POINT_RADIUS, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1

          const text = buildLabelText(p)
          if (text) drawLabelAt(ctx, text, px, py)
        }

        return projection
      })
    }

    function projectXY(geo: Geo, projection: GeoProjection | null): [number, number] | null {
      if (props.mode === 'map') {
        const lat2 = Math.asin(geo.r * Math.sin((geo.lat * Math.PI) / 180)) * 180 / Math.PI
        const p = (projection as GeoProjection)([geo.lon, lat2])
        return p ? [p[0], p[1]] as [number, number] : null
      } else {
        return geoToXY(geo)
      }
    }

    function wrapLonDiff(a: number, b: number) {
      return Math.abs((((a - b) + 180) % 360 + 360) % 360 - 180)
    }
    const rotatedLon = (lon: number) => (((lon - props.centerLon) + 180) % 360 + 360) % 360 - 180

    // Interaction
    watch(pressed, (v) => emit('pause', v))
    function onMouseDown() {
      startX = x.value; startY = y.value
      startLon = props.centerLon; startTilt = props.tiltLat
    }

    watchEffect(() => {
      if (!pressed.value) return
      const dx = x.value - startX
      const dy = y.value - startY
      const deltaLon = dx * 0.5
      emit('update:centerLon', wrapLon(startLon + deltaLon))
      if (props.mode === 'globe') {
        const deltaTilt = dy * 0.5
        const nextTilt = Math.max(-90, Math.min(90, startTilt + deltaTilt))
        emit('update:tiltLat', nextTilt)
      }
    })

    function onWheel(e: WheelEvent) {
      if (props.mode !== 'globe') return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      zoom = Math.max(minZoom, Math.min(maxZoom, zoom + delta))
      invalidate()
    }
    function onWindowMouseUp() { emit('pause', false) }
    let offRaf: (() => void) | null = null

    onMounted(() => {
      container.value?.addEventListener('mousedown', onMouseDown)
      container.value?.addEventListener('wheel', onWheel, { passive: false })
      window.addEventListener('mouseup', onWindowMouseUp)
      offRaf = onRaf(drawIfNeeded)
      invalidate()
    })
    onBeforeUnmount(() => {
      container.value?.removeEventListener('mousedown', onMouseDown)
      container.value?.removeEventListener('wheel', onWheel)
      window.removeEventListener('mouseup', onWindowMouseUp)
      offRaf?.()
    })

    watch(
      () => [
        props.checkedIds,
        props.centerLon,
        props.tiltLat,
        props.mode,
        props.width,
        props.height,
        props.connectTailwindLines,
        props.showName,
        isDark.value,
      ],
      () => invalidate(),
      { deep: true }
    )

    return () => h('div', { class: 'inline-block' }, [
      h('div', {
        ref: container,
        class: 'border relative bg-white dark:bg-black rounded',
        style: { width: props.width + 'px', height: props.height + 'px' }
      }, [
        props.title ? h('div', {
          class: 'absolute top-1 right-2 font-bold text-sm bg-white/70 dark:bg-black/50 px-1 rounded'
        }, props.title) : null,
        h('canvas', {
          ref: baseCanvas, width: props.width, height: props.height,
          style: { position: 'absolute', inset: 0 }
        }),
      ])
    ])
  }
})

defineExpose({ CanvasPanel })
</script>

<style scoped>
canvas {
  display: block;
}
</style>
