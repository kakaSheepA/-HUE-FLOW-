import { UIMessage, sendMsgToUI } from '@messages/sender'
import { PluginMessage } from '@messages/contracts'
import { createSuperPaletteRuntime } from './superPaletteRuntime'
import { rgbaToHsb, hsbToRgba, HSB, RGBA } from './colorUtils'

mg.showUI(__html__, { width: 450, height: 600 })

const superPaletteRuntime = createSuperPaletteRuntime()

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const hexToRgb = (hex: string) => {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  }
}

const solidPaintWithAlpha = (hex: string, alpha = 1): SolidPaint => {
  const rgb = hexToRgb(hex)
  return {
    type: 'SOLID',
    color: {
      r: rgb.r / 255,
      g: rgb.g / 255,
      b: rgb.b / 255,
      a: alpha,
    },
    alpha: 1,
    isVisible: true,
    blendMode: 'NORMAL',
  } as SolidPaint
}

const createLinearGradientTransform = (angleDeg: number): Transform => {
  // 以 0deg 为内部基准旋转，统一换算到中心点周围的线性渐变矩阵。
  const radians = (angleDeg * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  return [
    [cos, sin, 0.5 - 0.5 * cos - 0.5 * sin],
    [-sin, cos, 0.5 + 0.5 * sin - 0.5 * cos],
  ]
}

interface OriginalColor {
  nodeId: string;
  fills?: readonly Paint[];
}

let originalColors: OriginalColor[] = []

function getAllNodes(nodes: readonly SceneNode[]): SceneNode[] {
  const allNodes: SceneNode[] = []
  function traverse(node: SceneNode) {
    allNodes.push(node)
    if ('children' in node) {
      // @ts-ignore
      for (const child of node.children) {
        traverse(child)
      }
    }
  }
  for (const node of nodes) {
    traverse(node)
  }
  return allNodes
}

function updateOriginalColors() {
  const selectedNodes = mg.document.currentPage.selection
  const allNodesToProcess = getAllNodes(selectedNodes)

  if (allNodesToProcess.length === 0) {
    originalColors = []
    return
  }

  originalColors = allNodesToProcess.map((node: any) => {
    const data: OriginalColor = { nodeId: node.id }
    if ('fills' in node && Array.isArray(node.fills)) {
      // 直接引用，不再深拷贝，以保留 ImagePaint 的活性
      data.fills = node.fills
    }
    return data
  }).filter(d => d.fills) // 只保留有填充属性的节点
}

function applySolidColorToSelection(hex: string, alpha = 1) {
  const selectedNodes = mg.document.currentPage.selection
  const allNodesToProcess = getAllNodes(selectedNodes)
  let changedCount = 0

  allNodesToProcess.forEach((node) => {
    if (!node || node.removed || node.isLocked) return

    if ('fills' in node && Array.isArray(node.fills)) {
      // @ts-ignore
      node.fills = [solidPaintWithAlpha(hex, alpha)]
      changedCount += 1
    }
  })

  updateOriginalColors()
  return {
    selectedCount: selectedNodes.length,
    nodeCount: allNodesToProcess.length,
    changedCount,
  }
}

const hexToRgba = (hex: string, alpha = 1): RGBA => ({
  r: Number.parseInt(hex.slice(1, 3), 16) / 255,
  g: Number.parseInt(hex.slice(3, 5), 16) / 255,
  b: Number.parseInt(hex.slice(5, 7), 16) / 255,
  a: alpha,
})

async function applyDiffuseGradientToSelection(backgroundColor: string, stops: Array<{
  color: string
  x: number
  y: number
  radius: number
  opacity: number
}>) {
  const selectedNodes = mg.document.currentPage.selection
  if (!selectedNodes.length) {
    return {
      selectedCount: 0,
      nodeCount: 0,
      changedCount: 0,
    }
  }

  const allNodesToProcess = getAllNodes(selectedNodes)
  let changedCount = 0

  const backgroundFill: Paint = {
    type: 'SOLID',
    color: hexToRgba(backgroundColor, 1),
  }

  const gradientFills: Paint[] = stops.map(stop => {
    const baseColor = hexToRgba(stop.color, clamp(stop.opacity, 0.1, 1))
    const scale = clamp(stop.radius / 40 + 0.4, 0.35, 3)
    const transform: Transform = [
      [scale, 0, stop.x - scale / 2],
      [0, scale, stop.y - scale / 2],
    ]

    return {
      type: 'GRADIENT_RADIAL',
      transform,
      gradientStops: [
        { color: baseColor, position: 0 },
        { color: { ...baseColor, a: 0 }, position: 1 },
      ],
    } as GradientPaint
  })

  allNodesToProcess.forEach((node) => {
    if (!node || node.removed || node.isLocked) return

    if ('fills' in node && Array.isArray(node.fills)) {
      // @ts-ignore
      node.fills = [backgroundFill, ...gradientFills]
      changedCount += 1
    }
  })

  updateOriginalColors()
  return {
    selectedCount: selectedNodes.length,
    nodeCount: allNodesToProcess.length,
    changedCount,
  }
}

// 记录上一次的选择 ID 列表，用于判断是否是真正的选择变更
let lastSelectionIds = ''
function checkSelectionChange() {
  const currentIds = mg.document.currentPage.selection.map((n: any) => n.id).join(',')
  if (currentIds !== lastSelectionIds) {
    lastSelectionIds = currentIds
    updateOriginalColors()
  }
}

// 初始化
checkSelectionChange()
mg.on('selectionchange', () => {
  checkSelectionChange()
})

mg.on('themechange', () => {
  void superPaletteRuntime.handleThemeChange()
})

mg.ui.onmessage = async (msg: { type: UIMessage, data: any }) => {
  const incoming = (msg as { pluginMessage?: { type: UIMessage, data?: any } }).pluginMessage ?? msg
  const { type, data } = incoming

  if (type === UIMessage.READY || type === UIMessage.APPLY_PALETTE) {
    void superPaletteRuntime.handleMessage(incoming)
    return
  }

  if (type === UIMessage.ADJUST_COLOR) {
    const { h, s, b, targetFills } = data as { 
      h: number, 
      s: number, 
      b: number,
      targetFills: boolean,
    }

    originalColors.forEach(original => {
      const node = mg.getNodeById(original.nodeId) as SceneNode
      if (!node || node.removed || node.isLocked) return

      if (targetFills && original.fills && 'fills' in node) {
        // @ts-ignore
        node.fills = adjustPaints(original.fills, h, s, b)
      } else if (!targetFills && 'fills' in node && original.fills) {
        // 如果取消勾选填充，恢复原始填充
        // @ts-ignore
        node.fills = original.fills
      }
    })
  }

  if (type === UIMessage.APPLY_GRADIENT) {
    const { colors } = data as { colors: string[] }
    
    const gradientColors: RGBA[] = colors.map(hex => {
      return {
        r: parseInt(hex.slice(1, 3), 16) / 255,
        g: parseInt(hex.slice(3, 5), 16) / 255,
        b: parseInt(hex.slice(5, 7), 16) / 255,
        a: 1
      }
    })

    const gradientStops = gradientColors.map((color, index) => ({
      color,
      position: index / (gradientColors.length - 1)
    }))

    const gradientFill: Paint = {
      type: 'GRADIENT_LINEAR',
      transform: createLinearGradientTransform(106 - 180),
      gradientStops
    }

    mg.document.currentPage.selection.forEach(node => {
      if (!node || node.removed || node.isLocked || !('fills' in node)) return
      // @ts-ignore
      node.fills = [gradientFill]
    })
  }

  if (type === UIMessage.APPLY_DIFFUSE_GRADIENT) {
    const { backgroundColor, stops } = data as {
      backgroundColor: string
      stops: Array<{
        color: string
        x: number
        y: number
        radius: number
        opacity: number
      }>
    }
    const result = await applyDiffuseGradientToSelection(backgroundColor, stops)
    sendMsgToUI({
      type: PluginMessage.APPLY_SUCCESS,
      data: {
        ...result,
      },
    })
  }

    if (type === 'ui:apply-swatch-color' || type === UIMessage.APPLY_SWATCH_COLOR) {
      const { hex, alpha } = data as { hex: string; alpha?: number }
      const result = applySolidColorToSelection(hex, alpha ?? 1)
      sendMsgToUI({
        type: PluginMessage.SWATCH_COLOR_APPLIED,
        data: {
          hex,
          alpha: alpha ?? 1,
          ...result,
        },
      })
  }
}

function adjustPaints(paints: readonly Paint[], dh: number, ds: number, db: number): Paint[] {
  return (paints as Paint[]).map((paint: Paint) => {
    if (paint.type === 'SOLID') {
      const hsb = rgbaToHsb(paint.color as RGBA)
      let newH = (hsb.h + dh) % 360
      if (newH < 0) newH += 360
      const newS = Math.max(0, Math.min(100, hsb.s + ds))
      const newB = Math.max(0, Math.min(100, hsb.b + db))
      const newRgba = hsbToRgba({ h: newH, s: newS, b: newB }, (paint.color as RGBA).a)
      return { ...paint, color: newRgba }
    } else if (paint.type.startsWith('GRADIENT')) {
      const newGradientStops = (paint as GradientPaint).gradientStops.map(stop => {
        const hsb = rgbaToHsb(stop.color as RGBA)
        let newH = (hsb.h + dh) % 360
        if (newH < 0) newH += 360
        const newS = Math.max(0, Math.min(100, hsb.s + ds))
        const newB = Math.max(0, Math.min(100, hsb.b + db))
        const newRgba = hsbToRgba({ h: newH, s: newS, b: newB }, (stop.color as RGBA).a)
        return { ...stop, color: newRgba }
      })
      return { ...paint, gradientStops: newGradientStops }
    }
    // 对于 IMAGE 和其他类型，直接返回原始 paint 对象
    return paint
  })
}
