<template>
  <div class="tab-content">
    <div class="tip">可以把不想改动颜色的图层锁定</div>
    <div class="filter-group">
      <label class="checkbox-label">
        <input type="checkbox" v-model="targetFills" @change="onAdjust" /> 填充 (Fills)
      </label>
      <label class="checkbox-label">
        <input type="checkbox" v-model="targetStrokes" @change="onAdjust" /> 描边 (Strokes)
      </label>
    </div>
    <div class="item">
      <div class="label">色相 (Hue)</div>
      <div class="control">
        <input class="slider hue-slider" type="range" v-model.number="h" min="-180" max="180" @input="onAdjust" />
        <input class="input" type="number" v-model.number="h" @blur="onAdjust" />
      </div>
    </div>
    <div class="item">
      <div class="label">饱和度 (Saturation)</div>
      <div class="control">
        <input class="slider saturation-slider" type="range" v-model.number="s" min="-100" max="100" @input="onAdjust" />
        <input class="input" type="number" v-model.number="s" @blur="onAdjust" />
      </div>
    </div>
    <div class="item">
      <div class="label">亮度 (Brightness)</div>
      <div class="control">
        <input class="slider brightness-slider" type="range" v-model.number="b" min="-100" max="100" @input="onAdjust" />
        <input class="input" type="number" v-model.number="b" @blur="onAdjust" />
      </div>
    </div>
    <div class="footer">
      <button class="btn" @click="reset">重置</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useColorAdjust } from '../composables/useColorAdjust'

const { b, h, onAdjust, reset, s, targetFills, targetStrokes } = useColorAdjust()
</script>
