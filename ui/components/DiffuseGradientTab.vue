<template>
  <section class="mesh-gradient-tab">
    <div class="mesh-gradient-preview-shell">
      <div class="mesh-gradient-preview" :style="previewStyle"></div>
    </div>

    <div class="mesh-gradient-swatches">
      <div v-for="(color, index) in palette" :key="index" class="mesh-gradient-swatch-item">
        <label
          class="mesh-gradient-swatch"
          :class="{ active: selectedSwatchIndex === index }"
          :style="{ backgroundColor: color }"
        >
          <input
            class="mesh-gradient-swatch-input"
            type="color"
            :value="color"
            @click="selectSwatch(index)"
            @change="handleSwatchColorInput(index, $event)"
          />
        </label>
        <button
          class="mesh-gradient-swatch-remove"
          type="button"
          title="删除颜色"
          @click.stop="handleRemoveSwatch(index)"
        >
          ×
        </button>
      </div>
      <button class="mesh-gradient-swatch mesh-gradient-swatch-add" type="button" @click="handleAddSwatch">
        新增
      </button>
    </div>

    <div class="mesh-gradient-controls">
      <div class="mesh-gradient-control">
        <div class="mesh-gradient-control-row">
          <span class="mesh-gradient-control-label">扩散</span>
          <input
            class="mesh-gradient-slider"
            type="range"
            min="10"
            max="80"
            step="1"
            :value="selectedPoint?.radius ?? 0"
            @input="handlePointChange('radius', $event)"
          />
          <span class="mesh-gradient-control-value">{{ Math.round(selectedPoint?.radius ?? 0) }}%</span>
        </div>
      </div>

      <div class="mesh-gradient-control">
        <div class="mesh-gradient-control-row">
          <span class="mesh-gradient-control-label">模糊</span>
          <input
            class="mesh-gradient-slider"
            type="range"
            min="10"
            max="100"
            step="1"
            :value="Math.round((selectedPoint?.blur ?? 0) * 100)"
            @input="handlePointChange('blur', $event, 100)"
          />
          <span class="mesh-gradient-control-value">{{ Math.round((selectedPoint?.blur ?? 0) * 100) }}%</span>
        </div>
      </div>

      <div class="mesh-gradient-control">
        <div class="mesh-gradient-control-row">
          <span class="mesh-gradient-control-label">透明度</span>
          <input
            class="mesh-gradient-slider"
            type="range"
            min="10"
            max="100"
            step="1"
            :value="Math.round((selectedPoint?.opacity ?? 0) * 100)"
            @input="handlePointChange('opacity', $event, 100)"
          />
          <span class="mesh-gradient-control-value">{{ Math.round((selectedPoint?.opacity ?? 0) * 100) }}%</span>
        </div>
      </div>

      <div class="mesh-gradient-control">
        <div class="mesh-gradient-control-row">
          <span class="mesh-gradient-control-label">噪点</span>
          <input
            class="mesh-gradient-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="Math.round(noiseAmount)"
            @input="handleNoiseChange($event)"
          />
          <span class="mesh-gradient-control-value">{{ Math.round(noiseAmount) }}%</span>
        </div>
      </div>

      <div class="mesh-gradient-control">
        <div class="mesh-gradient-control-row">
          <span class="mesh-gradient-control-label">横向</span>
          <input
            class="mesh-gradient-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="selectedPoint?.x ?? 0"
            @input="handlePointChange('x', $event)"
          />
          <span class="mesh-gradient-control-value">{{ Math.round(selectedPoint?.x ?? 0) }}%</span>
        </div>
      </div>

      <div class="mesh-gradient-control">
        <div class="mesh-gradient-control-row">
          <span class="mesh-gradient-control-label">纵向</span>
          <input
            class="mesh-gradient-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="selectedPoint?.y ?? 0"
            @input="handlePointChange('y', $event)"
          />
          <span class="mesh-gradient-control-value">{{ Math.round(selectedPoint?.y ?? 0) }}%</span>
        </div>
      </div>
    </div>

    <div class="mesh-gradient-actions">
      <div class="mesh-gradient-action-group">
        <button class="mesh-gradient-action mesh-gradient-action-light" type="button" @click="applyToSelection">
          应用
        </button>
        <button class="mesh-gradient-action mesh-gradient-action-dark" type="button" @click="randomize">
          随机生成
        </button>
      </div>
    </div>

    <div class="mesh-gradient-status">{{ statusText }}</div>
  </section>
</template>

<script lang="ts" setup>
import { useMeshGradient } from '../composables/useMeshGradient'

const {
  addSwatch,
  applyToSelection,
  palette,
  previewStyle,
  noiseAmount,
  selectedSwatchPoint,
  randomize,
  removeSwatch,
  selectSwatch,
  selectedSwatchIndex,
  updateSwatchColor,
  updateSelectedPoint,
  updateNoiseAmount,
  statusText,
} = useMeshGradient()

const handleAddSwatch = () => {
  addSwatch()
}

const handleRemoveSwatch = (index: number) => {
  removeSwatch(index)
}

const handleSwatchColorInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  updateSwatchColor(index, target.value)
}

const selectedPoint = selectedSwatchPoint

const handlePointChange = (
  key: 'x' | 'y' | 'radius' | 'opacity' | 'blur',
  event: Event,
  scale = 1
) => {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  updateSelectedPoint(key, Number(target.value) / scale)
}

const handleNoiseChange = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  updateNoiseAmount(Number(target.value))
}
</script>

<style scoped src="./styles/diffuse-gradient-tab.css"></style>
