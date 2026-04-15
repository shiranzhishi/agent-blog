<template>
  <div class="post-create responsive-container">
    <a-page-header 
      :title="isEditMode ? '编辑帖子' : '创建新帖子'" 
      @back="handleCancel"
      :show-back="true"
      class="responsive-page-header"
    />
    
    <a-card class="create-form-card">
      <a-spin :spinning="loading || initialLoading" :tip="initialLoading ? '加载帖子数据中...' : '处理中...'">
        <a-alert
          v-if="error"
          :message="error"
          type="error"
          show-icon
          closable
          @close="error = ''"
          class="error-alert"
        />
        
        <a-form
          :model="form"
          @finish="handleSubmit"
          layout="vertical"
          :rules="formRules"
          class="responsive-form"
        >
          <a-form-item
            label="标题"
            name="title"
            :rules="[{ required: true, message: '请输入帖子标题!' }]"
          >
            <a-input 
              v-model:value="form.title" 
              placeholder="请输入帖子标题"
              size="large"
              class="responsive-input"
            />
          </a-form-item>
          
          <a-form-item
            label="内容"
            name="content"
            class="editor-form-item"
          >
            <div class="editor-wrapper">
              <MdEditor
                v-model="form.content"
                :height="editorHeight"
                :preview="!isMobile"
                :toolbars="responsiveToolbars"
                :language="'zh-CN'"
                placeholder="请输入帖子内容，支持 Markdown 语法..."
                @onChange="handleContentChange"
                :markdownItConfig="editorConfig.markdownItConfig"
                class="responsive-editor"
              />
            </div>
          </a-form-item>
          
          <a-form-item name="published" class="publish-checkbox">
            <a-checkbox v-model:checked="form.published">
              立即发布（取消勾选将保存为草稿）
            </a-checkbox>
          </a-form-item>
          
          <a-form-item class="form-actions">
            <div class="action-buttons flex-mobile-column">
              <a-button 
                type="primary" 
                html-type="submit" 
                :loading="loading"
                size="large"
                class="submit-btn"
              >
                {{ isEditMode ? (form.published ? '更新并发布' : '更新草稿') : (form.published ? '发布帖子' : '保存草稿') }}
              </a-button>
              <a-button 
                @click="handleCancel"
                size="large"
                class="cancel-btn"
              >
                取消
              </a-button>
            </div>
          </a-form-item>
        </a-form>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { MdEditor, type ToolbarNames } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import { postAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { markdownCache } from '../services/markdownCache';
import { markdownPreloader } from '../services/markdownPreloader';

// 路由和状态管理
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 判断是否为编辑模式
const isEditMode = computed(() => route.name === 'PostEdit');
const postId = computed(() => route.params.id ? Number(route.params.id) : null);

// 响应式数据
const loading = ref(false);
const error = ref('');
const initialLoading = ref(false);

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

// 响应式编辑器高度
const editorHeight = computed(() => {
  return isMobile.value ? 300 : 400;
});

// 响应式工具栏配置
const responsiveToolbars = computed(() => {
  const baseToolbars: ToolbarNames[] = [
    'bold',
    'italic',
    'title',
    'quote',
    'unorderedList',
    'orderedList',
    'codeRow',
    'code',
    'link'
  ];
  
  const fullToolbars: ToolbarNames[] = [
    'bold',
    'underline',
    'italic',
    '-',
    'title',
    'strikeThrough',
    'sub',
    'sup',
    'quote',
    'unorderedList',
    'orderedList',
    'task',
    '-',
    'codeRow',
    'code',
    'link',
    'image',
    'table',
    'mermaid',
    'katex',
    '-',
    'revoke',
    'next',
    'save',
    '=',
    'pageFullscreen',
    'fullscreen',
    'preview',
    'htmlPreview',
    'catalog'
  ];
  
  return isMobile.value ? baseToolbars : fullToolbars;
});

onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', handleResize);
  
  // 如果是编辑模式，加载帖子数据
  if (isEditMode.value && postId.value) {
    loadPostData();
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// 加载帖子数据（编辑模式）
const loadPostData = async () => {
  if (!postId.value) return;
  
  initialLoading.value = true;
  error.value = '';
  
  try {
    const response = await postAPI.getById(postId.value);
    const post = response.data;
    
    // 检查权限：只有作者或管理员可以编辑
    if (!authStore.isAdmin && post.authorId !== authStore.user?.id) {
      error.value = '您没有权限编辑此帖子';
      return;
    }
    
    // 填充表单数据
    form.title = post.title;
    form.content = post.content || '';
    form.published = post.published;
    
  } catch (err: any) {
    console.error('加载帖子数据失败:', err);
    
    if (err.response?.status === 404) {
      error.value = '帖子不存在';
    } else if (err.response?.status === 401) {
      error.value = '登录已过期，请重新登录';
    } else if (err.response?.status === 403) {
      error.value = '没有权限访问此帖子';
    } else {
      error.value = err.response?.data?.message || '加载帖子失败';
    }
  } finally {
    initialLoading.value = false;
  }
};

// 表单数据
const form = reactive({
  title: '',
  content: '',
  published: false
});

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入帖子标题!', trigger: 'blur' },
    { min: 1, max: 200, message: '标题长度应在 1-200 个字符之间', trigger: 'blur' }
  ],
  content: [
    { max: 10000, message: '内容长度不能超过 10000 个字符', trigger: 'blur' }
  ]
};

