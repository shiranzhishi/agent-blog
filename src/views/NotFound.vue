<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">页面未找到</h2>
      <p class="error-message">
        抱歉，您访问的页面不存在或已被移除。
      </p>
      <div class="error-actions">
        <a-button type="primary" @click="goHome">
          返回首页
        </a-button>
        <a-button @click="goBack" style="margin-left: 12px;">
          返回上一页
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push({ name: 'Home' });
};

const goBack = () => {
  router.go(-1);
};
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #1890ff;
  margin: 0;
  line-height: 1;
}

.error-title {
  font-size: 32px;
  color: #262626;
  margin: 20px 0 16px;
}

.error-message {
  font-size: 16px;
  color: #8c8c8c;
  margin-bottom: 32px;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 768px) {
  .error-code {
    font-size: 80px;
  }
  
  .error-title {
    font-size: 24px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .error-actions .ant-btn {
    margin: 0 !important;
    margin-bottom: 8px !important;
  }
}
</style>