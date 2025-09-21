import Color from 'colorjs.io'
import { x11Colors } from '@/data/x11Colors'
import { getPlacesFeatures } from '@/data/geoData'
import tailwindColors from 'tailwindcss/colors'

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface Geo {
  lon: number; // 0 - 360
  lat: number; // -90 - 90
  r: number; // 0 - 1
}

export interface Point {
  group: string
  name: string
  hex: string
  hsl?: HSL
  geo: Geo
}

export function newPointWithGeo(geo: Geo, name: string, group: string): Point {
  const color = geoToColor(geo)
  const hex = color.to('srgb').toString()
  const hsl = colorToOkhsl(color)
  return { group, name, hex, hsl, geo }
}

export function newPointWithColor(colorString: string, name: string, group: string): Point {
  const color = newColor(colorString)
  const hex = color.to('srgb').toString()
  const hsl = colorToOkhsl(color)
  const geo = colorToGeo(color)
  return { group, name, hex, hsl, geo }
}

export function newColor(colorString: string): Color {
  const okhslMatch = colorString.trim().match(/^okhsl\((.+)\)$/i);
  if (okhslMatch) {
    const parts = okhslMatch[1].trim().split(/\s+/);
    const [h = 0, s = 0, l = 0] = parts.map((s, i) => {
      const num = parseFloat(s);
      if (isNaN(num)) return 0;
      return i === 0 ? num : Math.min((s.includes('%') ? num / 100 : num), 1);
    });
    return new Color('okhsl', [h, s, l]);
  }
  return new Color(colorString);
}

export function colorToOkhsl(color: Color): HSL {
  const [hRaw, sRaw, lRaw] = color.to('okhsl').coords
  const h = hRaw ?? 0
  const s = Math.min(sRaw ?? 0, 1) // sometimes above 1
  const l = lRaw ?? 0.5
  return { h, s, l }
}

export function colorToGeo(color: Color): Geo {
  const { h, s, l } = colorToOkhsl(color)
  return hslToGeo(h, s, l)
}

export function geoToColor(geo: Geo): Color {
  const h = ((geo.lon % 360) + 360) % 360;
  const latRad = (geo.lat * Math.PI) / 180;
  const r = Math.min(Math.max(geo.r, 0), 1);
  const z = r * Math.sin(latRad);
  const rz = r * Math.cos(latRad);
  let l = (z + 1) / 2;
  l = Math.min(Math.max(l, 0), 1);
  const denom = Math.sqrt(Math.max(0, 1 - z * z));
  const s = denom > 1e-12 ? Math.min(Math.max(rz / denom, 0), 1) : 0;
  return new Color('okhsl', [h, s, l]);
}
export function hslToGeo(h: number, s: number, l: number): Geo {
  const lon = h;
  const z = 2 * l - 1;
  const rz = s * Math.sqrt(Math.max(0, 1 - z * z));
  const r = Math.hypot(rz, z);
  const lat = Math.atan2(z, rz) * (180 / Math.PI);
  return { lat, lon, r };
}

export function getPoints(): Point[] {
  return [
    ...getAxisPoints(),
    ...getPlacePoints(),
    ...getX11Points(),
    ...getTailwindPoints(),
  ];
}

function getAxisPoints(): Point[] {
  const group = 'axis'
  const r = 1
  return [
    newPointWithGeo({ lat: 90, lon: 0, r }, 'North Pole', group),
    newPointWithGeo({ lat: -90, lon: 0, r }, 'South Pole', group),
  ]
}

function getPlacePoints(): Point[] {
  const group = 'places'
  const r = 1
  const points: Point[] = [
    newPointWithGeo({ lat: 64.18, lon: -51.72, r }, 'Nuuk', group),
    newPointWithGeo({ lat: 62.033, lon: 129.733, r }, 'Yakutsk', group),
    newPointWithGeo({ lat: 61.2167, lon: -149.8936, r }, 'Anchorage', group),
    newPointWithGeo({ lat: 55.05, lon: 82.95, r }, 'Novosibirsk', group),
    newPointWithGeo({ lat: 21.4858, lon: 39.1925, r }, 'Jeddah', group),
    newPointWithGeo({ lat: 21.3, lon: -157.85, r }, 'Honolulu', group),
    newPointWithGeo({ lat: 6.2442, lon: -75.5812, r }, 'Medellín', group),
    newPointWithGeo({ lat: -3.1190, lon: -60.0217, r }, 'Manaus', group),
    newPointWithGeo({ lat: -7.2504, lon: 112.7688, r }, 'Surabaya', group),
    newPointWithGeo({ lat: -16.6869, lon: -49.2648, r }, 'Goiânia', group),
    newPointWithGeo({ lat: -27.4698, lon: 153.0251, r }, 'Brisbane', group),
    newPointWithGeo({ lat: -31.5781, lon: 115.5133, r }, 'Perth', group),
    newPointWithGeo({ lat: -34.9285, lon: 138.6007, r }, 'Adelaide', group),
  ];

  for (const place of getPlacesFeatures()) {
    const lat = place.properties?.latitude
    const lon = place.properties?.longitude
    const name = place.properties?.name
    points.push(newPointWithGeo({ lat, lon, r }, name, group))
  }

  return points
}

function getX11Points(): Point[] {
  const group = 'x11'
  const hexMap: Record<string, { names: string[]; hex: string; color: ReturnType<typeof newColor> }> = {}

  for (const [name, hex] of Object.entries(x11Colors)) {
    if (!hexMap[hex]) {
      const color = newColor(hex)
      hexMap[hex] = { names: [name], hex, color }
    } else {
      hexMap[hex].names.push(name)
    }
  }

  const points: Point[] = []
  for (const { names, hex, color } of Object.values(hexMap)) {
    const hsl = colorToOkhsl(color)
    const geo = colorToGeo(color)
    points.push({
      group,
      name: names.join('/'),
      hex,
      hsl,
      geo,
    })
  }
  return points
}

function getTailwindPoints(): Point[] {
  const points: Point[] = []
  for (const [firstname, colorObj] of Object.entries(tailwindColors)) {
    if (typeof colorObj === 'object' && colorObj !== null) {
      for (const step of ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']) {
        const val = (colorObj as Record<string, string>)[step]
        const group = ['slate', 'gray', 'zinc', 'neutral', 'stone'].includes(firstname)
          ? 'tailwindGray' : 'tailwindChroma'
        const color = newColor(val)
        const hex = color.to('srgb').toString()
        const hsl = colorToOkhsl(color)
        const geo = colorToGeo(color)
        const name = `${firstname}-${step}`
        points.push({ group, name, hex, hsl, geo })
      }
    }
  }
  return points
}

