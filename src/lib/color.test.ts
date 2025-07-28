import { describe, it, expect } from 'vitest';
import { colorToGeo } from './color';

describe('colorToGeo — okhsl to Geo (degrees)', () => {
  it('should handle black', () => {
    const geo = colorToGeo('black');
    expect(geo.lat).toBeCloseTo(-90);
    expect(geo.lon).toBeCloseTo(0);
    expect(geo.alt).toBeCloseTo(1);
  });

  it('should handle white', () => {
    const geo = colorToGeo('white');
    expect(geo.lat).toBeCloseTo(90);
    expect(geo.lon).toBeCloseTo(0);
    expect(geo.alt).toBeCloseTo(1);
  });

  it('should handle gray', () => {
    const geo = colorToGeo('gray');
    expect(geo.lat).toBeCloseTo(6.427);
    expect(geo.alt).toBeCloseTo(0.112);
  });

  it('should handle red', () => {
    const geo = colorToGeo('red');
    expect(geo.lon).toBeCloseTo(29.234);
    expect(geo.lat).toBeCloseTo(12.26);
    expect(geo.alt).toBeLessThanOrEqual(1);
  });

  it('should handle green', () => {
    const geo = colorToGeo('green');
    expect(geo.lon).toBeCloseTo(142.5);
    expect(geo.lat).toBeCloseTo(-10.13);
    expect(geo.alt).toBeLessThanOrEqual(1);
  });

  it('should handle blue', () => {
    const geo = colorToGeo('blue');
    expect(geo.lon).toBeCloseTo(264.05);
    expect(geo.lat).toBeCloseTo(-24.02);
    expect(geo.alt).toBeLessThanOrEqual(1);
  });


  // okhsl
  it('should parse okhsl with percentage format', () => {
    const result = colorToGeo('okhsl(50 80% 40%)');
    expect(result.lon).toBeCloseTo(50);
    expect(result.lat).toBeCloseTo((0.4 - 0.5) * 180);
    expect(result.alt).toBeCloseTo(0.861);
  });

  it('should parse okhsl with decimal format', () => {
    const result = colorToGeo('okhsl(120 0.6 0.3)');
    expect(result.lon).toBeCloseTo(120);
    expect(result.lat).toBeCloseTo((0.3 - 0.5) * 180);
    expect(result.alt).toBeCloseTo(0.835);
  });

  it('should clamp S > 1 to 1', () => {
    const result = colorToGeo('okhsl(200 150% 0.5)');
    expect(result.lon).toBeCloseTo(200);
    expect(result.lat).toBeCloseTo(0);
    expect(result.alt).toBeCloseTo(1);
  });

  it('should handle malformed input gracefully', () => {
    const result = colorToGeo('okhsl(foo bar baz)');
    expect(result.lon).toBeCloseTo(0);
    expect(result.lat).toBeCloseTo(-90);
    expect(result.alt).toBeCloseTo(1);
  });

  it('should wrap hue > 360 correctly', () => {
    const result = colorToGeo('okhsl(370 80% 40%)');
    expect(result.lon).toBeCloseTo(10);
    expect(result.lat).toBeCloseTo(-17.999);
    expect(result.alt).toBeCloseTo(0.861);
  });
});
