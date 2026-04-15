<template>
  <div 
    class="optimized-markdown-renderer"
    :class="{ 'loading': isRendering }"
  >
    <!-- 加载状态 -->
    <div v-if="isRendering && showLoading" class="markdown-loading">
      <a-spin size="small" />
      <span class="loading-text">渲染中...</span>
    </div>
    
    <!-- 渲染内容 -->
    <div 
      v-show="!isRendering || !showLoading"
      class="markdown-content"
      :class="themeClass"
      v-html="renderedHtml"
    />
    
    <!-- 错误状态 -->
    <div v-if="renderError" class="markdown-error">
      <a-alert
        message="Markdown渲染失败"
        :description="renderError"
        type="error"
        show-icon
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { markdownCache } from '../services/markdownCache';
import hljs from 'highlight.js';
// 确保 highlight.js 样式被加载
import 'highlight.js/styles/github.css';

// Props定义
interface Props {
  content: string;
  theme?: 'light' | 'dark';
  showLoading?: boolean;
  debounceTime?: number;
  enableCache?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  theme: 'light',
  showLoading: true,
  debounceTime: 300,
  enableCache: true
});

// 响应式数据
const renderedHtml = ref('');
const isRendering = ref(false);
const renderError = ref('');
const renderTimeoutId = ref<number | null>(null);

// 计算属性
const themeClass = computed(() => `markdown-theme-${props.theme}`);

// 防抖渲染函数
const debouncedRender = () => {
  if (renderTimeoutId.value) {
    clearTimeout(renderTimeoutId.value);
  }

  renderTimeoutId.value = window.setTimeout(() => {
    renderMarkdown();
  }, props.debounceTime);
};

// 渲染Markdown内容
const renderMarkdown = async () => {
  if (!props.content) {
    renderedHtml.value = '';
    return;
  }

  isRendering.value = true;
  renderError.value = '';

  try {
    // 使用requestIdleCallback优化渲染时机
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        performRender();
      });
    } else {
      // 降级到setTimeout
      setTimeout(() => {
        performRender();
      }, 0);
    }
  } catch (error) {
    console.error('Markdown渲染错误:', error);
    renderError.value = error instanceof Error ? error.message : '未知错误';
    isRendering.value = false;
  }
};

// 执行实际渲染
const performRender = () => {
  try {
    if (props.enableCache) {
      renderedHtml.value = markdownCache.render(props.content);
    } else {
      // 直接使用markdown-it实例渲染（不缓存）
      const md = markdownCache.getMarkdownInstance();
      renderedHtml.value = md.render(props.content);
    }
    
    nextTick(() => {
      isRendering.value = false;
      // 触发代码高亮后处理
      highlightCodeBlocks();
    });
  } catch (error) {
    console.error('Markdown渲染执行错误:', error);
    renderError.value = error instanceof Error ? error.message : '渲染失败';
    isRendering.value = false;
  }
};

// 代码块高亮后处理
const highlightCodeBlocks = () => {
  nextTick(() => {
    // 获取当前组件内的代码块
    const container = document.querySelector('.optimized-markdown-renderer .markdown-content');
    if (!container) return;

    // 使用 highlight.js 处理代码块
    const codeBlocks = container.querySelectorAll('pre.hljs code.hljs');
    codeBlocks.forEach((block) => {
      const codeElement = block as HTMLElement;
      
      // 如果还没有被高亮过
      if (!codeElement.dataset.highlighted) {
        try {
          // 获取语言信息
          const preElement = codeElement.parentElement;
          const dataLang = preElement?.getAttribute('data-language');
          const classLang = Array.from(codeElement.classList)
            .find(cls => cls.startsWith('language-'))
            ?.replace('language-', '');
          
          const language = dataLang || classLang;
          
          if (language && language !== 'text' && hljs.getLanguage(language)) {
            // 指定语言高亮
            const result = hljs.highlight(codeElement.textContent || '', { language });
            codeElement.innerHTML = result.value;
          } else {
            // 自动检测语言
            const result = hljs.highlightAuto(codeElement.textContent || '');
            codeElement.innerHTML = result.value;
          }
          
          // 标记为已高亮
          codeElement.dataset.highlighted = 'true';
        } catch (error) {
          console.warn('代码高亮失败:', error);
          // 标记为已处理，避免重复尝试
          codeElement.dataset.highlighted = 'true';
        }
      }
    });

    // 为代码块添加复制按钮
    const preBlocks = container.querySelectorAll('pre.hljs');
    preBlocks.forEach((block) => {
      if (!block.querySelector('.copy-button')) {
        addCopyButton(block as HTMLElement);
      }
    });

    // 为表格添加响应式包装
    const tables = container.querySelectorAll('.table-wrapper');
    tables.forEach((wrapper) => {
      if (!wrapper.classList.contains('responsive-table')) {
        wrapper.classList.add('responsive-table');
      }
    });
  });
};

