<template>
  <div class="tab-content">
    <div class="preset-grid">
      <div
        v-for="(gradient, index) in presetGradients"
        :key="index"
        class="preset-item"
        :style="{ background: gradient.css }"
        @click="applyGradient(gradient)"
        :title="gradient.name"
      >
        <span class="preset-name">{{ gradient.name }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { presetGradients } from '../constants/preset-gradients'
import { usePresetGradients } from '../composables/usePresetGradients'

const { applyGradient } = usePresetGradients()
</script>
