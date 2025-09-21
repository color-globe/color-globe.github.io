import { describe, expect, it, test } from 'vitest'
import { colorToGeo, geoToColor, newColor, hslToGeo, type Geo } from './point'
import Color from 'colorjs.io'

function expectGeoClose(actual: Geo, expected: Geo, precision = 2) {
  expect(actual.lat).toBeCloseTo(expected.lat, precision)
  expect(actual.lon).toBeCloseTo(expected.lon, precision)
  expect(actual.r).toBeCloseTo(expected.r, precision)
}

describe('colorToGeo — named CSS colors', () => {
  test.each([
    ['black', { lat: -90, lon: 0, r: 1 }],
    ['white', { lat: 90, lon: 0, r: 1 }],
    ['gray', { lat: 6.427, lon: 0, r: 0.112 }],
    ['red', { lat: 12.26, lon: 29.234, r: undefined }], // r is variable
    ['green', { lat: -10.13, lon: 142.5, r: undefined }],
    ['blue', { lat: -24.02, lon: 264.05, r: undefined }],
  ])('should handle CSS color: %s', (input, expected) => {
    const geo = colorToGeo(newColor(input))
    expect(geo.lat).toBeCloseTo(expected.lat, 2)
    expect(geo.lon).toBeCloseTo(expected.lon, 2)
    if (typeof expected.r === 'number') {
      expect(geo.r).toBeCloseTo(expected.r, 2)
    } else {
      expect(geo.r).toBeLessThanOrEqual(1)
    }
  })
})

describe('colorToGeo — okhsl string input', () => {
  test.each([
    ['okhsl(0 0% 0%)', { lat: -90, lon: 0, r: 1 }],
    ['okhsl(0 0% 100%)', { lat: 90, lon: 0, r: 1 }],
    ['okhsl(0 0% 50%)', { lat: 0, lon: 0, r: 0 }],
    ['okhsl(180 100% 50%)', { lat: 0, lon: 180, r: 1 }],
    ['okhsl(180 0% 50%)', { lat: 0, lon: 180, r: 0 }],
    ['okhsl(720 100% 50%)', { lat: 0, lon: 0, r: 1 }],
    ['okhsl(50 80% 40%)', { lat: -18, lon: 50, r: 0.861 }],
    ['okhsl(120 0.6 0.3)', { lat: -36, lon: 120, r: 0.835 }],
    ['okhsl(200 150% 0.5)', { lat: 0, lon: 200, r: 1 }],
    ['okhsl(foo bar baz)', { lat: -90, lon: 0, r: 1 }],
    ['okhsl(370 80% 40%)', { lat: -18, lon: 10, r: 0.861 }],
  ])('should handle OKHSL input: %s', (input, expected) => {
    const geo = colorToGeo(newColor(input))
    expectGeoClose(geo, expected)
  })
})

describe('geoToColor — from Geo to okhsl Color', () => {
  test.each([
    [{ lat: -90, lon: 0, r: 1 }, new Color('okhsl', [0, 0, 0])],
    [{ lat: 90, lon: 0, r: 1 }, new Color('okhsl', [0, 0, 1])],
    [{ lat: 0, lon: 0, r: 0 }, new Color('okhsl', [0, 0, 0.5])],
    [{ lat: 0, lon: 180, r: 1 }, new Color('okhsl', [180, 1, 0.5])],
    [{ lat: 0, lon: 180, r: 0 }, new Color('okhsl', [180, 0, 0.5])],
    [{ lat: 0, lon: 720, r: 1 }, new Color('okhsl', [0, 1, 0.5])],
    [{ lat: -18, lon: 50, r: 0.861 }, new Color('okhsl', [50, 0.8, 0.4])],
    [{ lat: -36, lon: 120, r: 0.835 }, new Color('okhsl', [120, 0.6, 0.3])],
    [{ lat: 0, lon: 200, r: 1 }, new Color('okhsl', [200, 1, 0.5])],
    [{ lat: -18, lon: 370, r: 0.861 }, new Color('okhsl', [10, 0.8, 0.4])],
  ])('should convert Geo %j to color %O', (geo, expected) => {
    const actual = geoToColor(geo)
    const [h1, s1, l1] = actual.to('okhsl').coords.map(c => c ?? 0)
    const [h2, s2, l2] = expected.to('okhsl').coords.map(c => c ?? 0)

    expect(h1 % 360).toBeCloseTo(h2 % 360, 2)
    expect(s1).toBeCloseTo(s2, 2)
    expect(l1).toBeCloseTo(l2, 2)
  })
})


describe('hslToGeo', () => {
  it('should handle gray (s = 0)', () => {
    const geo = hslToGeo(0, 0, 0.5)
    expect(geo.lat).toBeCloseTo(0)
    expect(geo.lon).toBeCloseTo(0)
    expect(geo.r).toBe(1)
  })

  it('should handle black (s = 0, l = 0)', () => {
    const geo = hslToGeo(0, 0, 0)
    expect(geo.lat).toBeCloseTo(-90)
    expect(geo.lon).toBeCloseTo(0)
    expect(geo.r).toBe(1)
  })

  it('should handle white (s = 0, l = 1)', () => {
    const geo = hslToGeo(0, 0, 1)
    expect(geo.lat).toBeCloseTo(90)
    expect(geo.lon).toBeCloseTo(0)
    expect(geo.r).toBe(1)
  })

  it('should handle red (h = 0, s = 1, l = 0.5)', () => {
    const geo = hslToGeo(0, 1, 0.5)
    expect(geo.lat).toBeCloseTo(0)
    expect(geo.lon).toBeCloseTo(0)
    expect(geo.r).toBe(1)
  })

  it('should handle blue (h = 240, s = 1, l = 0.5)', () => {
    const geo = hslToGeo(240, 1, 0.5)
    expect(geo.lat).toBeCloseTo(0)
    expect(geo.lon).toBeCloseTo(240)
    expect(geo.r).toBe(1)
  })

  it('should handle pastel color (h = 180, s = 0.5, l = 0.75)', () => {
    const geo = hslToGeo(180, 0.5, 0.75)
    expect(geo.lat).toBeGreaterThan(0)
    expect(geo.lat).toBeLessThan(90)
    expect(geo.lon).toBeCloseTo(180)
    expect(geo.r).toBe(1)
  })
})
