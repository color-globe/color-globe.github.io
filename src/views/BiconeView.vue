<template>
  <div class="flex">
    <!-- 왼쪽: 컨트롤 패널 -->
    <div class="w-[250px] mr-4 p-2 border rounded bg-white/10 text-white space-y-3">
      <div v-if="selectedColor" class="p-2 border mb-2 text-white bg-black/70 rounded text-sm">
        <div><b>{{ selectedColor.name }}</b></div>
        <div>RGB: {{ selectedColor.color }}</div>
        <div>Oklch: oklch({{ (selectedColor.L * 100).toFixed(1) }}% {{ (selectedColor.S * 0.4).toFixed(3) }} {{
          selectedColor.H.toFixed(1) }})</div>
        <div>Okhsl: okhsl({{ selectedColor.H.toFixed(1) }} {{ selectedColor.S.toFixed(3) }} {{
          selectedColor.L.toFixed(3) }})</div>
      </div>

      <div>
        <h3 class="font-bold mb-1">Objects</h3>
        <label class="block"><input type="checkbox" v-model="enabledSimpleColors" /> Show Simple Colors</label>
        <label class="block"><input type="checkbox" v-model="enabledChromaTailwind" /> Show Tailwind Chroma</label>
        <label class="block"><input type="checkbox" v-model="enabledGrayTailwind" /> Show Tailwind Gray</label>
        <label class="block"><input type="checkbox" v-model="enabledGridColors" /> Show Grid Colors</label>
        <label class="block"><input type="checkbox" v-model="enabledCities" /> Show Cities</label>
        <label class="block"><input type="checkbox" v-model="showChromaLines" /> Show Tailwind Chroma Lines</label>
        <label class="block"><input type="checkbox" v-model="showGrayLines" /> Show Tailwind Gray Lines</label>
        <label class="block"><input type="checkbox" v-model="showGridLines" /> Show Grid Lines</label>
      </div>

      <div>
        <h3 class="font-bold mb-1">Controls</h3>
        <label class="block"><input type="checkbox" v-model="showName" /> Show Name</label>
        <label class="block"><input type="checkbox" v-model="autoRotate" /> Rotate</label>
      </div>
    </div>

    <!-- 오른쪽: 2x2 시각화 -->
    <div class="grid grid-cols-2 grid-rows-2 gap-4">
      <div>
        <div class="text-white mb-1 text-sm">지구본 (입체, 구)</div>
        <div class="relative w-[400px] h-[400px] border">
          <canvas ref="canvasSphere" width="400" height="400" class="absolute top-0 left-0"></canvas>
        </div>
      </div>

      <div>
        <div class="text-white mb-1 text-sm">평면도 (원형)</div>
        <div class="relative w-[400px] h-[400px] border">
          <canvas ref="canvasPolar" width="400" height="400" class="absolute top-0 left-0"></canvas>
        </div>
      </div>

      <div>
        <div class="text-white mb-1 text-sm">세계지도 (평면, 직사각형)</div>
        <div class="relative w-[400px] h-[300px] border">
          <canvas ref="canvasFlat" width="400" height="300" class="absolute top-0 left-0"></canvas>
        </div>
      </div>

      <div>
        <div class="text-white mb-1 text-sm">정면도 (원형)</div>
        <div class="relative w-[400px] h-[400px] border">
          <canvas ref="canvasFrontal" width="400" height="400" class="absolute top-0 left-0"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>



<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import tailwindColors from 'tailwindcss/colors';
import { latlon2okhsl, rgb2okhsl } from '@/utils/color2';

const canvasSphere = ref<HTMLCanvasElement | null>(null);
const canvasPolar = ref<HTMLCanvasElement | null>(null);
const canvasFlat = ref<HTMLCanvasElement | null>(null);
const canvasFrontal = ref<HTMLCanvasElement | null>(null);

const enabledSimpleColors = ref(true);
const enabledChromaTailwind = ref(true);
const enabledGrayTailwind = ref(false);
const enabledCities = ref(true);
const enabledGridColors = ref(true);
const showName = ref(true);
const showChromaLines = ref(false);
const showGrayLines = ref(false);
const showGridLines = ref(false);
const autoRotate = ref(true);

const selectedColor = ref<any>(null);

const chromaList = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];

const points: {
  name: string;
  color: string;
  H: number;
  S: number;
  L: number;
  type: 'simple' | 'tailwind-chroma' | 'tailwind-gray' | 'city' | 'grid';
}[] = [];

function addPoint(name: string, hex: string, type: typeof points[number]['type']) {
  const [H, S, L] = rgb2okhsl(hex);
  points.push({ name, color: hex, H, S, L, type });
}

for (const [name, group] of Object.entries(tailwindColors)) {
  if (typeof group === 'object') {
    const isChroma = chromaList.includes(name);
    for (const key in group) {
      const hex = group[key as keyof typeof group];
      if (typeof hex === 'string') {
        addPoint(`${name}-${key}`, hex, isChroma ? 'tailwind-chroma' : 'tailwind-gray');
      }
    }
  }
}

for (const [name, hex] of Object.entries({ black: '#000000', white: '#ffffff', red: '#ff0000', green: '#00ff00', blue: '#0000ff' })) {
  addPoint(name, hex, 'simple');
}

