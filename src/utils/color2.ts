function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace(/^#/, '');
  const bigint = parseInt(hex, 16);
  return [((bigint >> 16) & 255) / 255, ((bigint >> 8) & 255) / 255, (bigint & 255) / 255];
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgbToOklab([r, g, b]: [number, number, number]): [number, number, number] {
  r = srgbToLinear(r); g = srgbToLinear(g); b = srgbToLinear(b);
  const l = 0.41222147 * r + 0.53633254 * g + 0.05144599 * b;
  const m = 0.2119035 * r + 0.68069955 * g + 0.10739696 * b;
  const s = 0.08830246 * r + 0.28171884 * g + 0.6299787 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const L = 0.21045426 * l_ + 0.79361779 * m_ - 0.00407205 * s_;
  const a = 1.9779985 * l_ - 2.4285922 * m_ + 0.45059371 * s_;
  const b_ = 0.02590404 * l_ + 0.78277177 * m_ - 0.80867577 * s_;
  return [L, a, b_];
}

function oklabToOkhsl([L, a, b]: [number, number, number]): [number, number, number] {
  const h = Math.atan2(b, a) * (180 / Math.PI);
  const H = (h + 360) % 360;
  const C = Math.sqrt(a * a + b * b);
  const s = C / (L * (1 - L));
  const S = Math.max(0, Math.min(1, s));
  return [H, S, L];
}

export function rgb2okhsl(hex: string): [number, number, number] {
  const rgb = hexToRgb(hex);
  return oklabToOkhsl(rgbToOklab(rgb));
}

export function latlon2okhsl(lat: number, lon: number): [number, number, number] {
  const L = (lat + 90) / 180;
  const H = ((lon % 360) + 360) % 360;
  const C_eff = (0.5 - Math.abs(L - 0.5)) * 2;
  const C = C_eff * 0.4;
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  return oklabToOkhsl([L, a, b]);
}
