import JSZip from 'jszip'
import mammoth from 'mammoth'
import { saveAs } from 'file-saver'
import {
  AlignmentType,
  CommentRangeEnd,
  CommentRangeStart,
  CommentReference,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'

const CUSTOM_DRAFT_PATH = 'customXml/simpleditor.xml'
const LEGACY_CUSTOM_DRAFT_PATH = 'customXml/gxjt-editor-ui.xml'

async function loadZip(arrayBuffer) {
  // 兼容不同 jszip 版本的入口，避免导入 docx 时因 API 形态不同直接失败。
  if (typeof JSZip.loadAsync === 'function') {
    return JSZip.loadAsync(arrayBuffer)
  }

  const zip = new JSZip()
  if (typeof zip.loadAsync === 'function') {
    return zip.loadAsync(arrayBuffer)
  }

  if (typeof zip.load === 'function') {
    return zip.load(arrayBuffer)
  }

  throw new Error('当前环境不支持 docx 压缩包解析。')
}

async function readZipEntry(entry) {
  if (!entry) {
    return ''
  }

  if (typeof entry.async === 'function') {
    return entry.async('string')
  }

  if (typeof entry.asText === 'function') {
    return entry.asText()
  }

  if (typeof entry.asBinary === 'function') {
    return entry.asBinary()
  }

  throw new Error('当前环境不支持读取 docx 内部文件。')
}

function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

async function saveBlob(blob, options = {}) {
  const filename = options.filename || 'gxjt-editor.dat'
  const mimeType = options.mimeType || blob.type || 'application/octet-stream'
  const extension = options.extension || `.${filename.split('.').pop()}`
  const description = options.description || '导出文件'

  // 支持的浏览器优先走系统“另存为”，这样用户可以选择文件名和目录。
  if (typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        id: 'gxjt-editor-export',
        suggestedName: filename,
        types: [{
          description,
          accept: {
            [mimeType]: [extension],
          },
        }],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return true
    } catch (error) {
      if (error && error.name === 'AbortError') {
        return false
      }
      throw error
    }
  }

  saveAs(blob, filename)
  return true
}

function parseFontSize(value) {
  const matched = value && String(value).match(/([\d.]+)/)
  if (!matched) return undefined
  return Math.round(parseFloat(matched[1]) * 2)
}

