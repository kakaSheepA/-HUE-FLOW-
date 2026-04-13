import { computed, ref } from 'vue'
import { sendMsgToPlugin, UIMessage } from '@messages/sender'
import { clamp, hexToRgb, hsvToRgb, normalizeHex, rgbToHex, rgbToHsv } from '../utils/color'
import { meshGradientPresets, type MeshGradientPoint } from '../constants/mesh-gradient-presets'

const PREVIEW_WIDTH = 1200
const PREVIEW_HEIGHT = 760

const clonePoints = (points: MeshGradientPoint[]) => points.map(point => ({ ...point }))

const seededNoise = (index: number, channel: number, amount: number) => {
  const seed = Math.sin(
    (index + 1) * 12.9898 +
      (channel + 1) * 78.233 +
      amount * 0.3183099
  ) * 43758.5453
  return seed - Math.floor(seed)
}

const createNoisyPoint = (point: MeshGradientPoint, index: number, amount: number): MeshGradientPoint => {
  if (amount <= 0) return { ...point }

  const strength = amount / 100
  const xJitter = (seededNoise(index, 0, amount) * 2 - 1) * strength * 6
  const yJitter = (seededNoise(index, 1, amount) * 2 - 1) * strength * 6
  const radiusJitter = (seededNoise(index, 2, amount) * 2 - 1) * strength * 8
  const opacityJitter = (seededNoise(index, 3, amount) * 2 - 1) * strength * 0.08
  const blurJitter = (seededNoise(index, 4, amount) * 2 - 1) * strength * 0.06

  return {
    x: clamp(point.x + xJitter, 0, 100),
    y: clamp(point.y + yJitter, 0, 100),
    radius: clamp(point.radius + radiusJitter, 10, 80),
    opacity: clamp(point.opacity + opacityJitter, 0.1, 1),
    blur: clamp(point.blur + blurJitter, 0.1, 1),
  }
}

