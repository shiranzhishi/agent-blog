<template>
  <div class="post-detail responsive-container">
    <a-page-header 
      title="帖子详情" 
      @back="handleBack"
      :show-back="true"
      class="responsive-page-header"
    >
      <template #extra>
        <div class="header-actions">
          <a-button 
            v-if="canEditPost"
            type="primary"
            @click="handleEdit"
            class="edit-btn"
          >
            编辑
          </a-button>
        </div>
      </template>
    </a-page-header>
    
    <a-spin :spinning="loading">
      <a-alert
        v-if="error"
        :message="error"
        type="error"
        show-icon
        closable
        @close="error = ''"
        class="error-alert"
      />
      
      <a-card v-if="post" class="post-content-card">
        <!-- 帖子标题 -->
        <a-typography-title :level="1" class="post-title responsive-text">
          {{ post.title }}
        </a-typography-title>
        
        <!-- 帖子元信息 -->
        <div class="post-meta responsive-padding">
          <div class="meta-content flex-mobile-column">
            <div class="author-info">
              <a-avatar
                :size="isMobile ? 28 : 32"
                :src="post.author.avatar ? `http://localhost:3000${post.author.avatar}` : undefined"
                :style="!post.author.avatar ? { backgroundColor: '#87d068' } : {}"
              >
                <template #icon v-if="!post.author.avatar">
                  <UserOutlined />
                </template>
              </a-avatar>
              <span class="author-name">{{ post.author.name || post.author.email }}</span>
            </div>
            <div class="post-status-info">
              <a-tag :color="post.published ? 'green' : 'orange'" :size="isMobile ? 'small' : 'default'">
                {{ post.published ? '已发布' : '草稿' }}
              </a-tag>
              <span class="post-date">{{ formatDate(post.createdAt) }}</span>
              <span v-if="post.updatedAt !== post.createdAt" class="post-updated">
                （更新于 {{ formatDate(post.updatedAt) }}）
              </span>
            </div>
          </div>
        </div>
        
        <a-divider class="content-divider" />
        
        <!-- 帖子内容 - 优化的Markdown渲染 -->
        <div class="post-content responsive-padding">
          <OptimizedMarkdownRenderer 
            v-if="post.content"
            :content="post.content"
            :theme="'light'"
            :show-loading="true"
            :enable-cache="true"
            class="responsive-markdown"
          />
          <a-empty 
            v-else
            description="暂无内容"
            :image="false"
            class="empty-content"
          />
        </div>
      </a-card>
      
      <!-- 帖子不存在的情况 -->
      <a-result
        v-else-if="!loading && !error"
        status="404"
        title="帖子不存在"
        sub-title="抱歉，您访问的帖子不存在或已被删除。"
        class="not-found-result"
      >
        <template #extra>
          <a-button type="primary" @click="handleBack" class="back-btn">
            返回列表
          </a-button>
        </template>
      </a-result>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { UserOutlined } from '@ant-design/icons-vue';
import OptimizedMarkdownRenderer from '../components/OptimizedMarkdownRenderer.vue';
import { postAPI, type Post } from '../services/api';
import { useAuthStore } from '../stores/authStore';

// 路由和状态管理
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// 响应式数据
const post = ref<Post | null>(null);
const loading = ref(false);
const error = ref('');

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

// 计算属性
const canEditPost = computed(() => {
  if (!post.value || !authStore.isAuthenticated) return false;
  return authStore.isAdmin || post.value.authorId === authStore.user?.id;
});

// 获取帖子详情
const fetchPost = async (id: number) => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await postAPI.getById(id);
    post.value = response.data;
  } catch (err: any) {
    console.error('获取帖子详情失败:', err);
    if (err.response?.status === 404) {
      error.value = '帖子不存在';
    } else {
      error.value = '获取帖子详情失败，请重试';
    }
  } finally {
    loading.value = false;
  }
};

// 返回列表页
const handleBack = () => {
  router.push('/posts');
};

