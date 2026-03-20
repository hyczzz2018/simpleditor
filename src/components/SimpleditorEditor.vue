<template>
  <section class="doc-editor" :class="{ 'is-dark': isDarkTheme }">
    <EditorToolbar
      :current-block="editorState.currentBlock"
      :current-alignment="editorState.currentAlignment"
      :current-font-family="editorState.currentFontFamily"
      :current-font-size="editorState.currentFontSize"
      :current-text-color="editorState.currentTextColor"
      :current-bg-color="editorState.currentBgColor"
      :annotation-mode="annotationMode"
      :formats="formats"
      :is-dark-theme="isDarkTheme"
      @new-document="requestNewDocument"
      @import-file="importFile"
      @save-document="saveDocument"
      @export-file="exportFile"
      @undo="undo"
      @redo="redo"
      @change-heading="changeBlock"
      @format-text="toggleFormat"
      @font-family-change="applyFontFamily"
      @font-size-change="applyFontSize"
      @text-color-change="applyTextColor"
      @bg-color-change="applyBgColor"
      @set-alignment="setAlignment"
      @insert-list="insertList"
      @insert-link="insertLink"
      @insert-table="insertTable"
      @toggle-annotation-mode="toggleAnnotationMode"
      @toggle-theme="toggleTheme"
      @toggle-shortcuts="shortcutPanelVisible = !shortcutPanelVisible"
      @show-tooltip="showTooltip"
      @hide-tooltip="hideTooltip"
    />

    <div ref="workspace" class="doc-workspace" :class="{ 'with-sidebar': annotationState.visible }">
      <div class="editor-stage">
        <TiptapEditor
          :editor="editor"
          @selection-change="syncToolbarState"
          @comment-click="handleCommentClick"
          @mouseover.native="handleEditorHover"
          @mouseleave.native="clearHoveredAnnotation"
        />
      </div>

      <div v-if="annotationLine.visible" class="annotation-link-layer" aria-hidden="true">
        <svg class="annotation-link-svg">
          <path :d="annotationLine.path" class="annotation-link-path" />
        </svg>
      </div>

      <AnnotationSystem
        :visible="annotationState.visible"
        :active-id="annotationState.activeId"
        :hover-id="hoverAnnotationId"
        :draft-text="annotationState.draft.text"
        :draft-content="annotationState.draft.content"
        :annotations="annotationState.items"
        @close="closeAnnotationPanel"
        @activate="activateAnnotationById"
        @hover="hoverAnnotation"
        @leave="clearHoveredAnnotation"
        @update-draft="updateAnnotationDraft"
        @reset-draft="clearAnnotationDraftSelection"
        @save="saveAnnotation"
        @reply="replyToAnnotation"
        @resolve="setAnnotationStatus"
        @remove="removeAnnotation"
      />
    </div>

    <EditorStatusBar
      :is-saved="editorState.saved"
      :char-count="charCount"
      :read-only="editorState.readOnly"
      :last-saved-at="lastSavedLabel"
      @toggle-readonly="toggleReadOnly"
    />

    <input ref="fileInput" type="file" accept=".html,.htm,.txt,.doc,.docx" class="hidden-input" @change="handleImport" />

    <ShortcutPanel :visible="shortcutPanelVisible" :is-dark="isDarkTheme" @close="shortcutPanelVisible = false" />
    <Tooltip :visible="tooltip.visible" :text="tooltip.text" :x="tooltip.x" :y="tooltip.y" />
    <ConfirmationDialog
      :visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      :confirm-variant="confirmDialog.confirmVariant"
      @cancel="closeConfirmDialog"
      @confirm="handleConfirmDialog"
    />
  </section>
</template>

<script>
import EditorToolbar from './EditorToolbar.vue'
import AnnotationSystem from './AnnotationSystem.vue'
import EditorStatusBar from './EditorStatusBar.vue'
import ShortcutPanel from './ShortcutPanel.vue'
import Tooltip from './Tooltip.vue'
import ConfirmationDialog from './ConfirmationDialog.vue'
import TiptapEditor from './TiptapEditor.vue'
import TiptapCore from '../core/TiptapCore'
import WordHandler from '../fileHandlers/WordHandler'
import { registerShortcuts } from '../composables/useShortcuts'
import { getEditorMetrics, getToolbarState } from '../composables/useEditorState'
import {
  activateAnnotation,
  createAnnotationState,
  loadAnnotations,
  replyAnnotation,
  removeAnnotation as dropAnnotation,
  saveAnnotation as persistAnnotation,
  setAnnotationStatus as updateAnnotationStatus,
  resetAnnotationDraft,
  updateAnnotationDraft,
  updateAnnotationSelection,
} from '../composables/useAnnotations'
import { createThemeController } from '../composables/useTheme'
import { showMessage } from '../utils/Message'
import { Console } from '../utils/Console'

