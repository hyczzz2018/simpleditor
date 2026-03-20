<template>
  <div v-if="visible" class="shortcut-mask" @click.self="$emit('close')">
    <div class="shortcut-panel" :class="{ 'is-dark': isDark }">
      <div class="shortcut-panel__header">
        <h3>快捷键面板</h3>
        <button class="toolbar-btn" @click="$emit('close')">关闭</button>
      </div>
      <p><kbd>Ctrl</kbd> + <kbd>S</kbd> 导出 HTML</p>
      <p><kbd>Ctrl</kbd> + <kbd>O</kbd> 打开导入</p>
      <p><kbd>Ctrl</kbd> + <kbd>/</kbd> 显示或隐藏面板</p>
      <p><kbd>Ctrl</kbd> + <kbd>B</kbd> 粗体</p>
      <p><kbd>Ctrl</kbd> + <kbd>I</kbd> 斜体</p>
      <p><kbd>Ctrl</kbd> + <kbd>U</kbd> 下划线</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShortcutPanel',
  props: {
    visible: Boolean,
    isDark: Boolean
  }
}
</script>
