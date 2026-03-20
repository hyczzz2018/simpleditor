<template>
  <aside class="annotation-sidebar" :class="{ visible: visible }">
    <div class="annotation-header">
      <h3>批注</h3>
      <button class="toolbar-btn" @click="$emit('close')">关闭</button>
    </div>

    <div v-if="draftText" class="annotation-draft">
      <p class="annotation-label">新建批注</p>
      <p class="annotation-draft-inline">{{ draftText }}</p>
      <textarea
        :value="draftContent"
        class="annotation-textarea"
        placeholder="输入批注内容"
        @input="$emit('update-draft', $event.target.value)"
      />
      <div class="annotation-draft-actions">
        <button class="toolbar-btn" @click="$emit('reset-draft')">重置选择</button>
        <button class="toolbar-btn toolbar-btn--primary" @click="$emit('save')">添加批注</button>
      </div>
    </div>

    <div class="annotation-list">
      <div v-if="!annotations.length" class="annotation-empty">暂无批注</div>
      <article
        v-for="item in annotations"
        :key="item.id"
        class="annotation-card annotation-card--compact"
        :class="{
          'is-active': item.id === activeId,
          'is-hover': item.id === hoverId,
          'is-resolved': item.status === 'resolved',
        }"
        :data-comment-card-id="item.id"
        @click="$emit('activate', item.id)"
        @mouseenter="$emit('hover', item.id)"
        @mouseleave="$emit('leave', item.id)"
      >
        <div class="annotation-card-head">
          <div class="annotation-title-row">
            <p class="annotation-author">{{ item.author }}</p>
            <span class="annotation-status">{{ item.status === 'resolved' ? '已解决' : '处理中' }}</span>
          </div>
          <p class="annotation-time">{{ item.createdAt }}</p>
        </div>

        <p class="annotation-content">{{ item.content }}</p>
        <p v-if="item.quote" class="annotation-quote annotation-quote--compact">{{ item.quote }}</p>

        <div v-if="item.replies && item.replies.length" class="annotation-reply-summary">
          <button class="annotation-toggle-chip" @click.stop="toggleReplies(item.id)">
            {{ expandedRepliesId === item.id ? '收起回复' : `展开回复（${item.replies.length}）` }}
          </button>
        </div>

        <div v-if="item.replies && item.replies.length && expandedRepliesId === item.id" class="annotation-replies">
          <div v-for="reply in item.replies" :key="reply.id" class="annotation-reply">
            <p class="annotation-reply-author">{{ reply.author }}</p>
            <p class="annotation-reply-content">{{ reply.content }}</p>
            <p class="annotation-reply-time">{{ reply.createdAt }}</p>
          </div>
        </div>

        <div class="annotation-actions">
          <button class="annotation-action" @click.stop="toggleReply(item.id)">
            {{ replyingId === item.id ? '取消回复' : '回复' }}
          </button>
          <button class="annotation-action" @click.stop="$emit('resolve', item.id, item.status === 'resolved' ? 'open' : 'resolved')">
            {{ item.status === 'resolved' ? '重新打开' : '解决' }}
          </button>
          <button class="annotation-action annotation-action--danger" @click.stop="$emit('remove', item.id)">删除</button>
        </div>

        <div v-if="replyingId === item.id" class="annotation-reply-editor">
          <textarea
            v-model="replyDraft"
            class="annotation-textarea annotation-textarea--reply"
            placeholder="输入回复内容"
          />
          <button class="toolbar-btn toolbar-btn--primary" @click.stop="submitReply(item.id)">提交回复</button>
        </div>
      </article>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'AnnotationSystem',
  // 批注侧栏只负责展示和交互输入，真正的数据写入由外层统一处理。
  props: {
    visible: Boolean,
    activeId: String,
    hoverId: String,
    draftText: String,
    draftContent: String,
    annotations: {
      type: Array,
      default: function () {
        return []
      },
    },
  },
  data() {
    return {
      replyingId: '',
      expandedRepliesId: '',
      replyDraft: '',
    }
  },
  methods: {
    toggleReply(id) {
      // 回复编辑器同一时间只允许展开一条，避免侧栏同时出现多块输入框。
      if (this.replyingId === id) {
        this.replyingId = ''
        this.replyDraft = ''
        return
      }

      this.replyingId = id
      this.expandedRepliesId = id
      this.replyDraft = ''
    },
    toggleReplies(id) {
      // 回复列表和回复输入框是分开的：一个控制查看，一个控制编辑。
      this.expandedRepliesId = this.expandedRepliesId === id ? '' : id
    },
    submitReply(id) {
      // 提交后由父组件负责真正写入数据，这里只清理本地输入态。
      const content = this.replyDraft.trim()
      if (!content) {
        return
      }

      this.$emit('reply', id, content)
      this.expandedRepliesId = id
      this.replyDraft = ''
      this.replyingId = ''
    },
  },
}
</script>
