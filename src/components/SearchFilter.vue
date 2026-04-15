<template>
  <a-card title="搜索过滤" class="search-filter-card" :class="{ 'search-filter-mobile': isMobile }">
    <a-form
      :model="localFilters"
      layout="vertical"
      @finish="handleSearch"
      class="responsive-search-form"
    >
      <a-row :gutter="[16, 8]" class="search-row">
        <!-- 标题搜索 -->
        <a-col :xs="24" :sm="12" :md="6" :lg="6">
          <a-form-item label="标题关键词" name="title" class="search-form-item">
            <a-input
              v-model:value="localFilters.title"
              placeholder="搜索标题..."
              allow-clear
              @change="handleRealTimeSearch"
              class="responsive-input"
            />
          </a-form-item>
        </a-col>

        <!-- 作者搜索 -->
        <a-col :xs="24" :sm="12" :md="6" :lg="6">
          <a-form-item label="作者" name="author" class="search-form-item">
            <a-input
              v-model:value="localFilters.author"
              placeholder="搜索作者..."
              allow-clear
              @change="handleRealTimeSearch"
              class="responsive-input"
            />
          </a-form-item>
        </a-col>

        <!-- 发布状态 -->
        <a-col :xs="24" :sm="12" :md="6" :lg="6">
          <a-form-item label="发布状态" name="published" class="search-form-item">
            <a-select
              v-model:value="localFilters.published"
              placeholder="选择状态"
              allow-clear
              @change="handleRealTimeSearch"
              class="responsive-select"
            >
              <a-select-option :value="true">已发布</a-select-option>
              <a-select-option :value="false">草稿</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>

        <!-- 时间范围 -->
        <a-col :xs="24" :sm="12" :md="6" :lg="6">
          <a-form-item label="发布时间" name="dateRange" class="search-form-item">
            <a-range-picker
              v-model:value="localFilters.dateRange"
              :placeholder="['开始日期', '结束日期']"
              format="YYYY-MM-DD"
              @change="handleRealTimeSearch"
              class="responsive-date-picker"
              :size="isMobile ? 'large' : 'middle'"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <!-- 操作按钮 -->
      <a-row justify="end" class="action-row">
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="action-buttons flex-mobile-column">
            <a-button @click="handleReset" class="reset-btn">
              重置
            </a-button>
            <a-button 
              type="primary" 
              html-type="submit"
              :loading="loading"
              class="search-btn"
            >
              搜索
            </a-button>
          </div>
        </a-col>
      </a-row>
    </a-form>

    <!-- 搜索结果统计 -->
    <div v-if="showResultStats" class="search-stats">
      <a-divider class="stats-divider" />
      <a-typography-text type="secondary" class="stats-text">
        {{ getSearchStatsText() }}
      </a-typography-text>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import type { Dayjs } from 'dayjs';

// 定义搜索过滤器接口
export interface SearchFilters {
  title?: string;
  author?: string;
  published?: boolean;
  dateRange?: [Dayjs, Dayjs] | null;
}

// 组件属性
interface Props {
  filters: SearchFilters;
  loading?: boolean;
  resultCount?: number;
  totalCount?: number;
  realTimeSearch?: boolean; // 是否启用实时搜索
}

// 组件事件
interface Emits {
  (e: 'update:filters', filters: SearchFilters): void;
  (e: 'search', filters: SearchFilters): void;
  (e: 'reset'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  resultCount: 0,
  totalCount: 0,
  realTimeSearch: true
});

const emit = defineEmits<Emits>();

// 本地过滤器状态
const localFilters = ref<SearchFilters>({ ...props.filters });

// 移动端检测
const isMobile = ref(false);

// 检测屏幕尺寸
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768;
};

// 监听窗口大小变化
const handleResize = () => {
  checkScreenSize();
};

// 实时搜索防抖定时器
const debounceTimer = ref<number | null>(null);

// 是否显示搜索结果统计
const showResultStats = computed(() => {
  return props.resultCount !== undefined && props.totalCount !== undefined;
});

// 监听外部过滤器变化
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters };
}, { deep: true });

// 获取搜索统计文本
const getSearchStatsText = () => {
  const hasActiveFilters = Object.values(localFilters.value).some(value => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null && value !== '';
  });

  if (!hasActiveFilters) {
    return `共 ${props.totalCount} 篇帖子`;
  }

  return `找到 ${props.resultCount} 篇帖子，共 ${props.totalCount} 篇`;
};

// 处理实时搜索
const handleRealTimeSearch = () => {
  if (!props.realTimeSearch) return;

  // 清除之前的定时器
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value);
  }

  // 设置新的防抖定时器
  debounceTimer.value = setTimeout(() => {
    handleSearch();
  }, 500); // 500ms 防抖
};

// 处理搜索
const handleSearch = () => {
  // 清理空值
  const cleanFilters: SearchFilters = {};
  
  if (localFilters.value.title?.trim()) {
    cleanFilters.title = localFilters.value.title.trim();
  }
  
  if (localFilters.value.author?.trim()) {
    cleanFilters.author = localFilters.value.author.trim();
  }
  
  if (localFilters.value.published !== undefined && localFilters.value.published !== null) {
    cleanFilters.published = localFilters.value.published;
  }
  
  if (localFilters.value.dateRange && localFilters.value.dateRange.length === 2) {
    cleanFilters.dateRange = localFilters.value.dateRange;
  }

  // 更新父组件的过滤器
  emit('update:filters', cleanFilters);
  emit('search', cleanFilters);
};

