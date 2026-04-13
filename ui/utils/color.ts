export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const normalizeHex = (hex: string) => {
  const stripped = hex.trim().replace('#', '')
  if (stripped.length === 3) {
    const [r, g, b] = stripped.split('')
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return `#${stripped.slice(0, 6).padEnd(6, '0')}`.toUpperCase()
}

export const hexToRgb = (hex: string) => {
  const normalized = normalizeHex(hex).replace('#', '')
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

export const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map(value => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`

export const rgbToHsv = (r: number, g: number, b: number) => {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }

  const s = max === 0 ? 0 : delta / max
  return { h, s, v: max }
}

export const hsvToRgb = (h: number, s: number, v: number) => {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let rn = 0
  let gn = 0
  let bn = 0

  if (h >= 0 && h < 60) {
    rn = c
    gn = x
  } else if (h < 120) {
    rn = x
    gn = c
  } else if (h < 180) {
    gn = c
    bn = x
  } else if (h < 240) {
    gn = x
    bn = c
  } else if (h < 300) {
    rn = x
    bn = c
  } else {
    rn = c
    bn = x
  }

  return {
    r: (rn + m) * 255,
    g: (gn + m) * 255,
    b: (bn + m) * 255,
  }
}

export const mixWithWhite = (hex: string, ratio: number) => {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(
    r + (255 - r) * ratio,
    g + (255 - g) * ratio,
    b + (255 - b) * ratio
  )
}

export const mixWithBlack = (hex: string, ratio: number) => {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(r * (1 - ratio), g * (1 - ratio), b * (1 - ratio))
}