// 添加复制按钮到代码块
const addCopyButton = (codeBlock: HTMLElement) => {
  const copyButton = document.createElement('button');
  copyButton.className = 'copy-button';
  copyButton.innerHTML = '复制';
  copyButton.title = '复制代码';
  
  copyButton.addEventListener('click', async () => {
    const code = codeBlock.querySelector('code');
    if (code) {
      try {
        await navigator.clipboard.writeText(code.textContent || '');
        copyButton.innerHTML = '已复制';
        copyButton.classList.add('copied');
        
        setTimeout(() => {
          copyButton.innerHTML = '复制';
          copyButton.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('复制失败:', err);
        copyButton.innerHTML = '复制失败';
        setTimeout(() => {
          copyButton.innerHTML = '复制';
        }, 2000);
      }
    }
  });

  // 检查是否已经有包装器
  if (codeBlock.parentElement?.classList.contains('code-block-wrapper')) {
    // 如果已经有包装器，直接添加按钮
    codeBlock.parentElement.appendChild(copyButton);
  } else {
    // 创建新的包装器
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    
    // 获取语言信息
    const langAttr = codeBlock.getAttribute('data-language');
    if (langAttr) {
      wrapper.setAttribute('data-language', langAttr);
    }
    
    codeBlock.parentNode?.insertBefore(wrapper, codeBlock);
    wrapper.appendChild(codeBlock);
    wrapper.appendChild(copyButton);
  }
};

// 监听内容变化
watch(
  () => props.content,
  () => {
    debouncedRender();
  },
  { immediate: true }
);

// 监听主题变化
watch(
  () => props.theme,
  () => {
    // 主题变化时重新渲染（如果需要）
    nextTick(() => {
      highlightCodeBlocks();
    });
  }
);

// 组件挂载时的处理
onMounted(() => {
  if (props.content) {
    renderMarkdown();
  }
});

// 组件卸载时清理
onUnmounted(() => {
  if (renderTimeoutId.value) {
    clearTimeout(renderTimeoutId.value);
  }
});

// 暴露方法给父组件
defineExpose({
  rerender: renderMarkdown,
  clearCache: () => markdownCache.clearCache(),
  getCacheStats: () => markdownCache.getCacheStats()
});
</script>

<style scoped>
.optimized-markdown-renderer {
  position: relative;
  min-height: 20px;
}

.markdown-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #8c8c8c;
}

.loading-text {
  margin-left: 8px;
  font-size: 14px;
}

.markdown-error {
  margin: 16px 0;
}

.markdown-content {
  line-height: 1.8;
  color: #262626;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 浅色主题样式 */
.markdown-theme-light {
  background-color: transparent;
}

/* 深色主题样式 */
.markdown-theme-dark {
  background-color: #1f1f1f;
  color: #e6e6e6;
}

.markdown-theme-dark :deep(h1),
.markdown-theme-dark :deep(h2),
.markdown-theme-dark :deep(h3),
.markdown-theme-dark :deep(h4),
.markdown-theme-dark :deep(h5),
.markdown-theme-dark :deep(h6) {
  color: #ffffff;
}

.markdown-theme-dark :deep(blockquote) {
  background-color: #2d2d2d;
  border-left-color: #4096ff;
}

.markdown-theme-dark :deep(.hljs) {
  background-color: #2d2d2d !important;
}
</style>

<style>
/* 全局样式 - Markdown内容 */
.optimized-markdown-renderer .markdown-content h1 {
  font-size: 28px;
  font-weight: 600;
  margin-top: 32px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 8px;
  color: #262626;
}

.optimized-markdown-renderer .markdown-content h1:first-child {
  margin-top: 0;
}

.optimized-markdown-renderer .markdown-content h2 {
  font-size: 24px;
  font-weight: 600;
  margin-top: 24px;
  margin-bottom: 12px;
  color: #262626;
}

.optimized-markdown-renderer .markdown-content h3 {
  font-size: 20px;
  font-weight: 600;
  margin-top: 20px;
  margin-bottom: 10px;
  color: #262626;
}

.optimized-markdown-renderer .markdown-content h4,
.optimized-markdown-renderer .markdown-content h5,
.optimized-markdown-renderer .markdown-content h6 {
  font-weight: 600;
  margin-top: 16px;
  margin-bottom: 8px;
  color: #262626;
}

.optimized-markdown-renderer .markdown-content p {
  margin-bottom: 16px;
  line-height: 1.8;
}

.optimized-markdown-renderer .markdown-content blockquote {
  border-left: 4px solid #1890ff;
  padding-left: 16px;
  margin: 16px 0;
  background-color: #f6f8fa;
  padding: 16px;
  border-radius: 4px;
  color: #595959;
}

.optimized-markdown-renderer .markdown-content ul,
.optimized-markdown-renderer .markdown-content ol {
  margin: 16px 0;
  padding-left: 24px;
}

.optimized-markdown-renderer .markdown-content li {
  margin-bottom: 4px;
  line-height: 1.6;
}

.optimized-markdown-renderer .markdown-content code {
  background-color: #f6f8fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
  color: #d73a49;
}

/* 代码块样式 */
.optimized-markdown-renderer .code-block-wrapper {
  position: relative;
  margin: 16px 0;
}

.optimized-markdown-renderer .code-block-wrapper .copy-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #d0d7de;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 1;
}

.optimized-markdown-renderer .code-block-wrapper .copy-button:hover {
  background: #ffffff;
  border-color: #1890ff;
  color: #1890ff;
}

.optimized-markdown-renderer .code-block-wrapper .copy-button.copied {
  background: #52c41a;
  border-color: #52c41a;
  color: white;
}

.optimized-markdown-renderer .markdown-content pre.hljs {
  background-color: #f6f8fa;
  padding: 32px 16px 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid #e1e4e8;
}

.optimized-markdown-renderer .markdown-content pre.hljs code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: inherit;
  border-radius: 0;
}

