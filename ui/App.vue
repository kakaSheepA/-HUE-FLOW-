<template>
  <div class="container" :class="{ 'is-super': activeTab === 'SUPER' }">
    <div class="tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'ADJUST' }"
        @click="activeTab = 'ADJUST'"
      >
        色彩调节
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'SUPER' }"
        @click="activeTab = 'SUPER'"
      >
        超级调色板
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'GRADIENT' }"
        @click="activeTab = 'GRADIENT'"
      >
        梯度色阶
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'DIFFUSE' }"
        @click="activeTab = 'DIFFUSE'"
      >
        弥散渐变
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'PRESET' }"
        @click="activeTab = 'PRESET'"
      >
        预设渐变
      </button>
    </div>

    <ColorAdjustTab v-if="activeTab === 'ADJUST'" />

    <div v-if="activeTab === 'SUPER'" class="super-palette-host">
      <SuperPaletteTab />
    </div>

    <div v-if="activeTab === 'GRADIENT'" class="tab-content gradient-shell">
      <GradientScaleTab />
    </div>

    <div v-if="activeTab === 'DIFFUSE'" class="tab-content">
      <DiffuseGradientTab />
    </div>

    <PresetGradientsTab v-if="activeTab === 'PRESET'" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import ColorAdjustTab from './components/ColorAdjustTab.vue'
import DiffuseGradientTab from './components/DiffuseGradientTab.vue'
import GradientScaleTab from './components/GradientScaleTab.vue'
import SuperPaletteTab from './components/SuperPaletteTab.vue'
import PresetGradientsTab from './components/PresetGradientsTab.vue'

const activeTab = ref<'ADJUST' | 'DIFFUSE' | 'PRESET' | 'SUPER' | 'GRADIENT'>('SUPER')
</script>

<style src="./styles/app.css"></style>

<style scoped src="./styles/super-theme.css"></style>
