import { Mark, mergeAttributes } from '@tiptap/core'

export default Mark.create({
  name: 'commentAnchor',
  inclusive: false,
  excludes: '',

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.commentId) {
            return {}
          }

          return {
            'data-comment-id': attributes.commentId,
            class: 'comment-anchor',
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setCommentAnchor: attributes => ({ commands }) => commands.setMark(this.name, attributes),
      unsetCommentAnchor: () => ({ commands }) => commands.unsetMark(this.name),
    }
  },
})
