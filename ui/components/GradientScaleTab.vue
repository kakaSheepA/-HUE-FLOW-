<template>
  <section class="gradient-scale-tab">
    <div class="gradient-scale-body">
      <aside class="family-list" aria-label="色系列表">
        <button
          v-for="family in gradientScaleFamilies"
          :key="family.label"
          class="family-item"
          :class="{ active: activePanel === 'scale' && family.label === activeFamily.label }"
          type="button"
          @click="selectFamily(family)"
        >
          <span class="family-swatch" :style="{ background: family.seedHex }"></span>
          <span class="family-name">{{ family.label }}</span>
        </button>
        <button
          class="family-item family-item-gradient"
          :class="{ active: activePanel === 'gradient' }"
          type="button"
          @click="selectGradientPanel"
        >
          <span class="family-swatch family-swatch-gradient"></span>
          <span class="family-name">渐变</span>
        </button>
      </aside>

      <section class="gradient-list-wrap">
        <div
          v-if="activePanel === 'scale'"
          class="gradient-list"
          :style="{ gridTemplateRows: `repeat(${activeEntries.length}, minmax(0, 1fr))` }"
        >
          <button
            v-for="(swatch, index) in activeEntries"
            :key="`${activeFamily.label}-${index}`"
            class="gradient-item"
            type="button"
            :style="{ background: swatch.hex, color: getTextColor(swatch.hex) }"
            :class="{ copied: copiedKey === `${activeFamily.label}-${index}` }"
            @click="handleSwatchClick(activeFamily.label, index, swatch)"
          >
            <span class="gradient-tone">{{ swatch.toneLabel }}</span>
            <span class="gradient-hex">
              <template v-if="copiedKey === `${activeFamily.label}-${index}`">
                已复制
              </template>
              <template v-else-if="swatch.displayTail">
                <span class="gradient-hex-main">{{ swatch.displayHex ?? swatch.hex }}</span>
                <span class="gradient-hex-tail">{{ swatch.displayTail }}</span>
              </template>
              <template v-else>
                {{ swatch.displayHex ?? swatch.hex }}
              </template>
            </span>
          </button>
        </div>

        <div v-else class="gradient-list gradient-list-gradient">
          <button
            v-for="gradient in gradientPresets"
            :key="gradient.name"
            class="gradient-item gradient-item-gradient"
            type="button"
            :style="{ background: gradient.css, color: getTextColor(gradient.rightHex) }"
            @click="handleGradientClick(gradient)"
          >
            <span class="gradient-tone">{{ gradient.name }}</span>
            <span class="gradient-hex">{{ gradient.leftHex }} → {{ gradient.rightHex }}</span>
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { sendMsgToPlugin, UIMessage } from '@messages/sender'
import { gradientScaleFamilies, type GradientScaleEntry } from '../constants/gradient-scale-data'
import { copyText } from '../utils/clipboard'

const activeFamily = ref(gradientScaleFamilies[0])
const activePanel = ref<'scale' | 'gradient'>('scale')
const activeEntries = computed(() => activeFamily.value.entries)
const copiedKey = ref<string | null>(null)
let copiedTimer: number | null = null

const gradientPresets = [
  { name: '渐变橙', leftHex: '#FF7C3C', rightHex: '#FF5E1A', css: 'linear-gradient(106deg, #FF7C3C 0%, #FF5E1A 100%)', colors: ['#FF7C3C', '#FF5E1A'] },
  { name: '渐变橘黄', leftHex: '#FFA425', rightHex: '#FF8800', css: 'linear-gradient(106deg, #FFA425 0%, #FF8800 100%)', colors: ['#FFA425', '#FF8800'] },
  { name: '渐变黄', leftHex: '#FFD420', rightHex: '#FFC300', css: 'linear-gradient(106deg, #FFD420 0%, #FFC300 100%)', colors: ['#FFD420', '#FFC300'] },
  { name: '渐变绿', leftHex: '#1CCE72', rightHex: '#00B365', css: 'linear-gradient(106deg, #1CCE72 0%, #00B365 100%)', colors: ['#1CCE72', '#00B365'] },
  { name: '渐变青', leftHex: '#21D3C9', rightHex: '#00B8B1', css: 'linear-gradient(106deg, #21D3C9 0%, #00B8B1 100%)', colors: ['#21D3C9', '#00B8B1'] },
  { name: '渐变浅蓝', leftHex: '#30BBFF', rightHex: '#0FA4FA', css: 'linear-gradient(106deg, #30BBFF 0%, #0FA4FA 100%)', colors: ['#30BBFF', '#0FA4FA'] },
  { name: '渐变蓝', leftHex: '#2A8EFE', rightHex: '#0A70F5', css: 'linear-gradient(106deg, #2A8EFE 0%, #0A70F5 100%)', colors: ['#2A8EFE', '#0A70F5'] },
  { name: '渐变蓝紫', leftHex: '#6A7BFD', rightHex: '#5664FF', css: 'linear-gradient(106deg, #6A7BFD 0%, #5664FF 100%)', colors: ['#6A7BFD', '#5664FF'] },
  { name: '渐变紫', leftHex: '#A358F7', rightHex: '#8E3DEB', css: 'linear-gradient(106deg, #A358F7 0%, #8E3DEB 100%)', colors: ['#A358F7', '#8E3DEB'] },
  { name: '渐变粉', leftHex: '#FB4EAA', rightHex: '#F03096', css: 'linear-gradient(106deg, #FB4EAA 0%, #F03096 100%)', colors: ['#FB4EAA', '#F03096'] },
  { name: '渐变红', leftHex: '#FE6557', rightHex: '#F5483B', css: 'linear-gradient(106deg, #FE6557 0%, #F5483B 100%)', colors: ['#FE6557', '#F5483B'] },
]

const getTextColor = (hex: string) => {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luminance >= 0.58 ? '#111111' : '#FFFFFF'
}

const selectFamily = (family: typeof gradientScaleFamilies[number]) => {
  activePanel.value = 'scale'
  activeFamily.value = family
  copiedKey.value = null
}

const selectGradientPanel = () => {
  activePanel.value = 'gradient'
  copiedKey.value = null
}

const replaceSelectionColor = (hex: string, alpha = 1) => {
  sendMsgToPlugin({
    type: UIMessage.APPLY_SWATCH_COLOR,
    data: { hex, alpha },
  })
}

const handleSwatchClick = async (familyLabel: string, index: number, swatch: GradientScaleEntry) => {
  const key = `${familyLabel}-${index}`
  replaceSelectionColor(swatch.alpha !== undefined ? '#000000' : swatch.hex, swatch.alpha ?? 1)
  copiedKey.value = key
  if (copiedTimer !== null) {
    window.clearTimeout(copiedTimer)
  }
  copiedTimer = window.setTimeout(() => {
    if (copiedKey.value === key) {
      copiedKey.value = null
    }
    copiedTimer = null
  }, 2000)
  try {
    await copyText(swatch.copyText ?? swatch.displayHex ?? swatch.hex)
  } catch {
    // 忽略剪贴板失败，颜色应用不能被复制流程阻塞
  }
}

const handleGradientClick = (gradient: { colors: string[] }) => {
  sendMsgToPlugin({
    type: UIMessage.APPLY_GRADIENT,
    data: {
      colors: gradient.colors,
    },
  })
}

onBeforeUnmount(() => {
  if (copiedTimer !== null) {
    window.clearTimeout(copiedTimer)
    copiedTimer = null
  }
})
</script>

<style scoped src="./styles/gradient-scale-tab.css"></style>