const buildSvg = (
  colors: string[],
  points: MeshGradientPoint[],
  background: string,
  width = PREVIEW_WIDTH,
  height = PREVIEW_HEIGHT
) => {
  const gradientDefs = points
    .map((point, index) => {
      const scale = clamp(point.radius / 40 + 0.4, 0.35, 3)
      const translateX = point.x / 100 - scale / 2
      const translateY = point.y / 100 - scale / 2
      const color = colors[index] ?? colors[0] ?? '#ff0000'
      const fill = normalizeHex(color)
      return `
        <radialGradient
          id="mesh-gradient-${index}"
          gradientUnits="objectBoundingBox"
          cx="0.5"
          cy="0.5"
          r="0.5"
          gradientTransform="matrix(${scale.toFixed(6)} 0 0 ${scale.toFixed(6)} ${translateX.toFixed(6)} ${translateY.toFixed(6)})"
        >
          <stop offset="0%" stop-color="${fill}" stop-opacity="${point.opacity.toFixed(3)}" />
          <stop offset="100%" stop-color="${fill}" stop-opacity="0" />
        </radialGradient>
      `
    })
    .join('')

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="none">
      <defs>
        ${gradientDefs}
      </defs>
      <rect width="100%" height="100%" fill="${normalizeHex(background)}" />
      ${points
        .map((_, index) => `<rect width="100%" height="100%" fill="url(#mesh-gradient-${index})" />`)
        .join('')}
    </svg>
  `.replace(/\s+/g, ' ').trim()
}

const randomBetween = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 10) / 10

const mixHue = (hex: string, offset: number) => {
  const { r, g, b } = hexToRgb(hex)
  const hsv = rgbToHsv(r, g, b)
  const rgb = hsvToRgb((hsv.h + offset + 360) % 360, hsv.s, hsv.v)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

const createHarmoniousColor = (
  baseHex: string,
  hueOffset: number,
  saturationShift: number,
  valueShift: number
) => {
  const { r, g, b } = hexToRgb(baseHex)
  const hsv = rgbToHsv(r, g, b)
  const nextHue = (hsv.h + hueOffset + 360) % 360
  const nextSaturation = clamp(hsv.s + saturationShift, 0.28, 0.92)
  const nextValue = clamp(hsv.v + valueShift, 0.42, 0.98)
  const rgb = hsvToRgb(nextHue, nextSaturation, nextValue)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

const createSwatchPoint = (index: number, total: number): MeshGradientPoint => {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2
  const offsetX = Math.cos(angle) * 18
  const offsetY = Math.sin(angle) * 18
  return {
    x: clamp(50 + offsetX, 10, 90),
    y: clamp(50 + offsetY, 10, 90),
    radius: clamp(38 - (index % 3) * 2, 28, 48),
    opacity: clamp(0.9 - (index % 4) * 0.02, 0.8, 0.98),
    blur: clamp(0.56 + (index % 3) * 0.02, 0.46, 0.68),
  }
}

export function useMeshGradient() {
  const activePresetIndex = ref(0)
  const palette = ref([...meshGradientPresets[0].palette])
  const points = ref(clonePoints(meshGradientPresets[0].points))
  const background = ref(meshGradientPresets[0].background)
  const noiseAmount = ref(0)
  const selectedSwatchIndex = ref(0)
  const statusText = ref('已选择颜色')

  const renderedPoints = computed(() =>
    points.value.map((point, index) => createNoisyPoint(point, index, noiseAmount.value))
  )

  const previewMarkup = computed(() => buildSvg(palette.value, renderedPoints.value, background.value))
  const previewDataUrl = computed(
    () => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(previewMarkup.value)}`
  )

  const previewStyle = computed(() => ({
    backgroundColor: background.value,
    backgroundImage: `url("${previewDataUrl.value}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }))

  const selectedSwatchPoint = computed(() => {
    return points.value[selectedSwatchIndex.value] ?? points.value[0] ?? null
  })

  const selectSwatch = (index: number) => {
    selectedSwatchIndex.value = index
  }

  const updateSwatchColor = (index: number, color: string) => {
    const normalizedColor = normalizeHex(color)
    if (!palette.value[index]) return
    palette.value = palette.value.map((item, itemIndex) =>
      itemIndex === index ? normalizedColor : item
    )
    selectedSwatchIndex.value = index
    statusText.value = '已更新颜色'
    void applyToSelection()
  }

  const updateSelectedPoint = (key: keyof MeshGradientPoint, value: number) => {
    const index = selectedSwatchIndex.value
    const point = points.value[index]
    if (!point) return

    const normalizedValue =
      key === 'opacity' || key === 'blur'
        ? clamp(value, 0.1, 1)
        : key === 'radius'
          ? clamp(value, 10, 80)
          : clamp(value, 0, 100)

    points.value = points.value.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [key]: normalizedValue } : item
    )
    statusText.value = '已更新滑块'
    void applyToSelection()
  }

  const updateNoiseAmount = (value: number) => {
    noiseAmount.value = clamp(value, 0, 100)
    statusText.value = `已调整噪点（${Math.round(noiseAmount.value)}%）`
    void applyToSelection()
  }

  const applyToSelection = async () => {
    statusText.value = '已应用到所选形状'

    sendMsgToPlugin({
      type: UIMessage.APPLY_DIFFUSE_GRADIENT,
      data: {
        backgroundColor: background.value,
        stops: renderedPoints.value.map((point, index) => ({
          color: palette.value[index] ?? palette.value[0] ?? '#FF1E5A',
          x: point.x / 100,
          y: point.y / 100,
          radius: point.radius,
          opacity: point.opacity,
        })),
      },
    })
  }

  const addSwatch = () => {
    const nextIndex = palette.value.length
    const sourceColor = palette.value[selectedSwatchIndex.value] ?? palette.value[0] ?? '#FF1E5A'
    const nextColor = mixHue(sourceColor, 24 + nextIndex * 7)
    palette.value = [...palette.value, nextColor]
    points.value = [...points.value, createSwatchPoint(nextIndex, nextIndex + 1)]
    selectedSwatchIndex.value = nextIndex
    statusText.value = '已新增一个颜色'
    void applyToSelection()
  }

  const removeSwatch = (index: number) => {
    if (palette.value.length <= 1) {
      statusText.value = '至少保留一个颜色'
      return false
    }

    const nextPalette = palette.value.filter((_, itemIndex) => itemIndex !== index)
    const nextPoints = points.value.filter((_, itemIndex) => itemIndex !== index)
    palette.value = nextPalette
    points.value = nextPoints

    if (selectedSwatchIndex.value > index) {
      selectedSwatchIndex.value -= 1
    } else if (selectedSwatchIndex.value === index) {
      selectedSwatchIndex.value = Math.min(index, nextPalette.length - 1)
    } else {
      selectedSwatchIndex.value = Math.min(selectedSwatchIndex.value, nextPalette.length - 1)
    }

    statusText.value = '已删除一个颜色'
    return true
  }

  const applyPreset = (index: number) => {
    const preset = meshGradientPresets[index]
    if (!preset) return
    activePresetIndex.value = index
    palette.value = [...preset.palette]
    points.value = clonePoints(preset.points)
    background.value = preset.background
    selectedSwatchIndex.value = 0
    statusText.value = `已切换到 ${preset.name}`
    void applyToSelection()
  }

  const randomize = () => {
    const baseColor = palette.value[selectedSwatchIndex.value] ?? palette.value[0] ?? '#5B86E5'
    const hueSpread = palette.value.length > 1 ? 18 : 0
    points.value = points.value.map((point, index) => ({
      ...point,
      x: clamp(randomBetween(8 + index * 4, 92 - index * 2), 8, 92),
      y: clamp(randomBetween(8 + index * 3, 92 - index * 2), 8, 92),
      radius: clamp(randomBetween(28, 52), 24, 58),
      opacity: clamp(randomBetween(0.82, 0.98), 0.72, 1),
      blur: clamp(randomBetween(0.48, 0.66), 0.42, 0.72),
    }))
    palette.value = palette.value.map((_, index) => {
      const centeredIndex = index - (palette.value.length - 1) / 2
      const hueOffset = centeredIndex * hueSpread + randomBetween(-4, 4)
      const saturationShift = randomBetween(-0.06, 0.08)
      const valueShift = randomBetween(-0.04, 0.06)
      return createHarmoniousColor(baseColor, hueOffset, saturationShift, valueShift)
    })
    statusText.value = '已随机生成新变体'
    void applyToSelection()
  }

  return {
    activePresetIndex,
    applyPreset,
    background,
    addSwatch,
    palette,
    points,
    noiseAmount,
    previewStyle,
    selectedSwatchPoint,
    applyToSelection,
    randomize,
    removeSwatch,
    selectSwatch,
    selectedSwatchIndex,
    updateSwatchColor,
    updateSelectedPoint,
    updateNoiseAmount,
    statusText,
  }
}
