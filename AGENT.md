# AGENT

## 项目背景

这是一个 MasterGo 插件工程，目标是实现名为 `色彩流动(HueFlow)` 的颜色编辑插件。

当前任务的整体背景：

- 这是“双插件外部记忆”工作的其中一侧，后续会与 `超级调色板` 保持同构的文档和工作流
- 当前工程重点仍是色彩调整、弥散渐变(mesh gradient)、预设渐变三块能力
- `App.vue` 只作为页面组合入口使用，后续新增功能和逻辑都要拆到独立模块文件，不再继续堆到 `App.vue`
- `App.vue` 目前已经是薄壳，新增能力优先拆到 `ui/components/*`、`ui/composables/*`、`ui/constants/*`、`ui/styles/*`
- `弥散渐变` 现在是简化版 mesh gradient 编辑器，主体逻辑拆在 `ui/components/DiffuseGradientTab.vue`、`ui/composables/useMeshGradient.ts`、`ui/constants/mesh-gradient-presets.ts`、`ui/utils/color.ts`
- `弥散渐变` 目前支持中文文案、色块增删、预览、随机化与 PNG 保存，颜色调整改为浏览器原生颜色选择器
- `弥散渐变` 不再保留 `MeshColorPicker` 相关实现或自绘浮层结构
- 当前插件已开始承载 `超级调色板` 的独立 tab，宿主侧负责两套功能的统一入口和主线程分发
- 当前宿主视觉已切换到更接近 `超级调色板` 的克制面板风格，主题样式独立放在 `ui/styles/super-theme.css`
- `超级调色板` tab 目前通过深度样式覆盖适配当前 `450x600` 宿主，不再按整页 `100vh` 直接渲染
- 插件默认首屏已切换为 `超级调色板`，窗口内容基准以其布局优先
- 后续如需要合并新的功能页，应优先保持现有功能不变，再按模块新增，而不是把逻辑回填到单文件里
- 当前工程的主状态编排在 `ui/App.vue`，其余逻辑应继续拆到 `ui/components/*`、`ui/composables/*`、`ui/utils/*`、`ui/styles/*`

## 外部记忆规则

- 每次启动当前任务前，必须先阅读 `PLAN.md`
- 每轮任务结束后，必须更新 `PLAN.md`
- 若本轮改动会影响模式规则、组件边界、交互契约，也要同步更新相关状态文件

## 当前代码结构

- 插件声明：
  - `manifest.json`
- 主线程：
  - `lib/main.ts`
  - `lib/colorUtils.ts`
  - `lib/palette.ts`
  - `lib/superPaletteRuntime.ts`
- 消息桥接：
  - `messages/sender.ts`
  - `messages/contracts.ts`
- UI 入口：
  - `ui/ui.ts`
- UI 页面：
  - `ui/App.vue`
  - `ui/components/SuperPaletteTab.vue`
- UI 样式：
  - `ui/styles/super-theme.css`

## 工作约束

- 不要把所有逻辑重新堆回单文件
- 新增能力时优先按模块拆分，保持主编排层轻薄
- 修改交互或样式前，先明确影响范围，再局部改动
- 每次完成一轮改动后，更新 `PLAN.md`，让后续启动不依赖聊天上下文
- 同类问题如果第二次还没定位清楚，先补日志再继续排查，不要反复猜测
