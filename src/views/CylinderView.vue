<template>
  <div class="flex">
    <!-- 좌측: 3D + 2D -->
    <div>
      <div class="mb-2 space-x-4">
        <label><input type="checkbox" v-model="enabledSimpleColors" /> Show Simple Colors</label>
        <label><input type="checkbox" v-model="enabledChromaTailwind" /> Show Tailwind Chroma</label>
        <label><input type="checkbox" v-model="enabledGrayTailwind" /> Show Tailwind Gray</label>
        <label><input type="checkbox" v-model="enabledCities" /> Show Cities</label>
        <label><input type="checkbox" v-model="enabledGamutPoints" /> Show Gamut Points</label>
      </div>

      <div ref="container" class="relative w-[800px] h-[600px] border mb-4">
        <canvas ref="canvas" width="800" height="600" class="absolute top-0 left-0"></canvas>
      </div>

      <div class="relative w-[800px] h-[300px] border">
        <canvas ref="canvas2" width="800" height="300" class="absolute top-0 left-0"></canvas>
      </div>
    </div>

    <!-- 우측: 구면좌표계 + 극좌표계 -->
    <div class="flex flex-col ml-4">
      <div class="relative w-[400px] h-[400px] border mb-4">
        <canvas ref="canvas4" width="400" height="400" class="absolute top-0 left-0"></canvas>
      </div>
      <div class="relative w-[400px] h-[400px] border">
        <canvas ref="canvas3" width="400" height="400" class="absolute top-0 left-0"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import Color from 'colorjs.io';
import tailwindColors from 'tailwindcss/colors';

const canvas = ref<HTMLCanvasElement | null>(null);
const canvas2 = ref<HTMLCanvasElement | null>(null);
const canvas3 = ref<HTMLCanvasElement | null>(null);
const canvas4 = ref<HTMLCanvasElement | null>(null);
const container = ref<HTMLDivElement | null>(null);

const enabledSimpleColors = ref(true);
const enabledChromaTailwind = ref(true);
const enabledGrayTailwind = ref(false);
const enabledCities = ref(true);
const enabledGamutPoints = ref(false);

type PointType = 'tailwind-chroma' | 'tailwind-gray' | 'simple' | 'city' | 'gamut';

interface LCH {
  L: number;
  C: number;
  H: number;
}

interface Point {
  color: string;
  name: string;
  LCH: LCH;
  type: PointType;
}

const points: Point[] = [];
const gamutPoints: Point[] = [];

function colorToLCH(color: string): LCH {
  const { coords } = new Color(color).to('oklch');
  const [L, C, H] = coords.map(c => c ?? 0);
  return { L, C, H };
}

function getCmaxForOklch(l: number): number {
  const maxC = 0.4;
  const weight = 1 - 4 * (l - 0.5) ** 2;
  return maxC * Math.max(0, weight);
}

function isChromaColor(name: string) {
  const chromaList = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];
  return chromaList.includes(name);
}

function addColor(name: string, color: string, type: PointType) {
  const LCH = colorToLCH(color);
  points.push({ name, color, LCH, type });
}

for (const [name, colorObj] of Object.entries(tailwindColors)) {
  if (typeof colorObj === 'object' && colorObj !== null) {
    const isChroma = isChromaColor(name);
    for (const step of ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']) {
      const val = colorObj[step as keyof typeof colorObj];
      if (typeof val === 'string') {
        addColor(`${name}-${step}`, val, isChroma ? 'tailwind-chroma' : 'tailwind-gray');
      }
    }
  }
}

const simpleColors: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#00ff00',
  blue: '#0000ff',
};
for (const [name, val] of Object.entries(simpleColors)) {
  addColor(name, val, 'simple');
}

