import {
  defaultPaletteSettings,
  PluginMessage,
  UIMessage,
  toneSteps,
  type InitialPayload,
  type PaletteApplyResult,
  type PaletteExportSwatch,
  type PaletteSettings,
  type PaletteSwatch,
} from '@messages/contracts'
import { sendMsgToUI } from '@messages/sender'
import { generatePalette, hexToRgb, sanitizeHex } from './palette'

const STORAGE_KEY = 'supa-palette-settings-v1'

let cachedFont: FontName | null = null

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const solidPaint = (hex: string, alpha = 1): SolidPaint => {
  const rgb = hexToRgb(hex)
  return {
    type: 'SOLID',
    color: {
      r: rgb.r / 255,
      g: rgb.g / 255,
      b: rgb.b / 255,
      a: alpha,
    },
    alpha,
    isVisible: true,
    blendMode: 'NORMAL',
  }
}

const gradientPaintStops = (hexes: string[]) => {
  const lastIndex = Math.max(hexes.length - 1, 1)
  return hexes.map((hex, index) => {
    const rgb = hexToRgb(hex)
    return {
      position: index / lastIndex,
      color: {
        r: rgb.r / 255,
        g: rgb.g / 255,
        b: rgb.b / 255,
        a: 1,
      },
    }
  })
}

const gradientPaint = (
  type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR',
  hexes: string[]
) => {
  const transforms: Record<typeof type, Transform> = {
    GRADIENT_LINEAR: [
      [1, 0, 0],
      [0, 1, 0],
    ],
    GRADIENT_RADIAL: [
      [1, 0, 0],
      [0, 1, 0],
    ],
    GRADIENT_ANGULAR: [
      [1, 0, 0],
      [0, 1, 0],
    ],
  }

  return {
    type,
    transform: transforms[type],
    gradientStops: gradientPaintStops(hexes),
    opacity: 1,
    blendMode: 'NORMAL',
    isVisible: true,
  } as GradientPaint
}

const paintForExportSwatch = (swatch: PaletteExportSwatch) => {
  if (swatch.variant === 'tone' && swatch.hex) {
    return solidPaint(swatch.hex)
  }

  if (swatch.gradientStops) {
    const gradientType =
      swatch.variant === 'linear'
        ? 'GRADIENT_LINEAR'
        : swatch.variant === 'radial'
          ? 'GRADIENT_RADIAL'
          : 'GRADIENT_ANGULAR'
    return gradientPaint(gradientType, swatch.gradientStops)
  }

  return solidPaint('#FFFFFF')
}

const isExportSwatch = (
  swatch: PaletteSwatch | PaletteExportSwatch
): swatch is PaletteExportSwatch => 'variant' in swatch

const getTheme = () => (mg.themeColor === 'light' ? 'light' : 'dark')

const normalizeAnchorTone = (value?: number) => {
  const target = value ?? defaultPaletteSettings.anchorTone
  return toneSteps.reduce(
    (closest, tone) =>
      Math.abs(tone - target) < Math.abs(closest - target) ? tone : closest,
    toneSteps[0]
  )
}

const normalizeEasingMode = (value?: string): PaletteSettings['easingMode'] => {
  switch (value) {
    case 'linear':
    case 'quad':
    case 'cubic':
    case 'quart':
    case 'quint':
    case 'sine':
    case 'expo':
    case 'circ':
    case 'arc':
      return value
    case 'ease-out':
      return 'quart'
    case 'ease-in':
      return 'cubic'
    case 'smooth':
      return 'sine'
    default:
      return defaultPaletteSettings.easingMode
  }
}

const normalizeScaleComputationMode = (
  value?: string
): PaletteSettings['scaleComputationMode'] => {
  switch (value) {
    case 'default':
    case 'arco':
    case 'tailwind-css':
    case 'radix-ui':
    case 'ant-design':
    case 'lightness-scale':
    case 'saturation-scale':
    case 'hue-shift-scale':
    case 'monochromatic':
    case 'analogous':
    case 'complementary':
      return value
    default:
      return defaultPaletteSettings.scaleComputationMode
  }
}

