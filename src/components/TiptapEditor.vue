<template>
  <div class="editor-paper-wrap">
    <editor-content
      v-if="editor"
      :editor="editor"
      class="editor-paper ProseMirror"
      @mouseup.native="emitSelection"
      @keyup.native="emitSelection"
      @click.native="handleClick"
    />
  </div>
</template>

<script>
import { EditorContent } from '@tiptap/vue-2'

export default {
  name: 'TiptapEditor',
  components: {
    EditorContent,
  },
  props: {
    editor: {
      type: Object,
      default: null,
    },
  },
  methods: {
    emitSelection() {
      this.$emit('selection-change')
    },
    handleClick(event) {
      this.emitSelection()
      const target = event.target && event.target.closest ? event.target.closest('[data-comment-id]') : null
      if (target) {
        this.$emit('comment-click', target.getAttribute('data-comment-id'))
      }
    },
  },
}
</script>
