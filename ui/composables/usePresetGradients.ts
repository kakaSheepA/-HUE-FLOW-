import { sendMsgToPlugin, UIMessage } from '@messages/sender'
import type { PresetGradient } from '../constants/preset-gradients'

export function usePresetGradients() {
  const applyGradient = (gradient: PresetGradient) => {
    sendMsgToPlugin({
      type: UIMessage.APPLY_GRADIENT,
      data: {
        colors: gradient.colors,
      },
    })
  }

  return {
    applyGradient,
  }
}
