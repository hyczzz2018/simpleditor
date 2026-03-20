<template>
  <footer class="status-bar">
    <span>{{ isSaved ? '已保存' : '编辑中' }}</span>
    <span v-if="lastSavedLabel">{{ lastSavedLabel }}</span>
    <span>字符数 {{ charCount }}</span>
    <span>{{ readOnly ? '只读模式' : '可编辑模式' }}</span>
    <button class="status-link" @click="$emit('toggle-readonly')">
      {{ readOnly ? '切换可编辑' : '切换只读' }}
    </button>
  </footer>
</template>

<script>
export default {
  name: 'EditorStatusBar',
  props: {
    isSaved: Boolean,
    charCount: Number,
    readOnly: Boolean,
    lastSavedAt: String,
  },
  computed: {
    lastSavedLabel() {
      if (!this.lastSavedAt) {
        return ''
      }

      return `自动保存于 ${this.lastSavedAt}`
    },
  },
}
</script>