for (const { name, lat, lon } of [
  { name: 'North Pole', lat: 90, lon: 0 },
  { name: 'South Pole', lat: -90, lon: 0 },
  { name: 'Seoul', lat: 37.5665, lon: 126.978 },
  { name: 'Tokyo', lat: 35.6895, lon: 139.6917 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
]) {
  const [H, S, L] = latlon2okhsl(lat, lon);
  const color = `oklch(${L * 100}% ${S * 0.4} ${H})`;
  points.push({ name, color, H, S, L, type: 'city' });
}

for (let lat = -90; lat <= 90; lat += 15) {
  for (let lon = 0; lon < 360; lon += 15) {
    const [H, S, L] = latlon2okhsl(lat, lon);
    const color = `oklch(${(L * 100).toFixed(1)}% ${(S * 0.4).toFixed(3)} ${H.toFixed(1)})`;
    points.push({ name: `grid-${lat},${lon}`, color, H, S, L, type: 'grid' });
  }
}

function isEnabled(type: string) {
  return (
    (type === 'simple' && enabledSimpleColors.value) ||
    (type === 'tailwind-chroma' && enabledChromaTailwind.value) ||
    (type === 'tailwind-gray' && enabledGrayTailwind.value) ||
    (type === 'city' && enabledCities.value) ||
    (type === 'grid' && enabledGridColors.value)
  );
}

function drawPoint(ctx: CanvasRenderingContext2D, p: typeof points[number], x: number, y: number) {
  if (!isEnabled(p.type)) return;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fillStyle = p.color;
  ctx.fill();
  if (showName.value) {
    ctx.fillStyle = 'white';
    ctx.font = '10px sans-serif';
    ctx.fillText(p.name, x + 6, y + 4);
  }
}

function drawLine(ctx: CanvasRenderingContext2D, a: { x: number, y: number }, b: { x: number, y: number }, color = 'white') {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = color;
  ctx.stroke();
}

let rotation = 0;
let lastUserInteraction = 0;
let dragging = false;
let lastX = 0;

function renderAll() {
  const now = Date.now();
  if (autoRotate.value && now - lastUserInteraction > 3000 && !dragging) {
    rotation += 0.01;
  }

  const projections = {
    canvasSphere,
    canvasPolar,
    canvasFlat,
    canvasFrontal,
  };

  for (const [refName, ref] of Object.entries(projections)) {
    const ctx = ref.value?.getContext('2d');
    if (!ctx) continue;
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);

    const filter = (type: string) => points.filter(p => isEnabled(p.type) && p.type === type);

    if (showChromaLines.value) {
      const chroma = filter('tailwind-chroma');
      for (let i = 1; i < chroma.length; i++) {
        const prev = chroma[i - 1], curr = chroma[i];
        drawLine(ctx, getXY(prev, refName), getXY(curr, refName), 'rgba(255, 0, 255, 0.5)');
      }
    }

    if (showGrayLines.value) {
      const gray = filter('tailwind-gray');
      for (let i = 1; i < gray.length; i++) {
        const prev = gray[i - 1], curr = gray[i];
        drawLine(ctx, getXY(prev, refName), getXY(curr, refName), 'rgba(128, 128, 128, 0.5)');
      }
    }

    if (showGridLines.value) {
      const grid = filter('grid');
      for (let i = 0; i < grid.length; i++) {
        for (let j = i + 1; j < grid.length; j++) {
          if (grid[i].name.split('-')[1].split(',')[0] === grid[j].name.split('-')[1].split(',')[0] ||
            grid[i].name.split('-')[1].split(',')[1] === grid[j].name.split('-')[1].split(',')[1]) {
            drawLine(ctx, getXY(grid[i], refName), getXY(grid[j], refName), 'rgba(0,255,255,0.2)');
          }
        }
      }
    }

    for (const p of points) {
      const { x, y } = getXY(p, refName);
      drawPoint(ctx, p, x, y);
    }
  }

  requestAnimationFrame(renderAll);
}

function getXY(p: typeof points[number], view: string) {
  const rad = ((p.H % 360) * Math.PI) / 180;
  const cosR = Math.cos(rotation), sinR = Math.sin(rotation);
  const hRot = rad + rotation;

  return {
    canvasSphere: { x: 200 + p.S * 100 * Math.cos(hRot), y: 200 + (0.5 - p.L) * 400 },
    canvasPolar: { x: 200 + p.S * 100 * Math.cos(rad), y: 200 + p.S * 100 * Math.sin(rad) },
    canvasFlat: { x: ((p.H + rotation * 180 / Math.PI) % 360) / 360 * 400, y: (1 - p.L) * 300 },
    canvasFrontal: { x: 200 + p.S * 100 * Math.sin(rad), y: 200 - p.L * 180 },
  }[view]!;
}

function onClick(e: MouseEvent) {
  for (const ref of [canvasSphere, canvasPolar, canvasFlat, canvasFrontal]) {
    const rect = ref.value?.getBoundingClientRect();
    if (!rect) continue;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (const p of points) {
      const pt = getXY(p, ref.value!.ref);
      if (Math.hypot(x - pt.x, y - pt.y) < 5) {
        selectedColor.value = p;
        return;
      }
    }
  }
}

onMounted(() => {
  requestAnimationFrame(renderAll);

  for (const ref of [canvasSphere, canvasPolar, canvasFlat, canvasFrontal]) {
    ref.value?.addEventListener('click', onClick);
    ref.value?.addEventListener('mousedown', e => {
      dragging = true;
      lastX = e.clientX;
    });
    ref.value?.addEventListener('mouseup', () => {
      dragging = false;
    });
    ref.value?.addEventListener('mousemove', e => {
      if (dragging) {
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        rotation += dx * 0.005;
        lastUserInteraction = Date.now();
      }
    });
  }

  [
    enabledSimpleColors,
    enabledChromaTailwind,
    enabledGrayTailwind,
    enabledCities,
    enabledGridColors,
    showName,
    showChromaLines,
    showGrayLines,
    showGridLines,
    autoRotate,
  ].forEach(flag => watch(flag, () => requestAnimationFrame(renderAll)));
});
</script>