const cityPoints = [
  { name: 'North Pole', lat: 90, lon: 0 },
  { name: 'South Pole', lat: -90, lon: 0 },
  { name: 'Seoul', lat: 37.5665, lon: 126.9780 },
  { name: 'Tokyo', lat: 35.6895, lon: 139.6917 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
];
cityPoints.forEach(({ name, lat, lon }) => {
  const { L, C, H } = latLonToOklch(lat, lon);
  const color = getColorFromOklch(L, C, H);
  points.push({ name, color, LCH: { L, C, H }, type: 'city' });
});

for (let l = 0; l <= 1.00001; l += 0.05) {
  for (let h = 0; h < 360; h += 10) {
    const C = getCmaxForOklch(l);
    if (C > 0) {
      const color = `oklch(${(l * 100).toFixed(1)}% ${C.toFixed(3)} ${h})`;
      gamutPoints.push({
        name: `(${h.toFixed(0)},${l.toFixed(1)})`,
        color,
        LCH: { L: l, C, H: h },
        type: 'gamut',
      });
    }
  }
}

let zoom = 1;
let offsetY = 0;
let hueOffset = 0;
let isDragging = false;
let lastX = 0, lastY = 0;

function projectCylindrical3D(lch: LCH) {
  const { L, C, H } = lch;
  const theta = Math.PI / 6;
  const phi = 23.5 * Math.PI / 180;
  const scale = 300;
  const centerX = 400;
  const centerY = 300;

  const rad = ((H + hueOffset) % 360) * Math.PI / 180;

  let x = C * Math.cos(rad);
  let y = 1 - L;
  let z = C * Math.sin(rad);

  const x1 = x * Math.cos(theta) + z * Math.sin(theta);
  const z1 = -x * Math.sin(theta) + z * Math.cos(theta);
  x = x1;
  z = z1;

  const y1 = y * Math.cos(phi) + z * Math.sin(phi);
  const z2 = -y * Math.sin(phi) + z * Math.cos(phi);
  y = y1;
  z = z2;

  return {
    x: centerX + x * scale * zoom,
    y: centerY + y * scale * zoom + offsetY,
    z,
    scale: 0.8 + (1 - z) * 0.5,
  };
}

function projectFlat(lch: LCH) {
  const { H, L } = lch;
  const adjustedHue = (H + hueOffset) % 360;
  const x = adjustedHue / 360 * 800;
  const y = (1 - L) * 300;
  return { x, y };
}

function projectPolar(lch: LCH) {
  const { H, C } = lch;
  const cx = 200;
  const cy = 200;
  const r = Math.min(180, C / 0.5 * 180);
  const rad = ((H + hueOffset) % 360) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function projectSpherical(lch: LCH) {
  const { L, C, H } = lch;
  const baseRadius = 140;
  const elevation = C / 0.5 * 40;
  const radius = baseRadius + elevation;
  const lat = (L - 0.5) * Math.PI;
  const lon = ((H + hueOffset) % 360) * Math.PI / 180;
  const x = 200 + radius * Math.cos(lat) * Math.sin(lon);
  const y = 200 - radius * Math.sin(lat);
  return { x, y };
}

function render(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, 800, 600);

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  for (let h = 0; h < 360; h += 30) {
    const path = [];
    for (let l = 0; l <= 1; l += 0.05) {
      const proj = projectCylindrical3D({ L: l, C: 0.5, H: h });
      path.push({ x: proj.x, y: proj.y });
    }
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
  }

  const projected = getAllVisiblePoints()
    .map(p => ({ ...projectCylindrical3D(p.LCH), p }))
    .sort((a, b) => a.z - b.z);

  for (const { x, y, scale, p } of projected) {
    renderPoint(ctx, x, y, p.color, p.name, 4 * scale, 10 * scale);
  }
}

function renderFlat(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, 800, 300);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  for (let h = 0; h <= 360; h += 30) {
    const x = ((h + hueOffset) % 360) / 360 * 800;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 300);
    ctx.stroke();
  }
  for (let l = 0; l <= 1.001; l += 0.1) {
    const y = (1 - l) * 300;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(800, y);
    ctx.stroke();
  }

  for (const p of getAllVisiblePoints()) {
    const { x, y } = projectFlat(p.LCH);
    renderPoint(ctx, x, y, p.color, p.name);
  }
}

function renderPolar(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, 400, 400);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  for (let h = 0; h < 360; h += 30) {
    const rad = h * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.lineTo(200 + 180 * Math.cos(rad), 200 + 180 * Math.sin(rad));
    ctx.stroke();
  }
  for (let c = 0.1; c <= 0.5; c += 0.1) {
    ctx.beginPath();
    ctx.arc(200, 200, c / 0.5 * 180, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const p of getAllVisiblePoints()) {
    const { x, y } = projectPolar(p.LCH);
    renderPoint(ctx, x, y, p.color, p.name);
  }
}

function renderSpherical(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, 400, 400);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  for (let h = 0; h < 360; h += 30) {
    ctx.beginPath();
    for (let l = 0; l <= 1.0; l += 0.05) {
      const { x, y } = projectSpherical({ L: l, C: 0.4, H: h });
      if (l === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  for (const p of getAllVisiblePoints()) {
    const { x, y } = projectSpherical(p.LCH);
    renderPoint(ctx, x, y, p.color);
  }
}

function latLonToOklch(lat: number, lon: number): LCH {
  const L = (lat + 90) / 180;
  const H = (lon + 360) % 360;
  const Ceff = 1 - 4 * (L - 0.5) ** 2;
  const C = 0.4 * Math.max(0, Ceff);
  return { L, C, H };
}

function getColorFromOklch(L: number, C: number, H: number): string {
  return `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${H.toFixed(1)})`;
}

function getAllVisiblePoints(): Point[] {
  return [...points, ...(enabledGamutPoints.value ? gamutPoints : [])].filter(shouldShowPoint);
}

function shouldShowPoint(p: Point): boolean {
  return !(
    (p.type === 'tailwind-chroma' && !enabledChromaTailwind.value) ||
    (p.type === 'tailwind-gray' && !enabledGrayTailwind.value) ||
    (p.type === 'simple' && !enabledSimpleColors.value) ||
    (p.type === 'city' && !enabledCities.value) ||
    (p.type === 'gamut' && !enabledGamutPoints.value)
  );
}

function renderPoint(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, label?: string, radius = 4, fontSize = 10) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  if (label) {
    ctx.fillStyle = 'white';
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillText(label, x + radius + 2, y + fontSize / 2);
  }
}

onMounted(() => {
  const ctx = canvas.value!.getContext('2d')!;
  const ctx2 = canvas2.value!.getContext('2d')!;
  const ctx3 = canvas3.value!.getContext('2d')!;
  const ctx4 = canvas4.value!.getContext('2d')!;
  const rerender = () => {
    render(ctx);
    renderFlat(ctx2);
    renderPolar(ctx3);
    renderSpherical(ctx4);
  };
  rerender();

  container.value!.addEventListener('mousedown', e => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  window.addEventListener('mouseup', () => isDragging = false);
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    hueOffset -= dx * 0.5;
    offsetY += dy;
    lastX = e.clientX;
    lastY = e.clientY;
    rerender();
  });
  container.value!.addEventListener('wheel', e => {
    e.preventDefault();
    zoom *= e.deltaY > 0 ? 0.9 : 1.1;
    zoom = Math.max(0.2, Math.min(zoom, 5));
    rerender();
  }, { passive: false });

  [enabledSimpleColors, enabledChromaTailwind, enabledGrayTailwind, enabledCities, enabledGamutPoints].forEach(flag => {
    watch(flag, rerender);
  });
});
</script>
