import { ref } from 'vue'
import { sendMsgToPlugin, UIMessage } from '@messages/sender'

export function useColorAdjust() {
  const h = ref(0)
  const s = ref(0)
  const b = ref(0)
  const targetFills = ref(true)
  const targetStrokes = ref(true)

  const onAdjust = () => {
    h.value = Math.max(-180, Math.min(180, h.value))
    s.value = Math.max(-100, Math.min(100, s.value))
    b.value = Math.max(-100, Math.min(100, b.value))

    sendMsgToPlugin({
      type: UIMessage.ADJUST_COLOR,
      data: {
        h: h.value,
        s: s.value,
        b: b.value,
        targetFills: targetFills.value,
        targetStrokes: targetStrokes.value,
      },
    })
  }

  const reset = () => {
    h.value = 0
    s.value = 0
    b.value = 0
    targetFills.value = true
    targetStrokes.value = true
    onAdjust()
  }

  return {
    b,
    h,
    onAdjust,
    reset,
    s,
    targetFills,
    targetStrokes,
  }
}
