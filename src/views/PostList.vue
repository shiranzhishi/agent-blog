<template>
  <div class="post-list responsive-container">
    <a-page-header title="帖子管理" class="responsive-page-header" />

    <!-- 新建帖子按钮 -->
    <a-card v-if="authStore.isAuthenticated" class="create-post-card">
      <a-button type="primary" size="large" @click="goToCreatePost" :loading="loading" class="create-post-btn">
        <template #icon>
          <plus-outlined />
        </template>
        新建帖子
      </a-button>
    </a-card>

    <!-- 搜索过滤组件 -->
    <SearchFilter v-model:filters="searchFilters" :loading="loading" :result-count="posts.length"
      :total-count="totalCount" :real-time-search="true" @search="handleSearch" @reset="handleReset" />

    <!-- 错误提示 -->
    <a-alert v-if="error" :message="error" type="error" show-icon closable @close="error = ''"
      :style="{ marginBottom: '24px' }" />

    <!-- 成功提示 -->
    <a-alert v-if="successMessage" :message="successMessage" type="success" show-icon closable
      @close="successMessage = ''" :style="{ marginBottom: '24px' }" />

    <!-- 帖子列表 -->
    <a-card title="帖子列表" :extra="`共 ${posts.length} 篇`">
      <a-spin :spinning="loading" tip="加载中...">
        <div v-if="!loading && posts.length === 0" class="empty-state">
          <a-empty :description="getEmptyDescription()" :image="Empty.PRESENTED_IMAGE_SIMPLE">
            <a-button v-if="authStore.isAuthenticated && !hasActiveFilters" type="primary" @click="goToCreatePost">
              创建第一篇帖子
            </a-button>
            <a-button v-else-if="hasActiveFilters" @click="handleReset">
              清除搜索条件
            </a-button>
          </a-empty>
        </div>

        <a-list v-else :data-source="posts" item-layout="vertical" size="large" class="responsive-post-list"
          :pagination="{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            responsive: true,
            simple: isMobile,
            locale: {
              items_per_page: '条/页'
            }
          }">
          <template #renderItem="{ item }">
            <a-list-item class="post-item responsive-post-item">
              <template #actions>
                <div class="post-actions flex-mobile-column">
                  <a-button type="link" @click="viewPost(item)" :loading="actionLoading[item.id]" class="action-btn">
                    详情
                  </a-button>
                  <a-button v-if="canEditPost(item)" type="link" @click="editPost(item)"
                    :loading="actionLoading[item.id]" class="action-btn">
                    编辑
                  </a-button>
                  <a-button v-if="canEditPost(item)" type="link" @click="togglePublish(item)"
                    :loading="actionLoading[item.id]" class="action-btn">
                    {{ item.published ? '设为草稿' : '发布' }}
                  </a-button>
                  <a-popconfirm v-if="canEditPost(item)" title="确定要删除此帖子吗？" ok-text="确定" cancel-text="取消"
                    @confirm="deletePost(item.id)">
                    <a-button type="link" danger :loading="actionLoading[item.id]" class="action-btn">
                      删除
                    </a-button>
                  </a-popconfirm>
                </div>
              </template>

              <a-list-item-meta class="responsive-meta">
                <template #title>
                  <a-typography-title :level="4" class="post-title responsive-text" @click="viewPost(item)">
                    {{ item.title }}
                  </a-typography-title>
                </template>
                <template #description>
                  <div class="post-meta-info">
                    <a-space wrap size="small" class="meta-space">
                      <span class="meta-item">
                        <a-avatar
                          :size="isMobile ? 20 : 16"
                          :src="item.author.avatar ? `http://localhost:3000${item.author.avatar}` : undefined"
                          :style="!item.author.avatar ? { backgroundColor: '#87d068' } : {}"
                        >
                          {{ item.author.avatar ? '' : (item.author.name || item.author.email).charAt(0).toUpperCase() }}
                        </a-avatar>
                        <span class="author-name">{{ item.author.name || item.author.email }}</span>
                      </span>
                      <a-divider type="vertical" class="hide-mobile" />
                      <a-tag :color="item.published ? 'green' : 'orange'" class="status-tag"
                        :size="isMobile ? 'small' : 'default'">
                        {{ item.published ? '已发布' : '草稿' }}
                      </a-tag>
                      <a-divider type="vertical" class="hide-mobile" />
                      <span class="meta-item date-info">
                        <a-tooltip :title="formatDate(item.createdAt)">
                          创建于 {{ formatRelativeTime(item.createdAt) }}
                        </a-tooltip>
                      </span>
                      <template v-if="item.updatedAt !== item.createdAt">
                        <a-divider type="vertical" class="hide-mobile" />
                        <span class="meta-item date-info">
                          <a-tooltip :title="formatDate(item.updatedAt)">
                            更新于 {{ formatRelativeTime(item.updatedAt) }}
                          </a-tooltip>
                        </span>
                      </template>
                    </a-space>
                  </div>
                </template>
              </a-list-item-meta>

              <div class="post-content">
                <ContentTruncation :content="item.content" :max-lines="3" :max-length="150"
                  @read-more="viewPost(item)" />
              </div>
            </a-list-item>
          </template>
        </a-list>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Empty } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { postAPI, userAPI, type Post, type User, type SearchFilters } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import ContentTruncation from '../components/ContentTruncation.vue';
