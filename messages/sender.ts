export type MessageType = {
  type: UIMessage | PluginMessage
  data?: any
}

export enum PluginMessage {
  INITIAL = 'plugin:initial',
  APPLY_SUCCESS = 'plugin:apply-success',
  ERROR = 'plugin:error',
}

export enum UIMessage {
  HELLO = 'Hello!',
  ADJUST_COLOR = 'ADJUST_COLOR',
  APPLY_GRADIENT = 'APPLY_GRADIENT',
  APPLY_DIFFUSE_GRADIENT = 'ui:apply-diffuse-gradient',
  APPLY_SWATCH_COLOR = 'APPLY_SWATCH_COLOR',
  READY = 'ui:ready',
  APPLY_PALETTE = 'ui:apply-palette',
}

/**
 * 向UI发送消息
 */
export const sendMsgToUI = (data: MessageType) => {
  mg.ui.postMessage(data, '*')
}

/**
 * 向插件发送消息
 */
export const sendMsgToPlugin = (data: MessageType) => {
  parent.postMessage({ pluginMessage: data }, '*')
}
