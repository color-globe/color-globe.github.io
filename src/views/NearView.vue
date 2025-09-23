<!-- NearView.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import Color from 'colorjs.io'
import { Palettes, type Swatch } from '@/data/palettes'

type Source = 'x11' | 'tailwind'
type SwatchWithSource = Swatch & { source: Source }
type Neighbor = SwatchWithSource & { dist: number }

const input = ref('')
const includeX11 = ref(true)
const includeTW = ref(true)

/* ----- Top N dropdown ----- */
const K_OPTIONS = [10, 20, 30, 50, 100] as const
const kSelected = ref<(typeof K_OPTIONS)[number]>(10)

/* ----- OKLab distance ----- */
function oklabVec(c: InstanceType<typeof Color>): [number, number, number] {
  const o = c.to('oklab'); return [o.coords[0] ?? 0, o.coords[1] ?? 0, o.coords[2] ?? 0]
}
function distOKLab(a: InstanceType<typeof Color>, b: InstanceType<typeof Color>): number {
  const [L1, a1, b1] = oklabVec(a); const [L2, a2, b2] = oklabVec(b); return Math.hypot(L1 - L2, a1 - a2, b1 - b2)
}

/* ----- Input parsing + HEX conversion ----- */
const parsed = computed(() => {
  const v = input.value.trim()
  if (!v) return null
  try {
    const srgb = new Color(v).to('srgb').toGamut({ space: 'srgb' })
    return { color: srgb, hex: srgb.toString({ format: 'hex' }).toUpperCase() }
  } catch { return { error: 'This color string cannot be recognized.' } }
})

/* ----- Candidate pool (x11 + tailwind) ----- */
const combinedPool = computed<SwatchWithSource[]>(() => {
  const pool: SwatchWithSource[] = []
  if (includeX11.value) pool.push(...Palettes.x11.map(s => ({ ...s, source: 'x11' as const })))
  if (includeTW.value) pool.push(...Palettes.tailwind.map(s => ({ ...s, source: 'tailwind' as const })))
  return pool
})

/* ----- Nearest N (combined) ----- */
function topN(target: InstanceType<typeof Color>, pool: SwatchWithSource[], n: number): Neighbor[] {
  return pool
    .map(s => ({ ...s, dist: distOKLab(target, s.color) }))
    .sort((a, b) => a.dist - b.dist || (a.source > b.source ? 1 : -1))
    .slice(0, n)
}
const nearestCombined = computed<Neighbor[] | null>(() => {
  if (!parsed.value || 'error' in parsed.value) return null
  const pool = combinedPool.value
  if (pool.length === 0) return []
  const n = Math.min(kSelected.value, pool.length)
  return topN(parsed.value.color, pool, n)
})

/* ----- View helpers ----- */
const swatchStyle = computed(() => (!parsed.value || 'error' in parsed.value) ? {} : ({ backgroundColor: parsed.value.hex }))
const labelColor = computed(() => (!parsed.value || 'error' in parsed.value) ? '#000' : (parsed.value.color.to('oklch').l > 0.6 ? '#000' : '#fff'))
function sourceBadgeClass(src: Source) {
  return src === 'x11'
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
}
</script>

<template>
  <div class="p-4 max-w-6xl space-y-6">
    <!-- Input -->
    <div class="space-y-2">
      <label class="block font-medium text-gray-700 dark:text-gray-200">Color input</label>
      <input v-model="input" placeholder="e.g., red, #ace, #00AACC, hsl(120 50% 40%), oklch(0.7 0.1 200)"
        class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none" />
    </div>

    <!-- Options -->
    <div class="flex flex-wrap items-center gap-6">
      <label class="inline-flex items-center gap-2 cursor-pointer">
        <input type="checkbox" v-model="includeX11" class="accent-blue-600" />
        <span class="text-sm text-gray-700 dark:text-gray-200">Include X11</span>
      </label>
      <label class="inline-flex items-center gap-2 cursor-pointer">
        <input type="checkbox" v-model="includeTW" class="accent-emerald-600" />
        <span class="text-sm text-gray-700 dark:text-gray-200">Include Tailwind</span>
      </label>

      <!-- Top N dropdown -->
      <label class="inline-flex items-center gap-2 ml-auto">
        <span class="text-sm text-gray-600 dark:text-gray-300">Top</span>
        <select v-model.number="kSelected"
          class="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option v-for="n in K_OPTIONS" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>
    </div>

    <!-- Current color -->
    <div v-if="parsed && !('error' in parsed)" class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm" :style="swatchStyle" />
      <div class="space-y-1">
        <div class="text-sm text-gray-500 dark:text-gray-400">HEX</div>
        <div class="inline-flex items-center px-2 py-1 rounded-md text-sm font-mono"
          :style="{ backgroundColor: parsed.hex, color: labelColor }">
          {{ parsed.hex }}
        </div>
      </div>
    </div>
    <div v-else-if="parsed && 'error' in parsed" class="text-red-600 dark:text-red-400">
      {{ parsed.error }}
    </div>
    <div v-else class="text-gray-500 dark:text-gray-400 text-sm">Please enter a color.</div>

    <!-- Nearest colors (combined Top N) -->
    <div v-if="nearestCombined !== null">
      <h3 class="font-semibold mb-2">
        Nearest Top {{ Math.min(kSelected, combinedPool.length) }} (combined)
        <span class="ml-2 text-xs text-gray-500">
          Selected palettes: {{ (includeX11 ? 1 : 0) + (includeTW ? 1 : 0) }}
        </span>
      </h3>

      <div v-if="combinedPool.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
        Please select at least one palette.
      </div>

      <ul v-else class="divide-y divide-gray-200 dark:divide-gray-800 border rounded-lg overflow-hidden">
        <li v-for="item in nearestCombined" :key="item.source + '-' + item.name" class="flex items-center gap-3 p-3">
          <span class="w-6 h-6 rounded-md border border-gray-300 dark:border-gray-700"
            :style="{ backgroundColor: item.hex }" />
          <div class="flex-1">
            <div class="font-medium">{{ item.name }}</div>
            <div class="text-xs text-gray-500 font-mono">{{ item.hex }}</div>
          </div>
          <span class="text-xs px-2 py-0.5 rounded-md" :class="sourceBadgeClass(item.source)">
            {{ item.source === 'x11' ? 'X11' : 'Tailwind' }}
          </span>
          <div class="text-xs tabular-nums text-gray-500">d≈{{ item.dist.toFixed(4) }}</div>
        </li>
      </ul>
    </div>
  </div>
</template>