const normalizeSettings = (input?: Partial<PaletteSettings>): PaletteSettings => ({
  ...defaultPaletteSettings,
  ...input,
  seedHex: sanitizeHex(input?.seedHex ?? defaultPaletteSettings.seedHex),
  anchorTone: normalizeAnchorTone(input?.anchorTone),
  paddingStart: clamp(input?.paddingStart ?? defaultPaletteSettings.paddingStart, 0, 50),
  paddingEnd: clamp(input?.paddingEnd ?? defaultPaletteSettings.paddingEnd, 0, 50),
  guideStyle: input?.guideStyle === 'circles' ? 'circles' : defaultPaletteSettings.guideStyle,
  insertMode: defaultPaletteSettings.insertMode,
  stylePrefix:
    (input?.stylePrefix || defaultPaletteSettings.stylePrefix).trim() ||
    defaultPaletteSettings.stylePrefix,
  scaleComputationMode: normalizeScaleComputationMode(
    input?.scaleComputationMode as string | undefined
  ),
  easingMode: normalizeEasingMode(input?.easingMode as string | undefined),
  stopCount: clamp(input?.stopCount ?? defaultPaletteSettings.stopCount, 2, 11),
})

const loadSettings = async () => {
  const saved = await mg.clientStorage.getAsync(STORAGE_KEY)
  return normalizeSettings({
    ...(saved || {}),
    easingMode: defaultPaletteSettings.easingMode,
  })
}

const ensureFontLoaded = async () => {
  if (cachedFont) {
    await mg.loadFontAsync(cachedFont)
    return cachedFont
  }

  const fonts = await mg.listAvailableFontsAsync()
  const preferred = fonts.find(
    (font) =>
      font.fontName.family.includes('Source Han Sans') &&
      font.fontName.style === 'Regular'
  )
  const fallback = preferred ?? fonts[0]

  if (!fallback) {
    throw new Error('当前 MasterGo 环境没有可用字体，无法创建文字图层。')
  }

  cachedFont = fallback.fontName
  await mg.loadFontAsync(cachedFont)
  return cachedFont
}

const makeText = async (
  characters: string,
  options: {
    name?: string
    fontSize?: number
    color?: string
    opacity?: number
  } = {}
) => {
  await ensureFontLoaded()
  const text = mg.createText()
  text.name = options.name ?? characters
  text.characters = characters
  text.fontSize = options.fontSize ?? 14
  text.fills = [solidPaint(options.color ?? '#121217', options.opacity ?? 1)]
  return text
}

const createAutoFrame = (name: string) => {
  const frame = mg.createFrame()
  frame.name = name
  frame.flexMode = 'VERTICAL'
  frame.mainAxisSizingMode = 'AUTO'
  frame.crossAxisSizingMode = 'FIXED'
  frame.width = 412
  frame.paddingTop = 24
  frame.paddingRight = 24
  frame.paddingBottom = 24
  frame.paddingLeft = 24
  frame.itemSpacing = 20
  frame.cornerRadius = 24
  return frame
}

const createCardFrame = (
  name: string,
  width: number,
  guideStyle: PaletteSettings['guideStyle']
) => {
  const frame = createAutoFrame(name)
  frame.width = width
  frame.paddingTop = guideStyle === 'tiles' ? 10 : 12
  frame.paddingRight = 12
  frame.paddingBottom = 12
  frame.paddingLeft = 12
  frame.itemSpacing = guideStyle === 'tiles' ? 12 : 10
  frame.cornerRadius = 18
  frame.fills = [solidPaint('#FFFFFF', 0.82)]
  frame.strokes = [solidPaint('#FFFFFF', 0.36)]
  frame.strokeWeight = 1
  return frame
}

const createSwatchShape = (
  guideStyle: PaletteSettings['guideStyle'],
  swatch: PaletteSwatch,
  layerName: string
) => {
  const circle = guideStyle === 'circles'
  const shape = circle ? mg.createEllipse() : mg.createRectangle()
  const contentWidth = 116

  shape.name = layerName
  shape.width = contentWidth
  shape.height = circle ? contentWidth : 56
  if (!circle) {
    shape.cornerRadius = 22
  }
  shape.fills = [solidPaint(swatch.hex)]
  return shape
}

