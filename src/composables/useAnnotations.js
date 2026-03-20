function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function createTimestamp() {
  return new Date().toISOString()
}

export function createAnnotationState() {
  // 批注模块的最小状态单元：侧栏开关、当前激活项、草稿区和批注列表。
  return {
    visible: true,
    activeId: '',
    draft: {
      text: '',
      content: '',
      from: 0,
      to: 0,
    },
    items: [],
  }
}

export function updateAnnotationSelection(state, payload) {
  state.draft.text = payload && payload.text ? payload.text : ''
  state.draft.from = payload && payload.from ? payload.from : 0
  state.draft.to = payload && payload.to ? payload.to : 0
}

export function updateAnnotationDraft(state, content) {
  state.draft.content = content || ''
}

export function loadAnnotations(state, items) {
  // 导入或恢复草稿时统一走这里，顺手校正 activeId，避免指向已不存在的批注。
  state.items = Array.isArray(items) ? items : []
  if (!state.items.find(item => item.id === state.activeId)) {
    state.activeId = state.items[0] ? state.items[0].id : ''
  }
}

export function saveAnnotation(state, payload = {}) {
  // 新建批注时直接记录选区范围，后续由编辑器 mark 负责把锚点落到正文中。
  const item = {
    id: createId('comment'),
    quote: state.draft.text,
    content: state.draft.content,
    from: state.draft.from,
    to: state.draft.to,
    author: payload.author || '当前用户',
    status: 'open',
    replies: [],
    createdAt: createTimestamp(),
  }
  state.items.unshift(item)
  state.activeId = item.id
  state.draft = { text: '', content: '', from: 0, to: 0 }
  return item
}

export function replyAnnotation(state, id, content, author = '当前用户') {
  // 回复只追加到线程，不改变原批注锚点。
  const item = state.items.find(entry => entry.id === id)
  if (!item) {
    return null
  }

  const reply = {
    id: createId('reply'),
    author,
    content,
    createdAt: createTimestamp(),
  }

  item.replies.push(reply)
  state.activeId = id
  return reply
}

export function setAnnotationStatus(state, id, status) {
  // 解决/重新打开只改状态字段，正文高亮样式由外层根据状态切换。
  const item = state.items.find(entry => entry.id === id)
  if (!item) {
    return null
  }

  item.status = status
  state.activeId = id
  return item
}

export function removeAnnotation(state, id) {
  state.items = state.items.filter(item => item.id !== id)
  if (state.activeId === id) {
    state.activeId = state.items[0] ? state.items[0].id : ''
  }
}

export function activateAnnotation(state, id) {
  state.activeId = id || ''
}

export function resetAnnotationDraft(state) {
  state.draft = { text: '', content: '', from: 0, to: 0 }
}
