<template>
  <div class="super-palette-tab">
    <div ref="mountEl" class="super-palette-root"></div>
  </div>
</template>

<script lang="ts" setup>
import { createApp, onBeforeUnmount, onMounted, ref } from 'vue'
import SuperPaletteApp from '../../../../混合/超级调色板/ui/App.vue'

const mountEl = ref<HTMLElement | null>(null)
let paletteApp: ReturnType<typeof createApp> | null = null

onMounted(() => {
  if (!mountEl.value) {
    return
  }

  try {
    paletteApp = createApp(SuperPaletteApp)
    paletteApp.mount(mountEl.value)
  } catch {
  }
})

onBeforeUnmount(() => {
  paletteApp?.unmount()
  paletteApp = null
})
</script>

<style scoped>
.super-palette-tab {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
  overflow: visible;
}

.super-palette-root {
  flex: 1 1 auto;
  min-height: 0;
}

:deep(.workspace) {
  height: 100% !important;
  min-height: 0 !important;
  padding: 0 !important;
}

:deep(.shell) {
  height: 100% !important;
  min-height: 0 !important;
}

:deep(.center-pane),
:deep(.center-scroll),
:deep(.center-footer),
:deep(.right-pane) {
  min-height: 0 !important;
}

:deep(.center-scroll) {
  overflow-y: auto !important;
}

:deep(.center-pane) {
  overflow: hidden !important;
}

:deep(.right-pane) {
  overflow: visible !important;
}
</style>