const createExportSwatchShape = (
  guideStyle: PaletteSettings['guideStyle'],
  swatch: PaletteExportSwatch,
  layerName: string
) => {
  const circle =
    guideStyle === 'circles' || swatch.variant === 'radial' || swatch.variant === 'angular'
  const shape = circle ? mg.createEllipse() : mg.createRectangle()
  const contentWidth = 116

  shape.name = layerName
  shape.width = contentWidth
  shape.height = circle ? contentWidth : 56
  if (!circle) {
    shape.cornerRadius = 22
  }

  shape.fills = [paintForExportSwatch(swatch)]

  return shape
}

const createSwatchCard = async (
  swatch: PaletteSwatch | PaletteExportSwatch,
  settings: PaletteSettings,
  index: number
) => {
  const entryName = isExportSwatch(swatch)
    ? swatch.variant === 'tone'
      ? `${settings.stylePrefix}-${swatch.tone}`
      : `${settings.stylePrefix}-${swatch.variant}`
    : `${settings.stylePrefix}-${swatch.tone}`
  const card = createCardFrame(entryName, 140, settings.guideStyle)
  const shape = isExportSwatch(swatch)
    ? createExportSwatchShape(settings.guideStyle, swatch, entryName)
    : createSwatchShape(settings.guideStyle, swatch, entryName)

  const titleText = await makeText(entryName, {
    fontSize: 11,
    color: '#5A6172',
  })
  const secondaryLabel = isExportSwatch(swatch)
    ? (swatch.hex ?? swatch.title)
    : swatch.hex
  const hexText = await makeText(secondaryLabel, {
    fontSize: 13,
    color: '#101114',
  })
  const contrastLabel =
    isExportSwatch(swatch) && swatch.contrastOnBlack && swatch.contrastOnWhite
      ? `B ${swatch.contrastOnBlack.toFixed(2)} / W ${swatch.contrastOnWhite.toFixed(2)}`
      : isExportSwatch(swatch)
        ? '11 色阶混合'
        : `B ${swatch.contrastOnBlack.toFixed(2)} / W ${swatch.contrastOnWhite.toFixed(2)}`
  const contrastText = await makeText(contrastLabel, {
    fontSize: 10,
    color: '#6F7787',
  })

  card.appendChild(shape)
  card.appendChild(titleText)
  card.appendChild(hexText)
  card.appendChild(contrastText)

  return { card, sourceNode: shape }
}

const upsertPaintStyles = async (swatches: PaletteExportSwatch[]) => {
  const styles = new Map(mg.getLocalPaintStyles().map((style) => [style.name, style]))
  const tempNode = mg.createRectangle()
  tempNode.name = '__super_palette_style_seed__'
  tempNode.width = 1
  tempNode.height = 1
  tempNode.opacity = 0
  mg.document.currentPage.appendChild(tempNode)

  let createdOrUpdated = 0

  try {
    for (const swatch of swatches) {
      let style = styles.get(swatch.styleName)
      if (!style) {
        tempNode.fills = [paintForExportSwatch(swatch)]
        style = mg.createFillStyle({
          id: tempNode.id,
          name: swatch.styleName,
          description: 'Generated by 超级调色板',
        })
      }

      style.name = swatch.styleName
      style.description =
        swatch.variant === 'tone' && swatch.hex
          ? `由 ${swatch.hex} 生成`
          : `由 ${swatch.gradientStops?.length ?? 0} 个色阶混合生成`
      style.paints = [paintForExportSwatch(swatch)]
      createdOrUpdated += 1
    }
  } finally {
    tempNode.remove()
  }

  return createdOrUpdated
}