/* 深色主题下的代码块样式 */
.markdown-theme-dark .markdown-content pre.hljs {
  background-color: #2d2d2d !important;
  border-color: #444444;
}

/* 确保 highlight.js 的语法高亮样式正确应用 */
.optimized-markdown-renderer .markdown-content .hljs {
  display: block;
  overflow-x: auto;
}

/* 语言标签样式 */
.optimized-markdown-renderer .code-block-wrapper[data-language]::before {
  content: attr(data-language);
  position: absolute;
  top: 8px;
  left: 12px;
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  font-weight: 500;
}

/* 表格样式 */
.optimized-markdown-renderer .table-wrapper {
  overflow-x: auto;
  margin: 16px 0;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.optimized-markdown-renderer .markdown-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
}

.optimized-markdown-renderer .markdown-table th,
.optimized-markdown-renderer .markdown-table td {
  border: none;
  border-bottom: 1px solid #e8e8e8;
  padding: 12px 16px;
  text-align: left;
}

.optimized-markdown-renderer .markdown-table th {
  background-color: #fafafa;
  font-weight: 600;
  color: #262626;
}

.optimized-markdown-renderer .markdown-table tr:last-child td {
  border-bottom: none;
}

.optimized-markdown-renderer .markdown-table tr:hover {
  background-color: #f5f5f5;
}

/* 响应式表格 */
@media (max-width: 768px) {
  .optimized-markdown-renderer .responsive-table {
    font-size: 14px;
  }
  
  .optimized-markdown-renderer .markdown-table th,
  .optimized-markdown-renderer .markdown-table td {
    padding: 8px 12px;
  }
}

/* 链接样式 */
.optimized-markdown-renderer .markdown-content a {
  color: #1890ff;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

.optimized-markdown-renderer .markdown-content a:hover {
  border-bottom-color: #1890ff;
}

/* 图片样式 */
.optimized-markdown-renderer .markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 8px 0;
}

/* 分割线样式 */
.optimized-markdown-renderer .markdown-content hr {
  border: none;
  border-top: 1px solid #e8e8e8;
  margin: 24px 0;
}
</style>