// 编辑帖子
const handleEdit = () => {
  if (post.value) {
    // 这里可以跳转到编辑页面，目前先跳转到创建页面
    // 后续可以实现编辑功能
    router.push(`/posts/${post.value.id}/edit`);
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 组件挂载时获取帖子详情
onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', handleResize);
  
  const postId = parseInt(route.params.id as string);
  if (postId && !isNaN(postId)) {
    fetchPost(postId);
  } else {
    error.value = '无效的帖子ID';
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.post-detail {
  width: 100%;
  padding: 24px 0;
}

.responsive-page-header {
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.edit-btn {
  min-width: 80px;
}

.error-alert {
  margin-bottom: 24px;
}

.post-content-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.post-title {
  margin-bottom: 16px !important;
  color: #262626;
  word-wrap: break-word;
  word-break: break-word;
}

.post-meta {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 6px;
}

.meta-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-weight: 600;
  color: #262626;
  font-size: 14px;
}

.post-status-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.post-date,
.post-updated {
  color: #8c8c8c;
  font-size: 14px;
  white-space: nowrap;
}

.content-divider {
  margin: 24px 0;
}

.post-content {
  min-height: 200px;
  line-height: 1.8;
}

.responsive-markdown {
  width: 100%;
}

.empty-content {
  padding: 40px 0;
}

.not-found-result {
  padding: 40px 0;
}

.back-btn {
  min-width: 100px;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .post-detail {
    padding: 16px 0;
  }
  
  .responsive-page-header {
    margin-bottom: 16px;
  }
  
  .post-content-card {
    border-radius: 4px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }
  
  .post-content-card :deep(.ant-card-body) {
    padding: 16px;
  }
  
  .post-title {
    font-size: 24px !important;
    line-height: 1.3 !important;
    margin-bottom: 12px !important;
  }
  
  .post-meta {
    padding: 12px;
    margin-bottom: 16px;
  }
  
  .meta-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .author-info {
    width: 100%;
  }
  
  .post-status-info {
    width: 100%;
    justify-content: flex-start;
  }
  
  .content-divider {
    margin: 16px 0;
  }
  
  .post-content {
    min-height: 150px;
    line-height: 1.6;
  }
  
  .edit-btn {
    width: 100%;
    min-width: auto;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .empty-content {
    padding: 20px 0;
  }
  
  .not-found-result {
    padding: 20px 0;
  }
  
  .back-btn {
    width: 100%;
    min-width: auto;
  }
}

/* 小屏幕设备 */
@media (max-width: 576px) {
  .post-detail {
    padding: 12px 0;
  }
  
  .post-content-card :deep(.ant-card-body) {
    padding: 12px;
  }
  
  .post-title {
    font-size: 20px !important;
    line-height: 1.2 !important;
  }
  
  .post-meta {
    padding: 8px;
    margin-bottom: 12px;
  }
  
  .author-name {
    font-size: 13px;
  }
  
  .post-date,
  .post-updated {
    font-size: 12px;
  }
  
  .content-divider {
    margin: 12px 0;
  }
}

/* 平板设备优化 */
@media (min-width: 768px) and (max-width: 1024px) {
  .meta-content {
    flex-direction: row;
    align-items: center;
  }
  
  .author-info,
  .post-status-info {
    width: auto;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .post-detail {
    padding: 32px 0;
  }
  
  .responsive-page-header {
    margin-bottom: 32px;
  }
  
  .post-content-card {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .post-content-card :deep(.ant-card-body) {
    padding: 32px;
  }
  
  .post-meta {
    padding: 20px;
    margin-bottom: 32px;
  }
  
  .content-divider {
    margin: 32px 0;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .edit-btn,
  .back-btn {
    min-height: 44px;
    padding: 8px 16px;
  }
}

/* 横屏模式优化 */
@media (orientation: landscape) and (max-height: 600px) {
  .post-detail {
    padding: 8px 0;
  }
  
  .responsive-page-header {
    margin-bottom: 8px;
  }
  
  .post-meta {
    margin-bottom: 12px;
  }
  
  .content-divider {
    margin: 12px 0;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .post-content-card {
    border: 2px solid #000;
  }
  
  .post-meta {
    border: 1px solid #000;
  }
}

/* 打印样式 */
@media print {
  .responsive-page-header,
  .header-actions,
  .edit-btn {
    display: none !important;
  }
  
  .post-content-card {
    border: none !important;
    box-shadow: none !important;
  }
  
  .post-title {
    color: #000 !important;
  }
  
  .post-content {
    font-size: 12pt !important;
    line-height: 1.5 !important;
  }
}
</style>