// 自定义渲染器配置，集成我们的缓存系统
const editorConfig = markdownCache.getMdEditorConfig();

// 处理内容变化
const handleContentChange = (content: string) => {
  // 当用户输入内容时，预加载到缓存中以提升预览性能
  if (content && content.trim()) {
    // 使用防抖，避免频繁缓存
    clearTimeout((handleContentChange as any).timeoutId);
    (handleContentChange as any).timeoutId = setTimeout(() => {
      // 预加载到缓存中
      markdownPreloader.addToQueue([content]);
      
      // 同时也渲染一次以更新性能统计
      markdownCache.render(content);
    }, 500);
  }
};

// 提交表单
const handleSubmit = async () => {
  // 验证用户是否已登录
  if (!authStore.user?.id) {
    error.value = '请先登录';
    return;
  }

  // 验证标题不能为空
  if (!form.title.trim()) {
    error.value = '请输入帖子标题';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    if (isEditMode.value && postId.value) {
      // 编辑模式：更新帖子
      await postAPI.update(postId.value, {
        title: form.title.trim(),
        content: form.content || undefined,
        published: form.published
      });
    } else {
      // 创建模式：创建新帖子
      await postAPI.create({
        title: form.title.trim(),
        content: form.content || undefined,
        published: form.published,
        authorId: authStore.user.id
      });
    }

    // 跳转回帖子列表页面
    router.push('/posts');
  } catch (err: any) {
    console.error(isEditMode.value ? '更新帖子失败:' : '创建帖子失败:', err);
    
    if (err.response?.status === 401) {
      error.value = '登录已过期，请重新登录';
    } else if (err.response?.status === 403) {
      error.value = isEditMode.value ? '没有权限编辑此帖子' : '没有权限创建帖子';
    } else if (err.response?.status === 404 && isEditMode.value) {
      error.value = '帖子不存在';
    } else if (err.response?.status >= 500) {
      error.value = '服务器错误，请稍后重试';
    } else {
      error.value = err.response?.data?.message || (isEditMode.value ? '更新帖子失败，请重试' : '创建帖子失败，请重试');
    }
  } finally {
    loading.value = false;
  }
};

// 取消创建
const handleCancel = () => {
  // 如果有未保存的内容，询问用户是否确认离开
  if (form.title.trim() || form.content.trim()) {
    const confirmed = window.confirm('您有未保存的内容，确定要离开吗？');
    if (!confirmed) {
      return;
    }
  }
  
  // 返回帖子列表页面
  router.push('/posts');
};
</script>