const LOCAL_DRAFT_KEY = 'simpleditor:draft'
const LEGACY_LOCAL_DRAFT_KEY = 'gxjt-editor-ui:draft'
const AUTO_SAVE_DELAY = 1000

export default {
  name: 'SimpleditorEditor',
  components: {
    EditorToolbar,
    AnnotationSystem,
    EditorStatusBar,
    ShortcutPanel,
    Tooltip,
    TiptapEditor,
    ConfirmationDialog,
  },
  data() {
    return {
      core: null,
      editor: null,
      fileHandler: null,
      cleanupShortcuts: null,
      cleanupTheme: null,
      charCount: 0,
      wordCount: 0,
      shortcutPanelVisible: false,
      annotationState: createAnnotationState(),
      isDarkTheme: false,
      tooltip: {
        visible: false,
        text: '',
        x: 0,
        y: 0,
      },
      confirmDialog: {
        visible: false,
        title: '',
        message: '',
        confirmText: '确认',
        confirmVariant: 'primary',
        action: '',
        payload: null,
      },
      annotationLine: {
        visible: false,
        path: '',
      },
      hoverAnnotationId: '',
      autoSaveTimer: null,
      lastSavedAt: '',
      formats: {
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
      },
    }
  },
  computed: {
    editorState() {
      return this.$store.state
    },
    annotationMode() {
      return this.$store.state.annotationMode
    },
    lastSavedLabel() {
      if (!this.lastSavedAt) {
        return ''
      }

      const date = new Date(this.lastSavedAt)
      if (Number.isNaN(date.getTime())) {
        return ''
      }

      const pad = value => String(value).padStart(2, '0')
      return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    },
  },
  mounted() {
    this.fileHandler = new WordHandler()
    const initialContent = this.getInitialContent()

    this.core = new TiptapCore({
      content: initialContent,
      readOnly: this.editorState.readOnly,
      onCreate: editor => {
        this.editor = editor
        this.$store.commit('setHtml', editor.getHTML())
        this.syncStats()
        this.syncToolbarState()
        this.syncCommentHighlights()
      },
      onUpdate: editor => {
        this.$store.commit('setHtml', editor.getHTML())
        this.$store.commit('setSaved', false)
        this.syncStats()
        this.syncToolbarState()
        this.syncCommentHighlights()
        this.scheduleAutoSave()
      },
      onSelectionUpdate: () => {
        this.syncToolbarState()
        this.captureAnnotationSelection()
      },
    })

    this.editor = this.core.init()
    this.cleanupShortcuts = registerShortcuts(this)
    this.cleanupTheme = createThemeController(this)
    window.addEventListener('resize', this.updateAnnotationLine)
    window.addEventListener('scroll', this.updateAnnotationLine, true)
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateAnnotationLine)
    window.removeEventListener('scroll', this.updateAnnotationLine, true)
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
    this.clearAutoSaveTimer()
    this.persistDraft({ silent: true })
    if (this.cleanupShortcuts) this.cleanupShortcuts()
    if (this.cleanupTheme) this.cleanupTheme()
    if (this.core) this.core.destroy()
  },
  methods: {
    getInitialContent() {
      const fallback = this.editorState.html || '<p></p>'

      try {
        // 新旧草稿键都尝试读取，避免项目改名后用户本地历史内容丢失。
        const raw = window.localStorage.getItem(LOCAL_DRAFT_KEY) || window.localStorage.getItem(LEGACY_LOCAL_DRAFT_KEY)
        if (!raw) {
          return fallback
        }

        const draft = JSON.parse(raw)
        if (draft && Array.isArray(draft.annotations)) {
          loadAnnotations(this.annotationState, draft.annotations)
        }

        if (draft && draft.updatedAt) {
          this.lastSavedAt = draft.updatedAt
        }

        if (draft && typeof draft.html === 'string' && draft.html.trim()) {
          this.$store.commit('setSaved', true)
          return draft.html
        }
      } catch (error) {
        Console.error(error)
      }

      return fallback
    },
    persistDraft(options = {}) {
      if (!this.editor) {
        return false
      }

      const html = this.editor.getHTML()

      try {
        const updatedAt = new Date().toISOString()
        // 草稿保存的是“正文 HTML + 批注数据 + 时间戳”，这样刷新后可以整体恢复。
        window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify({
          html,
          annotations: this.annotationState.items,
          updatedAt,
        }))
        this.$store.commit('setHtml', html)
        this.lastSavedAt = updatedAt
        this.$store.commit('setSaved', true)
        if (!options.silent) {
          showMessage('已保存到本地草稿。')
        }
        return true
      } catch (error) {
        Console.error(error)
        if (!options.silent) {
          showMessage('本地保存失败。')
        }
        return false
      }
    },
    saveDocument() {
      this.clearAutoSaveTimer()
      this.persistDraft()
    },
    requestNewDocument() {
      this.openConfirmDialog({
        title: '新建空白文档',
        message: '确认新建空白文档吗？当前正文、批注和本地草稿都会被清空。',
        confirmText: '新建文档',
        action: 'new-document',
      })
    },
    executeNewDocument() {
      this.clearAutoSaveTimer()

      if (this.editor) {
        this.editor.commands.setContent('<p></p>')
      }

      resetAnnotationDraft(this.annotationState)
      loadAnnotations(this.annotationState, [])
      this.annotationState.visible = false
      this.hoverAnnotationId = ''
      this.annotationLine.visible = false
      this.annotationLine.path = ''
      this.lastSavedAt = ''

      window.localStorage.removeItem(LOCAL_DRAFT_KEY)
      window.localStorage.removeItem(LEGACY_LOCAL_DRAFT_KEY)

      this.$store.commit('patchState', { annotationMode: false })
      this.$store.commit('setHtml', '<p></p>')
      this.$store.commit('setSaved', true)
      this.syncStats()
      this.syncToolbarState()
      this.syncCommentHighlights()
      showMessage('已新建空白文档。')
    },
    scheduleAutoSave() {
      this.clearAutoSaveTimer()
      // 自动保存做成防抖，避免输入过程中频繁写 localStorage。
      this.autoSaveTimer = window.setTimeout(() => {
        this.autoSaveTimer = null
        this.persistDraft({ silent: true })
      }, AUTO_SAVE_DELAY)
    },
    clearAutoSaveTimer() {
      if (this.autoSaveTimer) {
        window.clearTimeout(this.autoSaveTimer)
        this.autoSaveTimer = null
      }
    },
    handleBeforeUnload() {
      this.clearAutoSaveTimer()
      this.persistDraft({ silent: true })
    },
    syncStats() {
      const metrics = getEditorMetrics(this.editor)
      this.charCount = metrics.charCount
      this.wordCount = metrics.wordCount
    },
    syncToolbarState() {
      const state = getToolbarState(this.editor, this.editorState)
      this.formats = state.formats
      this.$store.commit('patchState', {
        currentBlock: state.currentBlock,
        currentAlignment: state.currentAlignment,
        currentFontFamily: state.currentFontFamily,
        currentFontSize: state.currentFontSize,
        currentTextColor: state.currentTextColor,
        currentBgColor: state.currentBgColor,
      })
    },
    updateAnnotationLine() {
      this.$nextTick(() => {
        const targetId = this.annotationState.activeId || this.hoverAnnotationId

        if (!this.annotationState.visible || !targetId) {
          this.annotationLine.visible = false
          this.annotationLine.path = ''
          return
        }

        const workspace = this.$refs.workspace
        const anchor = this.$el && this.$el.querySelector
          ? this.$el.querySelector(`.gxjt-prosemirror [data-comment-id="${targetId}"]`)
          : null
        const card = this.$el && this.$el.querySelector
          ? this.$el.querySelector(`[data-comment-card-id="${targetId}"]`)
          : null

        if (!workspace || !anchor || !card) {
          this.annotationLine.visible = false
          this.annotationLine.path = ''
          return
        }

        const workspaceRect = workspace.getBoundingClientRect()
        const anchorRect = anchor.getBoundingClientRect()
        const cardRect = card.getBoundingClientRect()

        // 连线使用工作区相对坐标，滚动时只需要重算路径，不依赖绝对页面位置。
        const startX = anchorRect.right - workspaceRect.left + 8
        const startY = anchorRect.top + anchorRect.height / 2 - workspaceRect.top
        const endX = cardRect.left - workspaceRect.left - 10
        const endY = cardRect.top + 24 - workspaceRect.top
        const midX = startX + Math.max((endX - startX) * 0.45, 36)

        this.annotationLine.visible = true
        this.annotationLine.path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`
      })
    },

    syncCommentHighlights() {
      this.$nextTick(() => {
        const root = this.$el && this.$el.querySelector ? this.$el.querySelector('.gxjt-prosemirror') : null
        if (!root) {
          return
        }

        const itemMap = new Map(this.annotationState.items.map(item => [item.id, item]))
        root.querySelectorAll('[data-comment-id]').forEach(element => {
          const commentId = element.getAttribute('data-comment-id')
          const item = itemMap.get(commentId)
          element.classList.toggle('comment-anchor--active', commentId === this.annotationState.activeId)
          element.classList.toggle('comment-anchor--hover', commentId === this.hoverAnnotationId && commentId !== this.annotationState.activeId)
          element.classList.toggle('comment-anchor--resolved', !!item && item.status === 'resolved')
          element.classList.toggle('comment-anchor--open', !item || item.status !== 'resolved')
        })
      })
    },
    focusAnnotation(id) {
      this.$nextTick(() => {
        const root = this.$el && this.$el.querySelector ? this.$el.querySelector('.gxjt-prosemirror') : null
        if (!root) {
          return
        }

        const target = root.querySelector(`[data-comment-id="${id}"]`)
        if (target && target.scrollIntoView) {
          target.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }
      })
    },
    activateAnnotationById(id) {
      activateAnnotation(this.annotationState, id)
      this.annotationState.visible = true
      this.syncCommentHighlights()
      this.focusAnnotation(id)
      this.updateAnnotationLine()
    },
    handleCommentClick(id) {
      this.activateAnnotationById(id)
    },
    handleEditorHover(event) {
      const target = event && event.target && event.target.closest
        ? event.target.closest('[data-comment-id]')
        : null
      const id = target ? target.getAttribute('data-comment-id') : ''

      if (!id) {
        this.clearHoveredAnnotation()
        return
      }

      if (id === this.hoverAnnotationId) {
        return
      }

      this.hoverAnnotationId = id
      this.syncCommentHighlights()
      this.updateAnnotationLine()
    },
    hoverAnnotation(id) {
      if (!id || id === this.hoverAnnotationId) {
        return
      }

      this.hoverAnnotationId = id
      this.syncCommentHighlights()
      this.updateAnnotationLine()
    },
    clearHoveredAnnotation(id) {
      if (id && this.hoverAnnotationId && id !== this.hoverAnnotationId) {
        return
      }

      if (!this.hoverAnnotationId) {
        return
      }

      this.hoverAnnotationId = ''
      this.syncCommentHighlights()
      this.updateAnnotationLine()
    },
    chain() {
      return this.editor ? this.editor.chain().focus() : null
    },
    run(chain) {
      if (chain) {
        chain.run()
      }
    },
    undo() {
      this.run(this.chain().undo())
    },
    redo() {
      this.run(this.chain().redo())
    },
    toggleFormat(command) {
      const chain = this.chain()
      if (!chain) return

      const map = {
        bold: () => chain.toggleBold(),
        italic: () => chain.toggleItalic(),
        underline: () => chain.toggleUnderline(),
        strike: () => chain.toggleStrike(),
      }

      map[command] && this.run(map[command]())
    },
    changeBlock(block) {
      const chain = this.chain()
      if (!chain) return

      if (block === 'paragraph') this.run(chain.setParagraph())
      else if (block === 'blockquote') this.run(chain.toggleBlockquote())
      else if (/^h[1-6]$/.test(block)) this.run(chain.toggleHeading({ level: Number(block.slice(1)) }))
    },
    applyFontFamily(fontFamily) {
      this.run(this.chain().setFontFamily(fontFamily))
    },
    applyFontSize(fontSize) {
      this.run(this.chain().setFontSize(fontSize))
    },
    applyTextColor(color) {
      this.run(this.chain().setColor(color))
    },
    applyBgColor(color) {
      this.run(this.chain().setBackgroundColor(color))
    },
    setAlignment(alignment) {
      this.run(this.chain().setTextAlign(alignment))
    },
    insertList(type) {
      if (type === 'ol') this.run(this.chain().toggleOrderedList())
      else this.run(this.chain().toggleBulletList())
    },
    insertLink() {
      if (!this.editor) return
      const previous = this.editor.getAttributes('link').href || ''
      const url = window.prompt('请输入链接地址', previous)
      if (url === null) return
      if (!url) {
        this.run(this.chain().extendMarkRange('link').unsetLink())
        return
      }
      this.run(this.chain().extendMarkRange('link').setLink({ href: url }))
    },
    insertTable(size) {
      const rows = size && size.rows ? size.rows : 2
      const cols = size && size.cols ? size.cols : 2
      const chain = this.chain()
      if (!chain) return

      let inserted = false

      // 空文档默认只有一个初始空段落时，先清空再插表，避免表格上方残留占位空行。
      const shouldReplaceInitialParagraph = this.editor
        && this.editor.isEmpty
        && this.editor.state.doc.childCount === 1
        && this.editor.state.doc.firstChild
        && this.editor.state.doc.firstChild.type.name === 'paragraph'

      if (shouldReplaceInitialParagraph) {
        inserted = chain.clearContent(true).insertTable({ rows, cols, withHeaderRow: true }).run()
      } else {
        inserted = chain.insertTable({ rows, cols, withHeaderRow: true }).run()
      }

      if (inserted) {
        this.syncStats()
        this.syncToolbarState()
      }
    },
    toggleAnnotationMode() {
      const next = !this.annotationMode
      this.$store.commit('patchState', { annotationMode: next })

      if (!next) {
        this.closeAnnotationPanel()
        return
      }

      this.annotationState.visible = true
      showMessage('批注模式已开启，选中文本后可添加批注。')
    },
    captureAnnotationSelection() {
      if (!this.annotationMode || !this.editor) return

      const { from, to, empty } = this.editor.state.selection
      const text = empty ? '' : this.editor.state.doc.textBetween(from, to, ' ').trim()
      updateAnnotationSelection(this.annotationState, {
        text,
        from,
        to,
      })
    },
    updateAnnotationDraft(content) {
      updateAnnotationDraft(this.annotationState, content)
    },
    clearAnnotationDraftSelection() {
      resetAnnotationDraft(this.annotationState)

      if (this.editor) {
        const { to } = this.editor.state.selection
        this.editor.chain().focus().setTextSelection(to).run()
      }
    },
    closeAnnotationPanel() {
      this.annotationState.visible = false
      this.clearAnnotationDraftSelection()
    },
    saveAnnotation() {
      const draft = this.annotationState.draft
      if (!draft.text || !draft.content || !draft.from || !draft.to || draft.from === draft.to) {
        showMessage('请先选中文本并填写批注内容。')
        return
      }

      const item = persistAnnotation(this.annotationState, { author: '当前用户' })
      const applied = this.editor
        ? this.editor.chain().focus().setTextSelection({ from: item.from, to: item.to }).setCommentAnchor({ commentId: item.id }).run()
        : false

      if (!applied) {
        dropAnnotation(this.annotationState, item.id)
        showMessage('批注锚点创建失败。')
        return
      }

      this.annotationState.visible = true
      this.annotationState.activeId = item.id
      this.$store.commit('setSaved', false)
      this.syncCommentHighlights()
      this.focusAnnotation(item.id)
      this.updateAnnotationLine()
      this.scheduleAutoSave()
    },
    replyToAnnotation(id, content) {
      const reply = replyAnnotation(this.annotationState, id, content, '当前用户')
      if (!reply) {
        showMessage('批注回复失败。')
        return
      }

      this.$store.commit('setSaved', false)
      this.syncCommentHighlights()
      this.updateAnnotationLine()
      this.scheduleAutoSave()
    },
    setAnnotationStatus(id, status) {
      const item = updateAnnotationStatus(this.annotationState, id, status)
      if (!item) {
        return
      }

      this.$store.commit('setSaved', false)
      this.syncCommentHighlights()
      this.updateAnnotationLine()
      this.scheduleAutoSave()
    },
    removeAnnotationMark(id) {
      if (!this.editor) {
        return
      }

      const { state, view } = this.editor
      let tr = state.tr
      let changed = false

      state.doc.descendants((node, pos) => {
        if (!node.isText) {
          return true
        }

        node.marks.forEach(mark => {
          if (mark.type.name === 'commentAnchor' && mark.attrs.commentId === id) {
            tr = tr.removeMark(pos, pos + node.nodeSize, mark.type)
            changed = true
          }
        })

        return true
      })

      if (changed) {
        view.dispatch(tr)
      }
    },
    executeRemoveAnnotation(id) {
      this.removeAnnotationMark(id)
      dropAnnotation(this.annotationState, id)
      if (this.annotationState.activeId === id) {
        this.annotationState.activeId = ''
      }
      if (this.hoverAnnotationId === id) {
        this.hoverAnnotationId = ''
      }
      this.$store.commit('setSaved', false)
      this.syncCommentHighlights()
      this.updateAnnotationLine()
      this.scheduleAutoSave()
    },
    removeAnnotation(id) {
      this.openConfirmDialog({
        title: '删除批注',
        message: '确认删除这条批注吗？删除后无法恢复。',
        confirmText: '删除',
        confirmVariant: 'danger',
        action: 'remove-annotation',
        payload: id,
      })
    },
    toggleReadOnly() {
      const next = !this.editorState.readOnly
      this.core.setReadOnly(next)
      this.$store.commit('setReadOnly', next)
    },
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme
    },
    showTooltip(payload) {
      this.tooltip = {
        visible: true,
        text: payload.text,
        x: payload.x,
        y: payload.y,
      }
    },
    hideTooltip() {
      this.tooltip.visible = false
    },
    openConfirmDialog(options = {}) {
      this.confirmDialog = {
        visible: true,
        title: options.title || '确认操作',
        message: options.message || '',
        confirmText: options.confirmText || '确认',
        confirmVariant: options.confirmVariant || 'primary',
        action: options.action || '',
        payload: options.payload === undefined ? null : options.payload,
      }
    },
    closeConfirmDialog() {
      this.confirmDialog = {
        visible: false,
        title: '',
        message: '',
        confirmText: '确认',
        confirmVariant: 'primary',
        action: '',
        payload: null,
      }
    },
    handleConfirmDialog() {
      const { action, payload } = this.confirmDialog
      this.closeConfirmDialog()

      if (action === 'remove-annotation') {
        this.executeRemoveAnnotation(payload)
        return
      }

      if (action === 'new-document') {
        this.executeNewDocument()
      }
    },
    importFile() {
      this.$refs.fileInput.click()
    },
    async handleImport(event) {
      const file = event.target.files[0]
      if (!file) return

      try {
        const imported = await this.fileHandler.importFile(file)
        const html = typeof imported === 'string' ? imported : ((imported && imported.html) || '<p></p>')
        const annotations = imported && !Array.isArray(imported) && typeof imported === 'object'
          ? (Array.isArray(imported.annotations) ? imported.annotations : [])
          : []

        this.editor.commands.setContent(html)
        this.$store.commit('setHtml', html)
        loadAnnotations(this.annotationState, annotations)
        this.clearAutoSaveTimer()
        this.$store.commit('setSaved', true)
        this.syncStats()
        this.syncToolbarState()
        this.syncCommentHighlights()
      } catch (error) {
        Console.error(error)
        showMessage(error.message)
      } finally {
        event.target.value = ''
      }
    },
    async exportFile(type) {
      if (!this.editor) return

      try {
        const html = this.editor.getHTML()
        // 导出由 fileHandler 统一处理：支持另存为、兼容回退以及 docx 批注快照写入。
        const exported = type === 'docx'
          ? await this.fileHandler.exportDocx(html, this.annotationState.items)
          : await this.fileHandler.exportHtml(html)

        if (exported) {
          this.$store.commit('setSaved', true)
        }
      } catch (error) {
        Console.error(error)
        showMessage(error.message || '导出失败。')
      }
    },
  },
}
</script>
