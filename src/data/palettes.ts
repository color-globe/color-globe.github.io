// src/data/palettes.ts
import Color from 'colorjs.io'
import twColors from 'tailwindcss/colors'
import { x11Colors } from './x11Colors'

/* ---------- 공통 타입 ---------- */
export type Swatch = {
  name: string
  hex: string
  color: InstanceType<typeof Color>
}

export function getX11Swatches(): Swatch[] {
  return Object.entries(x11Colors).map(([name, hex]) => {
    const c = new Color(hex)
    return { name, hex: hex.toUpperCase(), color: c }
  })
}

/* ---------- Tailwind ---------- */
const EXCLUDE_KEYS = new Set(['inherit', 'current', 'transparent', 'black', 'white'])
const STEPS = ['50','100','200','300','400','500','600','700','800','900','950','DEFAULT'] as const

export function getTailwindSwatches(): Swatch[] {
  const out: Swatch[] = []

  for (const [family, shades] of Object.entries(twColors as Record<string, unknown>)) {
    if (EXCLUDE_KEYS.has(family)) continue

    // 1) 색상값이 단일 문자열인 팔레트 (드묾)
    if (typeof shades === 'string') {
      try {
        const c = new Color(shades)
        const srgb = c.to('srgb').toGamut({ space: 'srgb' })
        out.push({
          name: family,
          hex: srgb.toString({ format: 'hex' }).toUpperCase(),
          color: srgb,
        })
      } catch { /* 토큰/변수면 건너뜀 */ }
      continue
    }

    // 2) 일반적인 shade 객체 팔레트
    if (shades && typeof shades === 'object') {
      const obj = shades as Record<string, unknown>
      for (const step of STEPS) {
        const val = obj[step]
        if (typeof val !== 'string') continue
        try {
          const c = new Color(val) // '#rrggbb' | 'rgb(...)' | 'hsl(...)' 등 가능
          const srgb = c.to('srgb').toGamut({ space: 'srgb' })
          const name = step === 'DEFAULT' ? family : `${family}-${step}`
          out.push({
            name,
            hex: srgb.toString({ format: 'hex' }).toUpperCase(),
            color: srgb,
          })
        } catch {
          // 예: 'oklch(var(--twc))'처럼 CSS 변수 기반 토큰은 파싱 불가 → 스킵
        }
      }
    }
  }

  return out
}

/* ---------- 팔레트 통합 ---------- */
export const Palettes = {
  x11: getX11Swatches(),
  tailwind: getTailwindSwatches(),
}