function parseAlignment(element) {
  const raw = (element.style && element.style.textAlign) || element.getAttribute('align') || ''
  const map = {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
    justify: AlignmentType.JUSTIFIED,
  }
  return map[raw] || AlignmentType.LEFT
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function normalizeText(value) {
  return String(value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function plainParagraphsFromText(text) {
  const lines = normalizeText(text)
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)

  if (!lines.length) {
    return [new Paragraph('')]
  }

  return lines.map(line => new Paragraph({ children: [new TextRun(line)] }))
}

function serializeDraftPayload(html, annotations) {
  // 除了标准 Word 批注，这里额外写入一份项目快照，便于再次导回时完整恢复批注线程。
  const payload = JSON.stringify({
    version: 1,
    html,
    annotations: Array.isArray(annotations) ? annotations : [],
  })

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<gxjtDraft>${escapeXml(payload)}</gxjtDraft>`
}

function parseDraftPayload(xmlText) {
  if (!xmlText) {
    return null
  }

  const parser = new DOMParser()
  const xml = parser.parseFromString(xmlText, 'application/xml')
  const root = xml.documentElement
  if (!root || root.tagName !== 'gxjtDraft') {
    return null
  }

  const raw = root.textContent || ''
  if (!raw.trim()) {
    return null
  }

  return JSON.parse(raw)
}

function getInitials(author) {
  const value = String(author || '').trim()
  return value ? value.slice(0, 2).toUpperCase() : 'GX'
}

function parseCommentDate(value) {
  if (!value) {
    return new Date()
  }

  const direct = new Date(value)
  if (!Number.isNaN(direct.getTime())) {
    return direct
  }

  return new Date()
}

function createRun(text, marks = {}) {
  return new TextRun({
    text,
    bold: !!marks.bold,
    italics: !!marks.italic,
    underline: marks.underline ? {} : undefined,
    strike: !!marks.strike,
    color: marks.color,
    font: marks.fontFamily,
    size: parseFontSize(marks.fontSize),
  })
}

function collectInlineChildren(node, context, marks = {}) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || ''
    if (!text) return []
    return [createRun(text, marks)]
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return []
  }

  const element = node
  const tag = element.tagName.toLowerCase()

  if (tag === 'br') {
    return [new TextRun({ break: 1 })]
  }

  const nextMarks = { ...marks }
  if (tag === 'strong' || tag === 'b') nextMarks.bold = true
  if (tag === 'em' || tag === 'i') nextMarks.italic = true
  if (tag === 'u') nextMarks.underline = true
  if (tag === 's' || tag === 'strike') nextMarks.strike = true

  if (element.style) {
    if (element.style.color) nextMarks.color = element.style.color.replace('#', '')
    if (element.style.fontFamily) nextMarks.fontFamily = element.style.fontFamily.replace(/["']/g, '')
    if (element.style.fontSize) nextMarks.fontSize = element.style.fontSize
  }

  const children = Array.from(element.childNodes).flatMap(child => collectInlineChildren(child, context, nextMarks))
  const commentId = element.getAttribute('data-comment-id')
  const docCommentId = commentId ? context.commentIdMap.get(commentId) : undefined

  // 命中批注锚点时，需要在导出的 docx 中补齐 comment range 与 reference。
  if (docCommentId === undefined || !children.length) {
    return children
  }

  context.usedCommentIds.add(commentId)
  return [
    new CommentRangeStart(docCommentId),
    ...children,
    new CommentRangeEnd(docCommentId),
    new CommentReference(docCommentId),
  ]
}

function paragraphFromElement(element, context, options = {}) {
  const children = collectInlineChildren(element, context)
  return new Paragraph({
    children: children.length ? children : [new TextRun('')],
    heading: options.heading,
    alignment: parseAlignment(element),
    bullet: options.bullet ? { level: 0 } : undefined,
  })
}

function paragraphsFromContainer(element, context) {
  const directBlocks = Array.from(element.children).filter(child => /^(p|div|h1|h2|h3|blockquote)$/i.test(child.tagName))
  if (!directBlocks.length) {
    return [paragraphFromElement(element, context)]
  }

  return directBlocks.map(child => {
    const tag = child.tagName.toLowerCase()
    if (tag === 'h1') return paragraphFromElement(child, context, { heading: HeadingLevel.HEADING_1 })
    if (tag === 'h2') return paragraphFromElement(child, context, { heading: HeadingLevel.HEADING_2 })
    if (tag === 'h3') return paragraphFromElement(child, context, { heading: HeadingLevel.HEADING_3 })
    return paragraphFromElement(child, context)
  })
}

function buildCommentDefinitions(annotations, usedCommentIds, commentIdMap) {
  return (Array.isArray(annotations) ? annotations : [])
    .filter(item => usedCommentIds.has(item.id))
    .map(item => {
      const children = []

      if (item.content) {
        children.push(...plainParagraphsFromText(item.content))
      }

      if (item.replies && item.replies.length) {
        item.replies.forEach(reply => {
          const prefix = reply.author ? `${reply.author}：` : ''
          children.push(...plainParagraphsFromText(`${prefix}${reply.content || ''}`))
        })
      }

      if (item.status === 'resolved') {
        children.push(new Paragraph({ children: [new TextRun('状态：已解决')] }))
      }

      return {
        id: commentIdMap.get(item.id),
        author: item.author || '当前用户',
        initials: getInitials(item.author),
        date: parseCommentDate(item.createdAt),
        children: children.length ? children : [new Paragraph('')],
      }
    })
}

function blocksFromHtml(html, annotations = []) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html || '<p></p>', 'text/html')
  const commentIdMap = new Map((Array.isArray(annotations) ? annotations : []).map((item, index) => [item.id, index]))
  const usedCommentIds = new Set()
  const context = { commentIdMap, usedCommentIds }
  const blocks = []

  Array.from(doc.body.children).forEach(element => {
    const tag = element.tagName.toLowerCase()

    if (tag === 'h1') {
      blocks.push(paragraphFromElement(element, context, { heading: HeadingLevel.HEADING_1 }))
      return
    }
    if (tag === 'h2') {
      blocks.push(paragraphFromElement(element, context, { heading: HeadingLevel.HEADING_2 }))
      return
    }
    if (tag === 'h3') {
      blocks.push(paragraphFromElement(element, context, { heading: HeadingLevel.HEADING_3 }))
      return
    }
    if (tag === 'blockquote') {
      blocks.push(paragraphFromElement(element, context))
      return
    }
    if (tag === 'ul') {
      Array.from(element.querySelectorAll(':scope > li')).forEach(li => {
        blocks.push(paragraphFromElement(li, context, { bullet: true }))
      })
      return
    }
    if (tag === 'ol') {
      Array.from(element.querySelectorAll(':scope > li')).forEach((li, index) => {
        const children = [createRun(`${index + 1}. `), ...collectInlineChildren(li, context)]
        blocks.push(new Paragraph({ children: children.length ? children : [new TextRun('')] }))
      })
      return
    }
    if (tag === 'table') {
      const rows = Array.from(element.querySelectorAll('tr')).map(row => {
        const cells = Array.from(row.querySelectorAll(':scope > th, :scope > td')).map(cell => {
          return new TableCell({
            children: paragraphsFromContainer(cell, context),
          })
        })
        return new TableRow({ children: cells })
      })
      blocks.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
      }))
      return
    }

    blocks.push(paragraphFromElement(element, context))
  })

  return {
    children: blocks.length ? blocks : [new Paragraph('')],
    comments: buildCommentDefinitions(annotations, usedCommentIds, commentIdMap),
  }
}

export default class WordHandler {
  async importFile(file) {
    if (!file) {
      return ''
    }

    const name = file.name.toLowerCase()

    if (name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer()
      const zip = await loadZip(arrayBuffer)
      const embeddedDraft = zip.file(CUSTOM_DRAFT_PATH) || zip.file(LEGACY_CUSTOM_DRAFT_PATH)

      if (embeddedDraft) {
        try {
          const xmlText = await readZipEntry(embeddedDraft)
          const draft = parseDraftPayload(xmlText)
          if (draft && typeof draft.html === 'string') {
            return {
              html: draft.html || '<p></p>',
              annotations: Array.isArray(draft.annotations) ? draft.annotations : [],
            }
          }
        } catch (error) {
          // 项目快照损坏时仍然回退到普通正文解析，避免整个导入流程被拖死。
          console.warn('[Simpleditor] embedded draft payload is invalid, fallback to mammoth import', error)
        }
      }

      const result = await mammoth.convertToHtml({ arrayBuffer })
      return {
        html: result.value || '<p></p>',
        annotations: [],
      }
    }

    if (name.endsWith('.html') || name.endsWith('.htm') || file.type.includes('html')) {
      return readAsText(file)
    }

    if (name.endsWith('.txt') || file.type.includes('text/plain')) {
      const text = await readAsText(file)
      return text
        .split(/\n{2,}/)
        .map(line => `<p>${line.replace(/\n/g, '<br>')}</p>`)
        .join('')
    }

    if (name.endsWith('.doc')) {
      throw new Error('当前仅支持 docx 导入，旧版 doc 暂未接入解析。')
    }

    throw new Error('仅支持导入 html、htm、txt、docx 文件。')
  }

  async exportHtml(html, filename = 'gxjt-editor.html') {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    return saveBlob(blob, {
      filename,
      mimeType: 'text/html',
      extension: '.html',
      description: 'HTML 文档',
    })
  }

  async exportDocx(html, annotations = [], filename = 'gxjt-editor.docx') {
    const { children, comments } = blocksFromHtml(html, annotations)
    const doc = new Document({
      comments: { children: comments },
      sections: [{
        properties: {},
        children,
      }],
    })

    const overrides = [{
      path: CUSTOM_DRAFT_PATH,
      data: serializeDraftPayload(html, annotations),
    }]

    // overrides 会把项目快照一并打进 docx 压缩包，供本项目二次导入时恢复完整状态。
    const blob = await Packer.toBlob(doc, false, overrides)
    return saveBlob(blob, {
      filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: '.docx',
      description: 'Word 文档',
    })
  }
}