const insertPaletteFrame = async (settings: PaletteSettings) => {
  const preview = generatePalette(settings)
  const page = mg.document.currentPage
  const accent = preview.swatches[Math.min(2, preview.swatches.length - 1)] ?? preview.swatches[0]
  const root = createAutoFrame(`超级调色板 / ${settings.stylePrefix}`)
  const cardWidth = 140
  const gridSpacing = 12
  const columns = 7
  const gridWidth = columns * cardWidth + (columns - 1) * gridSpacing
  root.fills = [solidPaint(preview.swatches[0].hex)]
  root.strokes = [solidPaint(accent.hex, 0.5)]
  root.strokeWeight = 1
  root.width = gridWidth + 48
  root.crossAxisAlignItems = 'CENTER'
  root.x = mg.viewport.center.x - root.width / 2
  root.y = mg.viewport.center.y - 180

  const hero = createAutoFrame('Hero')
  hero.width = gridWidth
  hero.paddingTop = 18
  hero.paddingRight = 18
  hero.paddingBottom = 18
  hero.paddingLeft = 18
  hero.cornerRadius = 20
  hero.itemSpacing = 8
  hero.fills = [solidPaint('#111111', 0.95)]
  hero.strokes = [solidPaint('#FFFFFF', 0.08)]
  hero.strokeWeight = 1

  const eyebrow = await makeText('超级调色板', {
    fontSize: 11,
    color: accent.hex,
  })
  const title = await makeText(settings.stylePrefix || 'palette/brand', {
    fontSize: 20,
    color: '#FFFFFF',
  })
  const meta = await makeText(
    `${preview.swatches.length} 色阶 + 3 渐变 · ${settings.seedHex}`,
    {
      fontSize: 12,
      color: '#D4D6DB',
    }
  )

  hero.appendChild(eyebrow)
  hero.appendChild(title)
  hero.appendChild(meta)

  const grid = mg.createFrame()
  grid.name = 'Swatches'
  grid.flexMode = 'HORIZONTAL'
  grid.flexWrap = 'WRAP'
  grid.mainAxisSizingMode = 'FIXED'
  grid.width = gridWidth
  grid.crossAxisSizingMode = 'AUTO'
  grid.mainAxisAlignItems = 'FLEX_START'
  grid.crossAxisAlignItems = 'FLEX_START'
  grid.crossAxisAlignContent = 'AUTO'
  grid.itemSpacing = gridSpacing
  grid.crossAxisSpacing = gridSpacing
  grid.fills = []

  for (const [index, swatch] of preview.exportSwatches.entries()) {
    const { card } = await createSwatchCard(swatch, settings, index)
    grid.appendChild(card)
  }

  root.appendChild(hero)
  root.appendChild(grid)
  page.appendChild(root)
  root.resizeToFit()

  return {
    frameId: root.id,
    swatchCount: preview.exportSwatches.length,
  }
}

const applyPalette = async (input: PaletteSettings): Promise<PaletteApplyResult> => {
  const settings = normalizeSettings(input)
  const preview = generatePalette(settings)
  let frameId: string | undefined
  const toneCount = preview.swatches.length
  const exportCount = preview.exportSwatches.length
  let styleCount = 0

  const frameResult = await insertPaletteFrame(settings)
  frameId = frameResult.frameId
  styleCount = await upsertPaintStyles(preview.exportSwatches)

  mg.commitUndo()
  return {
    frameId,
    styleCount,
    swatchCount: exportCount,
    toneCount,
    exportCount,
  }
}

const sendInitialState = async () => {
  const payload: InitialPayload = {
    settings: await loadSettings(),
    theme: getTheme(),
  }

  sendMsgToUI({
    type: PluginMessage.INITIAL,
    data: payload,
  })
}

export const createSuperPaletteRuntime = () => {
  const handleMessage = async (msg: { type: UIMessage; data?: PaletteSettings }) => {
    if (msg.type === UIMessage.READY) {
      await sendInitialState()
      return
    }

    if (msg.type === UIMessage.APPLY_PALETTE && msg.data) {
      const settings = normalizeSettings(msg.data)
      await mg.clientStorage.setAsync(STORAGE_KEY, settings)
      const result = await applyPalette(settings)

      sendMsgToUI({
        type: PluginMessage.APPLY_SUCCESS,
        data: result,
      })
    }
  }

  const handleThemeChange = async () => {
    await sendInitialState()
  }

  return {
    handleMessage,
    handleThemeChange,
  }
}
