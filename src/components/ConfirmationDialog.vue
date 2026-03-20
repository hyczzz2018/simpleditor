<template>
  <div v-if="visible" class="confirm-dialog-backdrop" @click.self="$emit('cancel')">
    <div class="confirm-dialog-card" role="dialog" aria-modal="true">
      <h3 class="confirm-dialog-title">{{ title }}</h3>
      <p class="confirm-dialog-message">{{ message }}</p>
      <div class="confirm-dialog-actions">
        <button class="toolbar-btn" type="button" @click="$emit('cancel')">取消</button>
        <button
          class="toolbar-btn"
          :class="confirmVariant === 'danger' ? 'confirm-dialog-btn--danger' : 'toolbar-btn--primary'"
          type="button"
          @click="$emit('confirm')"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfirmationDialog',
  props: {
    visible: Boolean,
    title: {
      type: String,
      default: '确认操作',
    },
    message: {
      type: String,
      default: '',
    },
    confirmText: {
      type: String,
      default: '确认',
    },
    confirmVariant: {
      type: String,
      default: 'primary',
    },
  },
}
</script>