// 处理重置
const handleReset = () => {
  localFilters.value = {};
  emit('update:filters', {});
  emit('reset');
};

// 暴露方法给父组件
defineExpose({
  search: handleSearch,
  reset: handleReset
});

onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.search-filter-card {
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.responsive-search-form {
  width: 100%;
}

.search-row {
  margin-bottom: 16px;
}

.search-form-item {
  margin-bottom: 16px;
}

.responsive-input,
.responsive-select,
.responsive-date-picker {
  width: 100%;
}

.action-row {
  margin-bottom: 0;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.reset-btn,
.search-btn {
  min-width: 80px;
}

.search-stats {
  margin-top: 8px;
}

.stats-divider {
  margin: 16px 0 8px 0;
}

.stats-text {
  font-size: 14px;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .search-filter-card {
    margin-bottom: 16px;
    border-radius: 4px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }
  
  .search-filter-card :deep(.ant-card-body) {
    padding: 16px;
  }
  
  .search-filter-card :deep(.ant-card-head) {
    padding: 0 16px;
    min-height: 48px;
  }
  
  .search-filter-card :deep(.ant-card-head-title) {
    font-size: 16px;
  }
  
  .search-row {
    margin-bottom: 12px;
  }
  
  .search-form-item {
    margin-bottom: 12px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  
  .reset-btn,
  .search-btn {
    width: 100%;
    min-width: auto;
    height: 40px;
  }
  
  .responsive-input,
  .responsive-select {
    height: 40px;
    font-size: 16px; /* 防止iOS缩放 */
  }
  
  .responsive-date-picker {
    height: 40px;
  }
  
  .responsive-date-picker :deep(.ant-picker-input input) {
    font-size: 16px; /* 防止iOS缩放 */
  }
  
  .stats-divider {
    margin: 12px 0 6px 0;
  }
  
  .stats-text {
    font-size: 13px;
  }
}

/* 小屏幕设备 */
@media (max-width: 576px) {
  .search-filter-card :deep(.ant-card-body) {
    padding: 12px;
  }
  
  .search-filter-card :deep(.ant-card-head) {
    padding: 0 12px;
    min-height: 44px;
  }
  
  .search-filter-card :deep(.ant-card-head-title) {
    font-size: 15px;
  }
  
  .search-form-item {
    margin-bottom: 10px;
  }
  
  .action-buttons {
    gap: 6px;
  }
  
  .stats-text {
    font-size: 12px;
  }
}

/* 平板设备优化 */
@media (min-width: 768px) and (max-width: 1024px) {
  .action-buttons {
    flex-direction: row;
    justify-content: flex-end;
    width: auto;
  }
  
  .reset-btn,
  .search-btn {
    width: auto;
    min-width: 90px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .search-filter-card {
    margin-bottom: 32px;
  }
  
  .search-filter-card :deep(.ant-card-body) {
    padding: 24px;
  }
  
  .search-row {
    margin-bottom: 20px;
  }
  
  .search-form-item {
    margin-bottom: 20px;
  }
  
  .reset-btn,
  .search-btn {
    min-width: 100px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .reset-btn,
  .search-btn {
    min-height: 44px;
    padding: 8px 16px;
  }
  
  .responsive-input,
  .responsive-select {
    min-height: 44px;
  }
  
  .responsive-date-picker {
    min-height: 44px;
  }
}

/* 横屏模式优化 */
@media (orientation: landscape) and (max-height: 600px) {
  .search-filter-card :deep(.ant-card-body) {
    padding: 12px;
  }
  
  .search-form-item {
    margin-bottom: 8px;
  }
  
  .search-row {
    margin-bottom: 8px;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .search-filter-card {
    border: 2px solid #000;
  }
  
  .responsive-input,
  .responsive-select,
  .responsive-date-picker {
    border: 2px solid currentColor;
  }
}

/* 打印样式 */
@media print {
  .search-filter-card {
    display: none !important;
  }
}

/* 粘性搜索过滤器（移动端） */
.search-filter-mobile {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 表单标签优化 */
.search-form-item :deep(.ant-form-item-label) {
  padding-bottom: 4px;
}

.search-form-item :deep(.ant-form-item-label > label) {
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .search-form-item :deep(.ant-form-item-label > label) {
    font-size: 13px;
  }
}

/* 输入框聚焦状态优化 */
.responsive-input:focus,
.responsive-select:focus,
.responsive-date-picker:focus {
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 清除按钮优化 */
.responsive-input :deep(.ant-input-clear-icon),
.responsive-select :deep(.ant-select-clear) {
  font-size: 14px;
}

@media (max-width: 768px) {
  .responsive-input :deep(.ant-input-clear-icon),
  .responsive-select :deep(.ant-select-clear) {
    font-size: 16px;
  }
}
</style>