import SearchFilter from '../components/SearchFilter.vue';
import { markdownPreloader } from '../services/markdownPreloader';

const router = useRouter();
const posts = ref<Post[]>([]);
const users = ref<User[]>([]);
const loading = ref(false);
const error = ref('');
const successMessage = ref('');
const totalCount = ref(0);

// 搜索过滤器状态
const searchFilters = ref<SearchFilters>({});

// 用于跟踪各个操作的加载状态
const actionLoading = reactive<Record<number, boolean>>({});

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

onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', handleResize);
});

// 组件卸载时清理事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// 计算是否有活跃的搜索条件
const hasActiveFilters = computed(() => {
  return Object.values(searchFilters.value).some(value => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null && value !== '';
  });
});

// 获取空状态描述
const getEmptyDescription = () => {
  if (hasActiveFilters.value) {
    return '没有找到符合条件的帖子';
  }
  return '暂无帖子';
};

// 转换搜索过滤器为API参数
const convertFiltersToApiParams = (filters: SearchFilters) => {
  const apiParams: any = {};

  if (filters.title) {
    apiParams.title = filters.title;
  }

  if (filters.author) {
    apiParams.author = filters.author;
  }

  if (filters.published !== undefined) {
    apiParams.published = filters.published;
  }

  if (filters.dateRange && filters.dateRange.length === 2) {
    apiParams.dateFrom = filters.dateRange[0].format('YYYY-MM-DD');
    apiParams.dateTo = filters.dateRange[1].format('YYYY-MM-DD');
  }

  return apiParams;
};

const fetchPosts = async (searchParams?: SearchFilters) => {
  loading.value = true;
  error.value = '';

  try {
    let response;

    if (searchParams && Object.keys(searchParams).length > 0) {
      // 使用搜索API
      const apiParams = convertFiltersToApiParams(searchParams);
      response = await postAPI.search(apiParams);

      // 搜索API返回的是 { posts, pagination } 格式
      if (response.data.posts) {
        posts.value = response.data.posts;
        // 更新总数为搜索结果的总数
        if (response.data.pagination) {
          totalCount.value = response.data.pagination.total;
        }
      } else {
        posts.value = [];
        totalCount.value = 0;
      }
    } else {
      // 使用普通获取API
      response = await postAPI.getAll();
      posts.value = response.data;
      totalCount.value = response.data.length;
    }

    // 预加载Markdown内容到缓存
    if (posts.value.length > 0) {
      markdownPreloader.preloadPosts(posts.value);
    }
  } catch (err: any) {
    console.error('获取帖子列表失败:', err);

    if (err.response?.status === 401) {
      error.value = '登录已过期，请重新登录';
    } else if (err.response?.status === 403) {
      error.value = '没有权限访问帖子列表';
    } else if (err.response?.status >= 500) {
      error.value = '服务器错误，请稍后重试';
    } else {
      error.value = err.response?.data?.message || '获取帖子列表失败';
    }
  } finally {
    loading.value = false;
  }
};

const fetchUsers = async () => {
  try {
    const response = await userAPI.getAll();
    users.value = response.data;
  } catch (err) {
    console.error('获取用户列表失败:', err);
  }
};

// 处理搜索
const handleSearch = (filters: SearchFilters) => {
  searchFilters.value = filters;
  fetchPosts(filters);
};

// 处理重置
const handleReset = () => {
  searchFilters.value = {};
  fetchPosts();
};

// 导航到创建帖子页面
const goToCreatePost = () => {
  router.push('/posts/create');
};

// 导航到帖子详情页面
const viewPost = (post: Post) => {
  router.push(`/posts/${post.id}`);
};

const editPost = (post: Post) => {
  router.push(`/posts/${post.id}/edit`);
};

