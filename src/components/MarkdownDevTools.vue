<template>
  <div class="markdown-dev-tools">
    <!-- 切换按钮 -->
    <div class="dev-tools-toggle" @click="toggleVisibility">
      <a-button 
        type="primary" 
        shape="circle" 
        size="small"
        :title="isVisible ? '隐藏开发工具' : '显示开发工具 (Ctrl+Shift+D)'"
        class="toggle-button"
        :class="{ active: isVisible }"
      >
        <template #icon>
          <span v-if="isVisible">✕</span>
          <span v-else>🔧</span>
        </template>
      </a-button>
    </div>

    <!-- 开发工具面板 -->
    <a-card 
      v-show="isVisible"
      title="Markdown性能开发工具" 
      size="small"
      class="dev-tools-panel"
    >
      <template #extra>
        <a-space>
          <a-button 
            type="text" 
            size="small"
            @click="toggleMinimized"
            :title="isMinimized ? '展开' : '最小化'"
          >
            <template #icon>
              <span v-if="isMinimized">📖</span>
              <span v-else>📕</span>
            </template>
          </a-button>
          <a-button 
            type="text" 
            size="small"
            @click="toggleVisibility"
            title="关闭"
          >
            <template #icon>
              <span>✕</span>
            </template>
          </a-button>
        </a-space>
      </template>

      <a-space direction="vertical" style="width: 100%" v-show="!isMinimized">
        <!-- 性能统计 -->
        <a-card size="small" title="性能统计">
          <a-descriptions :column="2" size="small">
            <a-descriptions-item label="总渲染次数">
              {{ stats.totalRenders }}
            </a-descriptions-item>
            <a-descriptions-item label="缓存命中">
              {{ stats.cacheHits }}
            </a-descriptions-item>
            <a-descriptions-item label="缓存未命中">
              {{ stats.cacheMisses }}
            </a-descriptions-item>
            <a-descriptions-item label="缓存命中率">
              {{ cacheHitRate }}%
            </a-descriptions-item>
            <a-descriptions-item label="平均渲染时间">
              {{ stats.averageRenderTime }}ms
            </a-descriptions-item>
            <a-descriptions-item label="最大渲染时间">
              {{ stats.maxRenderTime }}ms
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- 缓存信息 -->
        <a-card size="small" title="缓存信息">
          <a-descriptions :column="2" size="small">
            <a-descriptions-item label="缓存大小">
              {{ cacheStats.size }} / {{ cacheStats.maxSize }}
            </a-descriptions-item>
            <a-descriptions-item label="过期时间">
              {{ Math.round(cacheStats.expiryTime / 1000 / 60) }}分钟
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- 测试工具 -->
        <a-card size="small" title="测试工具">
          <template #extra>
            <a-tooltip title="快捷键: Ctrl/Cmd + Shift + D">
              <a-button type="text" size="small" icon="question-circle" />
            </a-tooltip>
          </template>
          <a-space wrap>
            <a-button 
              type="primary" 
              size="small"
              @click="runPerformanceTest"
              :loading="testLoading"
            >
              性能测试
            </a-button>
            <a-button 
              size="small"
              @click="runCacheTest"
              :loading="testLoading"
            >
              缓存测试
            </a-button>
            <a-button 
              size="small"
              @click="clearCache"
            >
              清除缓存
            </a-button>
            <a-button 
              size="small"
              @click="clearMetrics"
            >
              清除指标
            </a-button>
            <a-button 
              size="small"
              @click="exportReport"
            >
              导出报告
            </a-button>
          </a-space>
        </a-card>

        <!-- 测试结果 -->
        <a-card 
          v-if="testResults" 
          size="small" 
          title="测试结果"
        >
          <pre class="test-results">{{ testResults }}</pre>
        </a-card>

        <!-- 实时渲染测试 -->
        <a-card size="small" title="实时渲染测试">
          <a-textarea
            v-model:value="testContent"
            placeholder="输入Markdown内容进行实时测试..."
            :rows="4"
            @input="onContentChange"
          />
          <div class="render-preview" v-if="renderedContent">
            <OptimizedMarkdownRenderer 
              :content="testContent"
              :show-loading="false"
              :enable-cache="true"
            />
          </div>
        </a-card>
      </a-space>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import { markdownCache } from '../services/markdownCache';
import { performanceMonitor } from '../services/performanceMonitor';
import { testMarkdownPerformance, testCacheFunction } from '../utils/markdownTest';
import OptimizedMarkdownRenderer from './OptimizedMarkdownRenderer.vue';

// 响应式数据
const stats = ref({
  totalRenders: 0,
  cacheHits: 0,
  cacheMisses: 0,
  averageRenderTime: 0,
  maxRenderTime: 0,
  minRenderTime: 0,
  totalRenderTime: 0
});

const cacheStats = ref({
  size: 0,
  maxSize: 0,
  expiryTime: 0
});

const cacheHitRate = ref(0);
const testLoading = ref(false);
const testResults = ref('');
const testContent = ref(`# 测试标题

这是一个**测试文档**，用于验证Markdown渲染功能。

## 代码示例

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

- 列表项 1
- 列表项 2`);

