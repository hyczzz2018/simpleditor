<template>
  <div
    v-if="visible"
    ref="tooltip"
    class="editor-tooltip"
    :style="styleObject"
  >
    {{ text }}
  </div>
</template>

<script>
export default {
  name: 'Tooltip',
  props: {
    visible: Boolean,
    text: String,
    x: Number,
    y: Number,
  },
  data() {
    return {
      left: 0,
      top: 0,
    }
  },
  computed: {
    styleObject() {
      return {
        left: this.left + 'px',
        top: this.top + 'px',
      }
    },
  },
  watch: {
    visible() {
      this.updatePosition()
    },
    text() {
      this.updatePosition()
    },
    x() {
      this.updatePosition()
    },
    y() {
      this.updatePosition()
    },
  },
  mounted() {
    window.addEventListener('resize', this.updatePosition)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updatePosition)
  },
  methods: {
    updatePosition() {
      if (!this.visible) {
        return
      }

      this.$nextTick(() => {
        const tooltip = this.$refs.tooltip
        if (!tooltip) {
          return
        }

        const margin = 12
        const offset = 14
        const width = tooltip.offsetWidth || 0
        const height = tooltip.offsetHeight || 0
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0

        let left = Number(this.x || 0)
        let top = Number(this.y || 0)

        if (left + width > viewportWidth - margin) {
          left = Number(this.x || 0) - width - offset * 2
        }

        if (top + height > viewportHeight - margin) {
          top = Number(this.y || 0) - height - offset * 2
        }

        if (left < margin) {
          left = margin
        }

        if (top < margin) {
          top = margin
        }

        this.left = left
        this.top = top
      })
    },
  },
}
</script>