<style scoped>
.post-create {
  width: 100%;
  padding: 24px 0;
}

.responsive-page-header {
  margin-bottom: 24px;
}

.create-form-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.error-alert {
  margin-bottom: 24px;
}

.responsive-form {
  width: 100%;
}

.responsive-input {
  width: 100%;
}

.editor-form-item {
  margin-bottom: 24px;
}

.editor-wrapper {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
}

.responsive-editor {
  border-radius: 6px;
}

.publish-checkbox {
  margin-bottom: 24px;
}

.form-actions {
  margin-bottom: 0;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: flex-start;
}

.submit-btn,
.cancel-btn {
  min-width: 120px;
}

/* Markdown编辑器样式调整 */
:deep(.md-editor) {
  border-radius: 6px;
  border: 1px solid #d9d9d9;
}

:deep(.md-editor-input-wrapper) {
  font-size: 14px;
  line-height: 1.6;
}

:deep(.md-editor-preview-wrapper) {
  font-size: 14px;
  line-height: 1.6;
}

:deep(.md-editor-toolbar) {
  border-bottom: 1px solid #f0f0f0;
  padding: 8px 12px;
}

/* 表单样式优化 */
.ant-form-item-label > label {
  font-weight: 600;
  font-size: 14px;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .post-create {
    padding: 16px 0;
  }
  
  .responsive-page-header {
    margin-bottom: 16px;
  }
  
  .create-form-card {
    border-radius: 4px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }
  
  .create-form-card :deep(.ant-card-body) {
    padding: 16px;
  }
  
  .error-alert {
    margin-bottom: 16px;
  }
  
  .editor-form-item {
    margin-bottom: 16px;
  }
  
  .publish-checkbox {
    margin-bottom: 16px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 12px;
  }
  
  .submit-btn,
  .cancel-btn {
    width: 100%;
    min-width: auto;
  }
  
  /* 编辑器移动端优化 */
  :deep(.md-editor) {
    border-radius: 4px;
  }
  
  :deep(.md-editor-toolbar) {
    padding: 6px 8px;
    flex-wrap: wrap;
  }
  
  :deep(.md-editor-toolbar-item) {
    margin: 2px;
    padding: 4px 6px;
    font-size: 12px;
  }
  
  :deep(.md-editor-input-wrapper) {
    font-size: 16px; /* 防止iOS缩放 */
  }
}

/* 小屏幕设备 */
@media (max-width: 576px) {
  .post-create {
    padding: 12px 0;
  }
  
  .create-form-card :deep(.ant-card-body) {
    padding: 12px;
  }
  
  .responsive-input {
    font-size: 16px; /* 防止iOS缩放 */
  }
  
  /* 更紧凑的编辑器 */
  :deep(.md-editor-toolbar) {
    padding: 4px 6px;
  }
  
  :deep(.md-editor-toolbar-item) {
    margin: 1px;
    padding: 3px 4px;
    font-size: 11px;
  }
}

/* 平板设备优化 */
@media (min-width: 768px) and (max-width: 1024px) {
  .action-buttons {
    justify-content: flex-start;
  }
  
  .submit-btn,
  .cancel-btn {
    min-width: 140px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .post-create {
    padding: 32px 0;
  }
  
  .responsive-page-header {
    margin-bottom: 32px;
  }
  
  .create-form-card {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .create-form-card :deep(.ant-card-body) {
    padding: 32px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .submit-btn,
  .cancel-btn {
    min-height: 44px;
    padding: 8px 16px;
  }
  
  :deep(.md-editor-toolbar-item) {
    min-height: 36px;
    min-width: 36px;
  }
}

/* 横屏模式优化 */
@media (orientation: landscape) and (max-height: 600px) {
  .responsive-editor {
    height: 250px !important;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .create-form-card {
    border: 2px solid #000;
  }
  
  :deep(.md-editor) {
    border: 2px solid #000;
  }
}
</style>