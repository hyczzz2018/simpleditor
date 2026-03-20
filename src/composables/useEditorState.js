export function getEditorMetrics(editor) {
  const text = editor ? editor.getText().trim() : ''

  return {
    text,
    charCount: text.length,
    wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0,
  }
}

export function getToolbarState(editor, fallback = {}) {
  if (!editor) {
    return {
      formats: {
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
      },
      currentBlock: fallback.currentBlock || 'paragraph',
      currentAlignment: fallback.currentAlignment || 'left',
      currentFontFamily: fallback.currentFontFamily || 'Microsoft YaHei',
      currentFontSize: fallback.currentFontSize || '16px',
      currentTextColor: fallback.currentTextColor || '#1f2937',
      currentBgColor: fallback.currentBgColor || '#ffffff',
    }
  }

  const textStyle = editor.getAttributes('textStyle') || {}
  const paragraphAttrs = editor.getAttributes('paragraph') || {}
  const headingAttrs = editor.getAttributes('heading') || {}

  let currentBlock = 'paragraph'
  if (editor.isActive('heading', { level: 1 })) currentBlock = 'h1'
  else if (editor.isActive('heading', { level: 2 })) currentBlock = 'h2'
  else if (editor.isActive('heading', { level: 3 })) currentBlock = 'h3'
  else if (editor.isActive('blockquote')) currentBlock = 'blockquote'

  return {
    formats: {
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      strikeThrough: editor.isActive('strike'),
    },
    currentBlock,
    currentAlignment: headingAttrs.textAlign || paragraphAttrs.textAlign || fallback.currentAlignment || 'left',
    currentFontFamily: textStyle.fontFamily || fallback.currentFontFamily || 'Microsoft YaHei',
    currentFontSize: textStyle.fontSize || fallback.currentFontSize || '16px',
    currentTextColor: textStyle.color || fallback.currentTextColor || '#1f2937',
    currentBgColor: textStyle.backgroundColor || fallback.currentBgColor || '#ffffff',
  }
}
