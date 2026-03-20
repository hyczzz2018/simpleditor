<template>
  <div class="doc-toolbar-shell" :class="{ 'is-dark': isDarkTheme }">
    <div class="doc-toolbar">
    <div class="toolbar-cluster">
      <div class="button-group">
        <button class="toolbar-btn toolbar-btn--icon" @mouseenter="tip($event, '导入文档')" @mousemove="tip($event, '导入文档')" @mouseleave="leave" @click="$emit('import-file')">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2.5L17.5 8H14zM12 18l-4-4h2.6v-3h2.8v3H16z"/></svg>
        </button>
        <button class="toolbar-btn toolbar-btn--icon" @mouseenter="tip($event, '保存本地草稿')" @mousemove="tip($event, '保存本地草稿')" @mouseleave="leave" @click="$emit('save-document')">
          <svg viewBox="0 0 24 24"><path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm3-10H5V5h10z"/></svg>
        </button>
        <button class="toolbar-btn toolbar-btn--icon" @mouseenter="tip($event, '导出 HTML')" @mousemove="tip($event, '导出 HTML')" @mouseleave="leave" @click="$emit('export-file', 'html')">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2.5L17.5 8H14zM12 11l4 4h-2.6v3h-2.8v-3H8z"/></svg>
        </button>
        <button class="toolbar-btn toolbar-btn--icon" @mouseenter="tip($event, '导出 DOCX')" @mousemove="tip($event, '导出 DOCX')" @mouseleave="leave" @click="$emit('export-file', 'docx')">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2.5L17.5 8H14zM8.8 16 10.9 13l-2-3h1.8l1.2 1.9 1.2-1.9h1.8l-2 3 2.1 3h-1.8l-1.3-1.9-1.3 1.9z"/></svg>
        </button>
        <button class="toolbar-btn toolbar-btn--icon" @mouseenter="tip($event, '撤销')" @mousemove="tip($event, '撤销')" @mouseleave="leave" @click="$emit('undo')">
          <svg viewBox="0 0 24 24"><path d="M12.5 8C9.85 8 7.45 9 5.6 10.6L2 7v9h9l-3.62-3.62A7.1 7.1 0 0 1 12.5 10.5c3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8Z"/></svg>
        </button>
        <button class="toolbar-btn toolbar-btn--icon" @mouseenter="tip($event, '重做')" @mousemove="tip($event, '重做')" @mouseleave="leave" @click="$emit('redo')">
          <svg viewBox="0 0 24 24"><path d="M11.5 8C6.85 8 2.92 11.03 1.53 15.22L3.9 16c1.05-3.19 4.06-5.5 7.6-5.5 1.96 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6A10.46 10.46 0 0 0 11.5 8Z"/></svg>
        </button>
      </div>
    </div>

    <div class="toolbar-cluster">
      <div ref="fontMenu" class="toolbar-dropdown">
        <button
          ref="fontTrigger"
          class="toolbar-select toolbar-select--wide toolbar-select-trigger"
          type="button"
          @click="toggleFontMenu"
        >
          <span class="toolbar-font-preview" :style="{ fontFamily: currentFontFamily }">{{ currentFontLabel }}</span>
          <span class="toolbar-select-caret">▾</span>
        </button>
        <div v-if="fontMenuOpen" class="toolbar-dropdown-panel toolbar-dropdown-panel--font" :style="fontPanelStyle">
          <button
            v-for="font in fontOptions"
            :key="font.value"
            type="button"
            class="toolbar-dropdown-item toolbar-dropdown-item--font"
            :class="{ active: currentFontFamily === font.value }"
            :style="{ fontFamily: font.value }"
            @click="selectFont(font.value)"
          >
            {{ font.label }}
          </button>
        </div>
      </div>
      <div ref="fontSizeMenu" class="toolbar-dropdown">
        <button
          ref="fontSizeTrigger"
          class="toolbar-select toolbar-select--size toolbar-select-trigger"
          type="button"
          @click="toggleFontSizeMenu"
        >
          <span>{{ currentFontSizeLabel }}</span>
          <span class="toolbar-select-caret">▾</span>
        </button>
        <div v-if="fontSizeMenuOpen" class="toolbar-dropdown-panel toolbar-dropdown-panel--menu" :style="fontSizePanelStyle">
          <button
            v-for="item in fontSizeOptions"
            :key="item.value"
            type="button"
            class="toolbar-dropdown-item toolbar-dropdown-item--menu"
            :class="{ active: currentFontSize === item.value }"
            @click="selectFontSize(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
      <div class="button-group">
        <button class="toolbar-btn toolbar-btn--icon" :class="{ active: formats.bold }" @mouseenter="tip($event, '粗体')" @mousemove="tip($event, '粗体')" @mouseleave="leave" @click="$emit('format-text', 'bold')"><svg viewBox="0 0 24 24"><path d="M13.5 15.5H10v-3h3.5A1.5 1.5 0 0 1 15 14a1.5 1.5 0 0 1-1.5 1.5M10 6.5h3A1.5 1.5 0 0 1 14.5 8 1.5 1.5 0 0 1 13 9.5h-3M15.6 10.79A3.76 3.76 0 0 0 17.25 8C17.25 5.74 15.5 4 13.25 4H7v14h7.04c2.1 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42Z"/></svg></button>
        <button class="toolbar-btn toolbar-btn--icon" :class="{ active: formats.italic }" @mouseenter="tip($event, '斜体')" @mousemove="tip($event, '斜体')" @mouseleave="leave" @click="$emit('format-text', 'italic')"><svg viewBox="0 0 24 24"><path d="M10 4v3h2.21L8.79 15H6v3h8v-3h-2.21L15.21 7H18V4z"/></svg></button>
        <button class="toolbar-btn toolbar-btn--icon" :class="{ active: formats.underline }" @mouseenter="tip($event, '下划线')" @mousemove="tip($event, '下划线')" @mouseleave="leave" @click="$emit('format-text', 'underline')"><svg viewBox="0 0 24 24"><path d="M5 21h14v-2H5zm7-4a6 6 0 0 0 6-6V3h-2.5v8A3.5 3.5 0 0 1 12 14.5 3.5 3.5 0 0 1 8.5 11V3H6v8a6 6 0 0 0 6 6Z"/></svg></button>
        <button class="toolbar-btn toolbar-btn--icon" :class="{ active: formats.strikeThrough }" @mouseenter="tip($event, '删除线')" @mousemove="tip($event, '删除线')" @mouseleave="leave" @click="$emit('format-text', 'strike')"><svg viewBox="0 0 24 24"><path d="M3 14h18v-2H3zm8 7h2v-4h-2zm1-17c-3.31 0-6 1.34-6 4h2.5c0-1.24 1.57-2 3.5-2 1.74 0 3 .66 3 1.5S13.74 9 12 9h-1v2h1c2.22 0 4 1.12 4 3s-1.78 3-4 3-4-1.12-4-3H5.5c0 3 2.88 5 6.5 5s6.5-2 6.5-5c0-1.67-.94-3.08-2.48-4 .93-.69 1.48-1.67 1.48-2.8 0-2.56-2.46-4.2-5.5-4.2Z"/></svg></button>
      </div>
      <label class="toolbar-color-wrap" @mouseenter="tip($event, '字体颜色')" @mousemove="tip($event, '字体颜色')" @mouseleave="leave">
        <span class="toolbar-color-icon">A</span>
        <input class="toolbar-color" type="color" :value="currentTextColor" @input="$emit('text-color-change', $event.target.value)" />
      </label>
      <label class="toolbar-color-wrap" @mouseenter="tip($event, '背景颜色')" @mousemove="tip($event, '背景颜色')" @mouseleave="leave">
        <span class="toolbar-color-icon toolbar-color-icon--bg"></span>
        <input class="toolbar-color" type="color" :value="currentBgColor" @input="$emit('bg-color-change', $event.target.value)" />
      </label>
    </div>

    <div class="toolbar-cluster">
      <div ref="blockMenu" class="toolbar-dropdown">
        <button
          ref="blockTrigger"
          class="toolbar-select toolbar-select--compact toolbar-select-trigger"
          type="button"
          @click="toggleBlockMenu"
        >
          <span>{{ currentBlockLabel }}</span>
          <span class="toolbar-select-caret">▾</span>
        </button>
        <div v-if="blockMenuOpen" class="toolbar-dropdown-panel toolbar-dropdown-panel--menu" :style="blockPanelStyle">
          <button
            v-for="item in blockOptions"
            :key="item.value"
            type="button"
            class="toolbar-dropdown-item toolbar-dropdown-item--menu"
            :class="{ active: currentBlock === item.value }"
            @click="selectBlock(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
      <div class="button-group">
        <button class="toolbar-btn toolbar-btn--icon" :class="{ active: currentAlignment === 'left' }" @mouseenter="tip($event, '左对齐')" @mousemove="tip($event, '左对齐')" @mouseleave="leave" @click="$emit('set-alignment', 'left')"><svg viewBox="0 0 24 24"><path d="M3 3h18v2H3zm0 4h12v2H3zm0 4h18v2H3zm0 4h12v2H3zm0 4h18v2H3z"/></svg></button>
        <button class="toolbar-btn toolbar-btn--icon" :class="{ active: currentAlignment === 'center' }" @mouseenter="tip($event, '居中对齐')" @mousemove="tip($event, '居中对齐')" @mouseleave="leave" @click="$emit('set-alignment', 'center')"><svg viewBox="0 0 24 24"><path d="M3 3h18v2H3zm4 4h10v2H7zm-4 4h18v2H3zm4 4h10v2H7zm-4 4h18v2H3z"/></svg></button>
        <button class="toolbar-btn toolbar-btn--icon" :class="{ active: currentAlignment === 'right' }" @mouseenter="tip($event, '右对齐')" @mousemove="tip($event, '右对齐')" @mouseleave="leave" @click="$emit('set-alignment', 'right')"><svg viewBox="0 0 24 24"><path d="M3 3h18v2H3zm6 4h12v2H9zm-6 4h18v2H3zm6 4h12v2H9zm-6 4h18v2H3z"/></svg></button>
        <button class="toolbar-btn toolbar-btn--icon" :class="{ active: currentAlignment === 'justify' }" @mouseenter="tip($event, '两端对齐')" @mousemove="tip($event, '两端对齐')" @mouseleave="leave" @click="$emit('set-alignment', 'justify')"><svg viewBox="0 0 24 24"><path d="M3 3h18v2H3zm0 4h18v2H3zm0 4h18v2H3zm0 4h18v2H3zm0 4h18v2H3z"/></svg></button>
        <TableSizeSelector @select="$emit('insert-table', $event)" @show-tip="tip" @hide-tip="leave" />
        <button class="toolbar-btn toolbar-btn--icon" @mouseenter="tip($event, '无序列表')" @mousemove="tip($event, '无序列表')" @mouseleave="leave" @click="$emit('insert-list', 'ul')"><svg viewBox="0 0 24 24"><path d="M4 10.5A1.5 1.5 0 1 0 4 7.5a1.5 1.5 0 0 0 0 3zm0 6A1.5 1.5 0 1 0 4 13.5a1.5 1.5 0 0 0 0 3zM8 8h13v2H8zm0 6h13v2H8z"/></svg></button>
        <button class="toolbar-btn toolbar-btn--icon" @mouseenter="tip($event, '有序列表')" @mousemove="tip($event, '有序列表')" @mouseleave="leave" @click="$emit('insert-list', 'ol')"><svg viewBox="0 0 24 24"><path d="M4 7h2v8H4v-1h1v-2H4v-1h1V9H4zm4 1h13v2H8zm0 6h13v2H8z"/></svg></button>
        <button class="toolbar-btn toolbar-btn--icon" @mouseenter="tip($event, '插入链接')" @mousemove="tip($event, '插入链接')" @mouseleave="leave" @click="$emit('insert-link')"><svg viewBox="0 0 24 24"><path d="M10.59 13.41a1.98 1.98 0 0 0 2.82 0l3.59-3.59a2 2 0 1 0-2.83-2.82l-1.3 1.3-1.41-1.42 1.29-1.29a4 4 0 1 1 5.66 5.65l-3.58 3.59a4 4 0 0 1-5.66 0l-.17-.17 1.41-1.41zm2.82-2.82-2.82 2.82-1.41-1.41 2.82-2.82zm-7.82 2.17 3.58-3.59a4 4 0 0 1 5.66 0l.17.17-1.41 1.41-.17-.17a2 2 0 0 0-2.83 0L7 14.17A2 2 0 1 0 9.83 17l1.29-1.29 1.41 1.41-1.29 1.29a4 4 0 1 1-5.65-5.65z"/></svg></button>
        <button class="toolbar-btn toolbar-btn--icon" @mouseenter="tip($event, '引用')" @mousemove="tip($event, '引用')" @mouseleave="leave" @click="$emit('change-heading', 'blockquote')"><svg viewBox="0 0 24 24"><path d="M7 17h4l2-4V7H7zm8 0h4l2-4V7h-6z"/></svg></button>
      </div>
    </div>

    <div class="toolbar-cluster toolbar-cluster--tail">
      <div class="button-group">
        <button class="toolbar-btn toolbar-btn--icon" :class="{ active: annotationMode }" @mouseenter="tip($event, '批注模式')" @mousemove="tip($event, '批注模式')" @mouseleave="leave" @click="$emit('toggle-annotation-mode')"><svg viewBox="0 0 24 24"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2zm2 4v2h12V8zm0 4v2h8v-2z"/></svg></button>
        <button class="toolbar-btn toolbar-btn--icon" :class="{ active: isDarkTheme }" @mouseenter="tip($event, '主题切换')" @mousemove="tip($event, '主题切换')" @mouseleave="leave" @click="$emit('toggle-theme')"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg></button>
        <button class="toolbar-btn toolbar-btn--icon" @mouseenter="tip($event, '快捷键面板')" @mousemove="tip($event, '快捷键面板')" @mouseleave="leave" @click="$emit('toggle-shortcuts')"><svg viewBox="0 0 24 24"><path d="M20 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zM8 9h2v2H8zm3 0h2v2h-2zm3 0h2v2h-2zM8 12h5v2H8zm6 0h2v2h-2z"/></svg></button>
      </div>
    </div>
    </div>
  </div>
