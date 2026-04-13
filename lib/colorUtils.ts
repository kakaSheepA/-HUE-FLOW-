export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HSB {
  h: number;
  s: number;
  b: number;
}

/**
 * RGBA to HSB conversion (ignores alpha)
 */
export function rgbaToHsb(rgba: RGBA): HSB {
  const { r, g, b } = rgba;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    b: Math.round(v * 100)
  };
}

/**
 * HSB to RGBA conversion
 * returns r, g, b in [0, 1], keeps alpha
 */
export function hsbToRgba(hsb: HSB, a: number = 1): RGBA {
  const h = hsb.h / 360;
  const s = hsb.s / 100;
  const v = hsb.b / 100;

  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return { r, g, b, a };
}
