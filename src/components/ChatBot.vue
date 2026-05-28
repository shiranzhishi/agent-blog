<template>
  <!-- 右下角触发按钮 -->
  <div class="chatbot-trigger" v-show="!visible" @click="visible = true">
    <MessageOutlined class="trigger-icon" />
  </div>

  <!-- 聊天弹窗 -->
  <transition name="chatbot-fade">
    <div class="chatbot-panel" v-if="visible">
      <div class="chatbot-header">
        <span class="title">博客小助手</span>
        <a-tooltip title="清空对话">
          <ReloadOutlined class="header-icon" @click="clearMessages" />
        </a-tooltip>
        <CloseOutlined class="header-icon" @click="visible = false" />
      </div>

      <div ref="bodyRef" class="chatbot-body">
        <div v-if="messages.length === 0" class="empty-tip">
          你可以问我博客里的内容，例如<br />
          <span class="example" @click="sendQuick('Vue 性能优化')">"Vue 性能优化"</span>
          <span class="example" @click="sendQuick('JWT 鉴权怎么做')">"JWT 鉴权怎么做"</span>
        </div>

        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="msg"
          :class="msg.role"
        >
          <div class="bubble">
            <div class="content" v-text="msg.content" />
            <div v-if="msg.sources && msg.sources.length" class="sources">
              <div class="sources-title">相关文章：</div>
              <a
                v-for="s in msg.sources"
                :key="s.id"
                class="source-item"
                @click="goToPost(s.id)"
              >
                《{{ s.title }}》<span class="score">相似度 {{ s.score }}</span>
              </a>
            </div>
          </div>
        </div>

        <div v-if="loading" class="msg assistant">
          <div class="bubble loading-bubble">
            <LoadingOutlined /> 思考中...
          </div>
        </div>
      </div>

      <div class="chatbot-input">
        <a-input
          v-model:value="input"
          placeholder="输入问题，回车发送"
          :disabled="loading"
          @press-enter="send"
        />
        <a-button type="primary" :loading="loading" @click="send">
          发送
        </a-button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import {
  MessageOutlined,
  CloseOutlined,
  ReloadOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { chatAPI, type ChatSource } from '../services/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
}

const router = useRouter();

const visible = ref(false);
const input = ref('');
const loading = ref(false);
const messages = ref<ChatMessage[]>([]);
const bodyRef = ref<HTMLDivElement | null>(null);

// 滚到底部
const scrollToBottom = async () => {
  await nextTick();
  if (bodyRef.value) {
    bodyRef.value.scrollTop = bodyRef.value.scrollHeight;
  }
};

const send = async () => {
  const question = input.value.trim();
  if (!question || loading.value) return;

  messages.value.push({ role: 'user', content: question });
  input.value = '';
  loading.value = true;
  await scrollToBottom();

  try {
    const { data } = await chatAPI.ask(question, 3);
    messages.value.push({
      role: 'assistant',
      content: data.answer,
      sources: data.sources,
    });
  } catch (err: any) {
    messages.value.push({
      role: 'assistant',
      content: '抱歉，回答失败：' + (err?.response?.data?.error || err.message),
    });
    message.error('问答接口调用失败');
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};

const sendQuick = (text: string) => {
  input.value = text;
  send();
};

const clearMessages = () => {
  messages.value = [];
};

const goToPost = (id: number) => {
  router.push(`/posts/${id}`);
  visible.value = false;
};
</script>

<style scoped>
/* 触发按钮 */
.chatbot-trigger {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  z-index: 1000;
  transition: transform 0.2s;
}
.chatbot-trigger:hover {
  transform: scale(1.08);
}
.trigger-icon {
  font-size: 24px;
}

/* 弹窗 */
.chatbot-panel {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 360px;
  height: 520px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
}

.chatbot-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.chatbot-header .title {
  flex: 1;
  font-weight: 600;
}
.header-icon {
  cursor: pointer;
  opacity: 0.85;
  font-size: 16px;
}
.header-icon:hover {
  opacity: 1;
}

.chatbot-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f7f8fa;
}

.empty-tip {
  color: #888;
  font-size: 13px;
  text-align: center;
  margin-top: 40px;
  line-height: 1.8;
}
.example {
  display: inline-block;
  margin: 4px 6px;
  padding: 4px 10px;
  background: #e8eaff;
  color: #5567d3;
  border-radius: 12px;
  cursor: pointer;
}
.example:hover {
  background: #d6daff;
}

.msg {
  margin-bottom: 12px;
  display: flex;
}
.msg.user {
  justify-content: flex-end;
}
.msg .bubble {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
.msg.user .bubble {
  background: #5567d3;
  color: #fff;
}
.msg.assistant .bubble {
  background: #fff;
  color: #333;
  border: 1px solid #ececec;
}
.loading-bubble {
  color: #888;
}

.sources {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #eee;
}
.sources-title {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}
.source-item {
  display: block;
  font-size: 12px;
  color: #5567d3;
  padding: 2px 0;
  cursor: pointer;
}
.source-item:hover {
  text-decoration: underline;
}
.score {
  color: #aaa;
  margin-left: 4px;
  font-size: 11px;
}

.chatbot-input {
  border-top: 1px solid #eee;
  padding: 10px;
  display: flex;
  gap: 8px;
  background: #fff;
}

/* 进入/退出动画 */
.chatbot-fade-enter-active,
.chatbot-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.chatbot-fade-enter-from,
.chatbot-fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 移动端适配 */
@media (max-width: 480px) {
  .chatbot-panel {
    right: 12px;
    bottom: 12px;
    width: calc(100vw - 24px);
    height: 70vh;
  }
}
</style>