</template>

<script>
import TableSizeSelector from './TableSizeSelector.vue'

export default {
  name: 'EditorToolbar',
  // 工具栏只负责分发意图，不直接操作编辑器实例，具体执行放在外层编辑器组件。
  components: {
    TableSizeSelector,
  },
  props: {
    currentBlock: String,
    currentAlignment: String,
    currentFontFamily: String,
    currentFontSize: String,
    currentTextColor: String,
    currentBgColor: String,
    annotationMode: Boolean,
    isDarkTheme: Boolean,
    formats: {
      type: Object,
      default: function () {
        return {}
      },
    },
  },
  data() {
    return {
      fontMenuOpen: false,
      fontPanelTop: 0,
      fontPanelLeft: 0,
      blockMenuOpen: false,
      blockPanelTop: 0,
      blockPanelLeft: 0,
      fontSizeMenuOpen: false,
      fontSizePanelTop: 0,
      fontSizePanelLeft: 0,
      fontOptions: [
        { label: '微软雅黑', value: 'Microsoft YaHei' },
        { label: '宋体', value: 'SimSun' },
        { label: '仿宋', value: 'FangSong' },
        { label: '楷体', value: 'KaiTi' },
        { label: 'Arial', value: 'Arial' },
      ],
      blockOptions: [
        { label: '正文', value: 'paragraph' },
        { label: '标题 1', value: 'h1' },
        { label: '标题 2', value: 'h2' },
        { label: '标题 3', value: 'h3' },
        { label: '引用', value: 'blockquote' },
      ],
      fontSizeOptions: [
        { label: '六号', value: '12px' },
        { label: '小五', value: '13px' },
        { label: '五号', value: '16px' },
        { label: '小四', value: '14px' },
        { label: '四号', value: '18px' },
        { label: '小三', value: '20px' },
        { label: '三号', value: '24px' },
        { label: '小二', value: '28px' },
        { label: '二号', value: '32px' },
      ],
    }
  },
  computed: {
    fontPanelStyle() {
      return {
        top: this.fontPanelTop + 'px',
        left: this.fontPanelLeft + 'px',
      }
    },
    blockPanelStyle() {
      return {
        top: this.blockPanelTop + 'px',
        left: this.blockPanelLeft + 'px',
      }
    },
    fontSizePanelStyle() {
      return {
        top: this.fontSizePanelTop + 'px',
        left: this.fontSizePanelLeft + 'px',
      }
    },
    currentBlockLabel() {
      const current = this.blockOptions.find(item => item.value === this.currentBlock)
      return current ? current.label : '正文'
    },
    currentFontLabel() {
      const current = this.fontOptions.find(item => item.value === this.currentFontFamily)
      return current ? current.label : this.currentFontFamily
    },
    currentFontSizeLabel() {
      const current = this.fontSizeOptions.find(item => item.value === this.currentFontSize)
      return current ? current.label : '五号'
    },
  },
  mounted() {
    // 自定义下拉菜单挂在当前视口坐标系里，所以窗口尺寸和滚动变化时要重算位置。
    document.addEventListener('click', this.handleDocumentClick)
    window.addEventListener('resize', this.handleViewportChange)
    window.addEventListener('scroll', this.handleViewportChange, true)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleDocumentClick)
    window.removeEventListener('resize', this.handleViewportChange)
    window.removeEventListener('scroll', this.handleViewportChange, true)
  },
  methods: {
    tip(event, text) {
      this.$emit('show-tooltip', {
        text,
        x: event.clientX + 14,
        y: event.clientY + 14,
      })
    },
    leave() {
      this.$emit('hide-tooltip')
    },
    toggleFontMenu() {
      this.fontMenuOpen = !this.fontMenuOpen
      if (this.fontMenuOpen) {
        this.$nextTick(this.updateFontMenuPosition)
      }
    },
    selectFont(font) {
      this.fontMenuOpen = false
      this.$emit('font-family-change', font)
    },
    toggleBlockMenu() {
      this.blockMenuOpen = !this.blockMenuOpen
      if (this.blockMenuOpen) {
        this.$nextTick(this.updateBlockMenuPosition)
      }
    },
    selectBlock(block) {
      this.blockMenuOpen = false
      this.$emit('change-heading', block)
    },
    toggleFontSizeMenu() {
      this.fontSizeMenuOpen = !this.fontSizeMenuOpen
      if (this.fontSizeMenuOpen) {
        this.$nextTick(this.updateFontSizeMenuPosition)
      }
    },
    selectFontSize(size) {
      this.fontSizeMenuOpen = false
      this.$emit('font-size-change', size)
    },
    handleViewportChange() {
      // 任一菜单处于打开态时，统一重算它们的位置，避免滚动后悬空。
      if (this.fontMenuOpen) {
        this.updateFontMenuPosition()
      }
      if (this.blockMenuOpen) {
        this.updateBlockMenuPosition()
      }
      if (this.fontSizeMenuOpen) {
        this.updateFontSizeMenuPosition()
      }
    },
    updateFontMenuPosition() {
      // 这里不是简单贴在按钮下方，还要处理右侧和底部越界后的回退。
      const trigger = this.$refs.fontTrigger
      if (!trigger) {
        return
      }

      const rect = trigger.getBoundingClientRect()
      const panelWidth = 220
      const panelHeight = this.fontOptions.length * 50 + 16
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

      this.fontPanelLeft = left
      this.fontPanelTop = top
    },
    updateFontSizeMenuPosition() {
      const trigger = this.$refs.fontSizeTrigger
      if (!trigger) {
        return
      }

      const rect = trigger.getBoundingClientRect()
      const panelWidth = 110
      const panelHeight = this.fontSizeOptions.length * 42 + 16
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

      this.fontSizePanelLeft = left
      this.fontSizePanelTop = top
    },
    updateBlockMenuPosition() {
      // 标题菜单和字体/字号菜单保持同一套浮层定位策略，减少交互差异。
      const trigger = this.$refs.blockTrigger
      if (!trigger) {
        return
      }

      const rect = trigger.getBoundingClientRect()
      const panelWidth = 140
      const panelHeight = this.blockOptions.length * 42 + 16
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

      this.blockPanelLeft = left
      this.blockPanelTop = top
    },
    handleDocumentClick(event) {
      // 点击外部时统一关闭三个菜单，避免多个浮层同时残留。
      const fontRoot = this.$refs.fontMenu
      const blockRoot = this.$refs.blockMenu

      if (!fontRoot || !fontRoot.contains(event.target)) {
        this.fontMenuOpen = false
      }

      if (!blockRoot || !blockRoot.contains(event.target)) {
        this.blockMenuOpen = false
      }

      const fontSizeRoot = this.$refs.fontSizeMenu
      if (!fontSizeRoot || !fontSizeRoot.contains(event.target)) {
        this.fontSizeMenuOpen = false
      }
    },
  },
}
</script>
