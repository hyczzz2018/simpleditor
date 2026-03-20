import { Editor } from '@tiptap/vue-2'
import { Extension } from '@tiptap/core'
import { Selection } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle, Color, FontFamily, FontSize, BackgroundColor } from '@tiptap/extension-text-style'
import CommentAnchor from './CommentAnchor'


function removeCurrentEmptyTextblock(editor) {
  // ProseMirror 默认的 joinBackward 对“顶部空段落”等场景并不稳定，这里补一个显式兜底。
  return editor.commands.command(({ state, tr, dispatch }) => {
    const { selection } = state
    const { empty, $from } = selection

    if (!empty || !$from.parent.isTextblock || $from.parent.textContent.length !== 0 || $from.depth === 0) {
      return false
    }

    const blockFrom = $from.before($from.depth)
    const blockTo = blockFrom + $from.parent.nodeSize
    const hasPreviousNode = Boolean(state.doc.resolve(blockFrom).nodeBefore)
    const hasNextNode = Boolean(state.doc.resolve(blockTo).nodeAfter)

    if (!hasPreviousNode && !hasNextNode) {
      return false
    }

    tr.delete(blockFrom, blockTo)

    const targetPos = hasPreviousNode ? Math.max(0, blockFrom - 1) : Math.min(blockFrom, tr.doc.content.size)
    tr.setSelection(Selection.near(tr.doc.resolve(targetPos), hasPreviousNode ? -1 : 1))
    tr.scrollIntoView()

    if (dispatch) {
      dispatch(tr)
    }

    return true
  })
}

function findParentNodeInfo($pos, typeName) {
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth)
    if (node && node.type && node.type.name === typeName) {
      return { node, depth }
    }
  }

  return null
}

const WordLikeEditing = Extension.create({
  name: 'wordLikeEditing',
  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const { selection } = this.editor.state
        const { empty, $from } = selection
        const tableInfo = findParentNodeInfo($from, 'table')

        if (tableInfo) {
          const { node: tableNode, depth: tableDepth } = tableInfo
          const tablePos = $from.before(tableDepth)
          const tableStart = tablePos + 1
          const previousNode = this.editor.state.doc.resolve(tablePos).nodeBefore

          if ($from.pos === tableStart && previousNode && previousNode.type && previousNode.type.name === 'paragraph' && previousNode.textContent.trim().length === 0) {
            const from = tablePos - previousNode.nodeSize
            const to = tablePos
            return this.editor.commands.command(({ tr, dispatch }) => {
              // 光标在表格第一格开头时，优先吃掉表格前的空段落，让表格可以继续上顶。
              tr.delete(from, to)
              if (dispatch) {
                dispatch(tr)
              }
              return true
            })
          }

          if (tableNode.textContent.trim().length === 0) {
            // 空表格允许用退格整表删除，行为更接近桌面文档编辑器。
            return this.editor.commands.deleteTable()
          }
        }

        if (!empty || !$from.parent.isTextblock) {
          return false
        }

        if ($from.parent.textContent.length === 0) {
          return this.editor.commands.joinBackward() || this.editor.commands.liftEmptyBlock() || removeCurrentEmptyTextblock(this.editor)
        }

        return false
      },
      Delete: () => {
        const { $from } = this.editor.state.selection
        const tableInfo = findParentNodeInfo($from, 'table')

        if (tableInfo) {
          const { node: tableNode, depth: tableDepth } = tableInfo
          const tablePos = $from.before(tableDepth)
          const tableStart = tablePos + 1
          const previousNode = this.editor.state.doc.resolve(tablePos).nodeBefore

          if ($from.pos === tableStart && previousNode && previousNode.type && previousNode.type.name === 'paragraph' && previousNode.textContent.trim().length === 0) {
            const from = tablePos - previousNode.nodeSize
            const to = tablePos
            return this.editor.commands.command(({ tr, dispatch }) => {
              tr.delete(from, to)
              if (dispatch) {
                dispatch(tr)
              }
              return true
            })
          }

          if (tableNode.textContent.trim().length === 0) {
            return this.editor.commands.deleteTable()
          }
        }

        return false
      },
      Enter: () => {
        const { selection } = this.editor.state
        const { empty, $from } = selection

        if (!empty || !$from.parent.isTextblock) {
          return false
        }

        if (this.editor.isActive('heading') && $from.parent.textContent.trim().length === 0) {
          // 空标题回车后退回普通段落，避免一直卡在标题节点里。
          return this.editor.commands.clearNodes()
        }

        if (this.editor.isActive('blockquote') && $from.parent.textContent.trim().length === 0) {
          return this.editor.commands.clearNodes()
        }

        return false
      },
      Tab: () => {
        if (this.editor.isActive('bulletList') || this.editor.isActive('orderedList')) {
          return this.editor.commands.sinkListItem('listItem')
        }

        return false
      },
      'Shift-Tab': () => {
        if (this.editor.isActive('bulletList') || this.editor.isActive('orderedList')) {
          return this.editor.commands.liftListItem('listItem')
        }

        return false
      },
    }
  },
})

export default class TiptapCore {
  constructor(options = {}) {
    this.options = options
    this.editor = null
  }

  init() {
    this.editor = new Editor({
      content: this.options.content || '<p></p>',
      editable: !this.options.readOnly,
      extensions: [
        StarterKit.configure({
          gapcursor: false,
        }),
        WordLikeEditing,
        Underline,
        TextStyle,
        Color,
        FontFamily,
        FontSize,
        BackgroundColor,
        CommentAnchor,
        Placeholder.configure({
          placeholder: '',
          emptyEditorClass: 'is-editor-empty',
          emptyNodeClass: 'is-empty',
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
      ],
      autofocus: 'start',
      editorProps: {
        attributes: {
          class: 'gxjt-prosemirror',
        },
      },
      onUpdate: ({ editor }) => {
        this.options.onUpdate && this.options.onUpdate(editor)
      },
      onSelectionUpdate: ({ editor }) => {
        this.options.onSelectionUpdate && this.options.onSelectionUpdate(editor)
      },
      onFocus: ({ editor }) => {
        this.options.onSelectionUpdate && this.options.onSelectionUpdate(editor)
      },
      onCreate: ({ editor }) => {
        this.options.onCreate && this.options.onCreate(editor)
      },
    })

    return this.editor
  }

  getEditor() {
    return this.editor
  }

  setReadOnly(readOnly) {
    if (this.editor) {
      this.editor.setEditable(!readOnly)
    }
  }

  focus() {
    return this.editor ? this.editor.chain().focus() : null
  }

  getHTML() {
    return this.editor ? this.editor.getHTML() : ''
  }

  getText() {
    return this.editor ? this.editor.getText() : ''
  }

  setHTML(html) {
    if (this.editor) {
      this.editor.commands.setContent(html || '<p></p>')
    }
  }

  destroy() {
    if (this.editor) {
      this.editor.destroy()
      this.editor = null
    }
  }
}
