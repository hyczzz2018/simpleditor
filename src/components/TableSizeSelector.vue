<template>
  <div ref="root" class="table-size-picker">
    <button
      ref="trigger"
      class="toolbar-btn toolbar-btn--icon"
      @mouseenter="$emit('show-tip', $event, '插入表格')"
      @mousemove="$emit('show-tip', $event, '插入表格')"
      @mouseleave="$emit('hide-tip')"
      @click="toggle"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h18v18H3zm2 2v4h4V5zm6 0v4h8V5zM5 11v8h4v-8zm6 0v8h8v-8z"/></svg>
    </button>
    <div v-if="open" class="table-size-picker__panel" :style="panelStyle">
      <button v-for="size in sizes" :key="size.key" class="table-size-picker__item" @click="select(size)">
        {{ size.label }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TableSizeSelector',
  data() {
    return {
      open: false,
      panelTop: 0,
      panelLeft: 0,
      sizes: [
        { key: '2x2', rows: 2, cols: 2, label: '2 x 2' },
        { key: '3x3', rows: 3, cols: 3, label: '3 x 3' },
        { key: '4x4', rows: 4, cols: 4, label: '4 x 4' },
      ],
    }
  },
  computed: {
    panelStyle() {
      return {
        top: this.panelTop + 'px',
        left: this.panelLeft + 'px',
      }
    },
  },
  mounted() {
    document.addEventListener('mousedown', this.handleOutsideClick)
    window.addEventListener('resize', this.handleViewportChange)
    window.addEventListener('scroll', this.handleViewportChange, true)
  },
  beforeDestroy() {
    document.removeEventListener('mousedown', this.handleOutsideClick)
    window.removeEventListener('resize', this.handleViewportChange)
    window.removeEventListener('scroll', this.handleViewportChange, true)
  },
  methods: {
    toggle() {
      this.open = !this.open
      if (this.open) {
        this.$nextTick(this.updatePanelPosition)
      }
    },
    select(size) {
      this.$emit('select', size)
      this.open = false
    },
    handleOutsideClick(event) {
      if (!this.open) {
        return
      }

      const root = this.$refs.root
      if (root && !root.contains(event.target)) {
        this.open = false
      }
    },
    handleViewportChange() {
      if (this.open) {
        this.updatePanelPosition()
      }
    },
    updatePanelPosition() {
      const trigger = this.$refs.trigger
      if (!trigger) {
        return
      }

      const rect = trigger.getBoundingClientRect()
      const panelWidth = 132
      const panelHeight = this.sizes.length * 42 + 16
      const gap = 2
      const margin = 12
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0

      let left = rect.left
      let top = rect.bottom + gap

      if (left + panelWidth > viewportWidth - margin) {
        left = viewportWidth - panelWidth - margin
      }

      if (top + panelHeight > viewportHeight - margin) {
        top = rect.top - panelHeight - gap
      }

      if (left < margin) {
        left = margin
      }

      if (top < margin) {
        top = margin
      }

      this.panelLeft = left
      this.panelTop = top
    },
  },
}
</script>