const renderedContent = ref('');
const updateInterval = ref<number | null>(null);

// 控制显隐的状态
const isVisible = ref(false);
const isMinimized = ref(false);

// 从本地存储加载状态
const loadState = () => {
  try {
    const savedState = localStorage.getItem('markdown-dev-tools-state');
    if (savedState) {
      const state = JSON.parse(savedState);
      isVisible.value = state.isVisible || false;
      isMinimized.value = state.isMinimized || false;
    }
  } catch (error) {
    console.warn('Failed to load dev tools state:', error);
  }
};

// 保存状态到本地存储
const saveState = () => {
  try {
    const state = {
      isVisible: isVisible.value,
      isMinimized: isMinimized.value
    };
    localStorage.setItem('markdown-dev-tools-state', JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save dev tools state:', error);
  }
};

// 切换显隐
const toggleVisibility = () => {
  isVisible.value = !isVisible.value;
  if (isVisible.value) {
    isMinimized.value = false; // 显示时重置最小化状态
  }
  saveState();
};

// 切换最小化
const toggleMinimized = () => {
  isMinimized.value = !isMinimized.value;
  saveState();
};

// 更新统计信息
const updateStats = () => {
  stats.value = performanceMonitor.getStats();
  cacheStats.value = markdownCache.getCacheStats();
  cacheHitRate.value = performanceMonitor.getCacheHitRate();
};

// 运行性能测试
const runPerformanceTest = async () => {
  testLoading.value = true;
  try {
    const result = testMarkdownPerformance();
    testResults.value = JSON.stringify(result, null, 2);
    message.success('性能测试完成');
    updateStats();
  } catch (error) {
    console.error('性能测试失败:', error);
    message.error('性能测试失败');
  } finally {
    testLoading.value = false;
  }
};

// 运行缓存测试
const runCacheTest = async () => {
  testLoading.value = true;
  try {
    const result = testCacheFunction();
    testResults.value = JSON.stringify(result, null, 2);
    message.success('缓存测试完成');
    updateStats();
  } catch (error) {
    console.error('缓存测试失败:', error);
    message.error('缓存测试失败');
  } finally {
    testLoading.value = false;
  }
};

// 清除缓存
const clearCache = () => {
  markdownCache.clearCache();
  message.success('缓存已清除');
  updateStats();
};

// 清除指标
const clearMetrics = () => {
  performanceMonitor.clearMetrics();
  message.success('性能指标已清除');
  updateStats();
};

// 导出报告
const exportReport = () => {
  try {
    const report = performanceMonitor.exportReport();
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markdown-performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('报告已导出');
  } catch (error) {
    console.error('导出报告失败:', error);
    message.error('导出报告失败');
  }
};

// 内容变化处理
const onContentChange = () => {
  // 防抖处理
  if (testContent.value) {
    renderedContent.value = markdownCache.render(testContent.value);
    updateStats();
  }
};

// 组件挂载
onMounted(() => {
  // 加载保存的状态
  loadState();
  
  updateStats();
  
  // 定期更新统计信息
  updateInterval.value = window.setInterval(() => {
    updateStats();
  }, 2000);

  // 添加键盘快捷键支持 (Ctrl/Cmd + Shift + D)
  const handleKeydown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
      event.preventDefault();
      toggleVisibility();
    }
  };

  document.addEventListener('keydown', handleKeydown);
  
  // 保存清理函数
  (updateInterval as any).keydownHandler = handleKeydown;
});

// 组件卸载
onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
  }
  
  // 移除键盘事件监听
  if ((updateInterval as any).keydownHandler) {
    document.removeEventListener('keydown', (updateInterval as any).keydownHandler);
  }
});
</script>

<style scoped>
.markdown-dev-tools {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.dev-tools-toggle {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1001;
}

.dev-tools-panel {
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 40px;
}

.test-results {
  background: #f6f8fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.render-preview {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #fafafa;
  max-height: 200px;
  overflow-y: auto;
}

/* 切换按钮样式 */
.dev-tools-toggle .ant-btn {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: none;
  transition: all 0.2s ease;
}

.dev-tools-toggle .ant-btn:hover {
  transform: scale(1.1);
}

.dev-tools-toggle .ant-btn.active {
  background-color: #52c41a;
  border-color: #52c41a;
}

.dev-tools-toggle .ant-btn.active:hover {
  background-color: #73d13d;
  border-color: #73d13d;
}

/* 面板动画 */
.dev-tools-panel {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .markdown-dev-tools {
    position: relative;
    width: 100%;
    margin: 16px 0;
    top: auto;
    right: auto;
  }
  
  .dev-tools-panel {
    width: 100%;
    margin-top: 8px;
  }
  
  .dev-tools-toggle {
    position: relative;
    margin-bottom: 8px;
  }
}

/* 统计数据样式优化 */
:deep(.ant-descriptions-item-label) {
  font-weight: 500;
  color: #666;
}

:deep(.ant-descriptions-item-content) {
  font-weight: 600;
  color: #333;
}

/* 测试按钮组样式 */
:deep(.ant-space-item .ant-btn) {
  margin-right: 8px;
}

:deep(.ant-space-item:last-child .ant-btn) {
  margin-right: 0;
}
</style>