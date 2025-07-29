import Color from 'colorjs.io';

export interface Geo {
  lat: number; // 위도 (degree, -90-90)
  lon: number; // 경도 (degree, 0-360)
  alt: number; // 고도 = 반지름 (0-1)
}

export function colorToGeo(input: string): Geo {
  let color: Color;

  const okhslMatch = input.trim().match(/^okhsl\((.+)\)$/i);
  if (okhslMatch) {
    const parts = okhslMatch[1].trim().split(/\s+/);
    const [H = 0, S = 0, L = 0] = parts.map((s, i) => {
      const num = parseFloat(s);
      if (isNaN(num)) return 0;
      return i === 0 ? num : Math.min((s.includes('%') ? num / 100 : num), 1);
    });
    color = new Color({ space: 'okhsl', coords: [H, S, L] });
  } else {
    color = new Color(input);
  }

  const [H, S_raw, L] = color.to('okhsl').coords.map(c => c ?? 0);
  const S = Math.min(S_raw, 1);

  const lat = (L - 0.5) * 180;
  const lon = H % 360;
  const lFactor = Math.sin(Math.abs(L - 0.5) * Math.PI);
  const alt = S + (1 - S) * lFactor;

  return { lat, lon, alt };
}
