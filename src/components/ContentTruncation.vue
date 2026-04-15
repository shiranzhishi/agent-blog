<template>
  <div class="content-truncation">
    <div 
      class="content-preview"
      :class="{ 'content-truncated': isTruncated }"
    >
      {{ previewText }}
    </div>
    <a-button 
      v-if="isTruncated && showReadMore"
      type="link" 
      size="small"
      @click="handleReadMore"
      class="read-more-btn"
    >
      {{ readMoreText }}
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  content: string | null;
  maxLines?: number;
  maxLength?: number;
  showReadMore?: boolean;
  readMoreText?: string;
}

interface Emits {
  (e: 'readMore'): void;
}

const props = withDefaults(defineProps<Props>(), {
  maxLines: 3,
  maxLength: 150,
  showReadMore: true,
  readMoreText: '阅读更多...'
});

const emit = defineEmits<Emits>();

// 处理Markdown内容，转换为纯文本
const processMarkdownContent = (content: string) => {
  return content
    .replace(/#{1,6}\s+/g, '') // 移除标题标记
    .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
    .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
    .replace(/`(.*?)`/g, '$1') // 移除行内代码标记
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除链接，保留文本
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/```[\s\S]*?```/g, '[代码块]') // 替换代码块
    .replace(/\n+/g, ' ') // 替换换行为空格
    .trim();
};

// 计算预览文本
const previewText = computed(() => {
  if (!props.content) return '暂无内容';
  
  const plainText = processMarkdownContent(props.content);
  
  if (plainText.length <= props.maxLength) {
    return plainText;
  }
  
  return plainText.substring(0, props.maxLength) + '...';
});

// 判断内容是否被截断
const isTruncated = computed(() => {
  if (!props.content) return false;
  
  const plainText = processMarkdownContent(props.content);
  return plainText.length > props.maxLength;
});

// 处理"阅读更多"点击事件
const handleReadMore = () => {
  emit('readMore');
};
</script>

<style scoped>
.content-truncation {
  line-height: 1.6;
  color: #666;
}

.content-preview {
  margin-bottom: 8px;
}

.content-truncated {
  display: -webkit-box;
  -webkit-line-clamp: v-bind(maxLines);
  line-clamp: v-bind(maxLines);
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.6;
  max-height: calc(v-bind(maxLines) * 1.6em);
}

.read-more-btn {
  padding: 0;
  height: auto;
  font-size: 12px;
  color: #1890ff;
}
</style>