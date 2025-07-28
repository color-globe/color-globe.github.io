export function colorToOklch(val: string) {
  const {H, C, L} = colorToHCL(val)
  return {L, C, H};
}

export function colorToHCL(val: string) {
  if (val.startsWith('oklch')) return parseOklch(val);
  return hexToOklch(val);
}


function hexToOklch(hex: string) { return oklabToOklch(rgbToOklab(hexToRgb(hex))); }

function parseOklch(str: string) { const m = str.match(/^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)$/i); if (!m) throw new Error(`Invalid oklch: ${str}`); return { L: parseFloat(m[1]) / 100, C: parseFloat(m[2]), H: parseFloat(m[3]) }; }

function srgbToLinear(c: number) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }

function rgbToOklab({ r, g, b }: { r: number; g: number; b: number; }) {
  const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb, m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb, s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_, a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_, b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  return { L, a, b: b_ };
}

function hexToRgb(hex: string) {
  const bigint = parseInt(hex.replace('#', ''), 16);
  return { r: ((bigint >> 16) & 255) / 255, g: ((bigint >> 8) & 255) / 255, b: (bigint & 255) / 255 };
}

function oklabToOklch({ L, a, b }: { L: number, a: number, b: number }) {
  const C = Math.sqrt(a * a + b * b), H = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
  return { L, C, H };
}

// function isRgbInGamut(rgb: [number, number, number]): boolean {
//   return rgb.every(c => c >= 0 && c <= 1);
// }

export function getCmaxForOklch(L: number, H: number): number {
  const epsilon = 1e-7;
  const margin = 1e-5;
  const hRad = (H * Math.PI) / 180;

  let low = 0;
  let high = 1;
  let best = 0;

  while (high - low > epsilon) {
    const C = (low + high) / 2;

    // --- oklch → oklab ---
    const a = C * Math.cos(hRad);
    const b = C * Math.sin(hRad);

    // --- oklab → linear sRGB ---
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l3 = l_ ** 3;
    const m3 = m_ ** 3;
    const s3 = s_ ** 3;

    const r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    const b_ = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

    // --- gamut check (with margin) ---
    const inGamut =
      r >= -margin && r <= 1 + margin &&
      g >= -margin && g <= 1 + margin &&
      b_ >= -margin && b_ <= 1 + margin;

    if (inGamut) {
      best = C;
      low = C;
    } else {
      high = C;
    }
  }

  return best;
}

export function oklchToRgb([L, C, H]: [number, number, number]): [number, number, number] {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L;
  const m_ = a;
  const s_ = b;

  // Oklab to linear sRGB
  const l = l_ + 0.3963377774 * m_ + 0.2158037573 * s_;
  const m = l_ - 0.1055613458 * m_ - 0.0638541728 * s_;
  const s = l_ - 0.0894841775 * m_ - 1.2914855480 * s_;

  const l3 = l ** 3;
  const m3 = m ** 3;
  const s3 = s ** 3;

  const r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const b_ = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  return [r, g, b_];
}