const togglePublish = async (post: Post) => {
  actionLoading[post.id] = true;
  error.value = '';
  try {
    if (!post.published) {
      await postAPI.publish(post.id);
      successMessage.value = '帖子发布成功';
    } else {
      await postAPI.update(post.id, { published: false });
      successMessage.value = '帖子已设为草稿';
    }
    await fetchPosts(searchFilters.value);
  } catch (err: any) {
    console.error('更新帖子状态失败:', err);
    error.value = err.response?.data?.message || '更新帖子状态失败';
  } finally {
    actionLoading[post.id] = false;
  }
};

// 保留store引用，而不是直接解构状态
const authStore = useAuthStore();

// 然后在需要的地方直接使用authStore的属性
const canEditPost = (post: Post) => {
  return authStore.isAdmin || (authStore.isAuthenticated && post.authorId === authStore.user?.id);
};

const deletePost = async (postId: number) => {
  if (!authStore.isAuthenticated) {
    return;
  }

  const post = posts.value.find(p => p.id === postId);
  if (!post || !canEditPost(post)) {
    return;
  }

  actionLoading[postId] = true;
  error.value = '';
  try {
    await postAPI.delete(postId);
    successMessage.value = '帖子删除成功';
    await fetchPosts(searchFilters.value);
  } catch (err: any) {
    console.error('删除帖子失败:', err);
    error.value = err.response?.data?.message || '删除帖子失败';
  } finally {
    actionLoading[postId] = false;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN');
};

const formatRelativeTime = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '刚刚';
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)} 分钟前`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)} 小时前`;
  } else if (diffInSeconds < 2592000) {
    return `${Math.floor(diffInSeconds / 86400)} 天前`;
  } else {
    return formatDate(dateString);
  }
};

onMounted(() => {
  fetchPosts();
  fetchUsers();
});
</script>

<style scoped>
.post-list {
  width: 100%;
  padding: 24px 0;
}

.responsive-page-header {
  margin-bottom: 24px;
}

.create-post-card {
  margin-bottom: 24px;
}

.create-post-btn {
  width: 100%;
  max-width: 200px;
}

.post-content {
  margin-top: 16px;
}

.responsive-post-item {
  border-radius: 8px;
  transition: all 0.3s ease;
  padding: 16px;
  margin-bottom: 8px;
  border: 1px solid #f0f0f0;
}

.responsive-post-item:hover {
  background-color: #fafafa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #d9d9d9;
}

.post-title {
  cursor: pointer;
  transition: color 0.3s ease;
  margin-bottom: 8px !important;
}

.post-title:hover {
  color: #1890ff;
}

.responsive-meta .post-meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #666;
  font-size: 12px;
}

.author-name {
  margin-left: 4px;
}

.date-info {
  white-space: nowrap;
}

.status-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}

.post-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 4px 8px;
  height: auto;
  font-size: 12px;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .post-list {
    padding: 16px 0;
  }

  .create-post-btn {
    max-width: none;
  }

  .responsive-post-item {
    padding: 12px;
    margin-bottom: 12px;
  }

  .post-actions {
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  .action-btn {
    width: 100%;
    text-align: center;
    justify-content: center;
  }

  .meta-item {
    font-size: 11px;
  }

  .post-meta-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .meta-space {
    width: 100%;
  }

  .responsive-post-list .ant-list-item-action {
    margin-top: 12px;
  }
}

/* 小屏幕设备 */
@media (max-width: 576px) {
  .responsive-post-item {
    padding: 8px;
    border-radius: 4px;
  }

  .post-title {
    font-size: 16px !important;
    line-height: 1.4 !important;
  }

  .meta-item {
    font-size: 10px;
  }

  .status-tag {
    font-size: 10px;
    padding: 1px 4px;
  }
}

/* 平板设备优化 */
@media (min-width: 768px) and (max-width: 1024px) {
  .post-actions {
    flex-direction: row;
    justify-content: flex-end;
  }

  .action-btn {
    width: auto;
  }
}

/* 加载状态优化 */
.ant-spin-nested-loading>.ant-spin {
  max-height: none;
}

/* 列表项动画 */
.responsive-post-list .ant-list-item {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .responsive-post-item:hover {
    background-color: transparent;
    box-shadow: none;
    border-color: #f0f0f0;
  }

  .responsive-post-item:active {
    background-color: #f5f5f5;
    transform: scale(0.99);
  }

  .action-btn {
    min-height: 44px;
    padding: 8px 12px;
  }
}
</style>