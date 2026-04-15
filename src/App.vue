<template>
  <a-layout id="app">
    <a-layout-header class="header">
      <div class="header-content">
        <a-typography-title :level="3" class="logo">
          我的博客
        </a-typography-title>
        
        <a-menu
          mode="horizontal"
          :selected-keys="[currentRoute]"
          class="nav-menu"
        >
          <a-menu-item key="/posts">
            <router-link to="/posts">帖子管理</router-link>
          </a-menu-item>
          
          <a-menu-item key="/login" v-if="!authStore.isAuthenticated">
            <router-link to="/login">登录</router-link>
          </a-menu-item>
          
          <a-menu-item key="/register" v-if="!authStore.isAuthenticated">
            <router-link to="/register">注册</router-link>
          </a-menu-item>
          
          <a-menu-item key="/users" v-if="authStore.isAdmin">
            <router-link to="/users">用户管理</router-link>
          </a-menu-item>
          
          <a-menu-item key="/about">
            <router-link to="/about">关于</router-link>
          </a-menu-item>
          
          <a-menu-item key="/profile" v-if="authStore.isAuthenticated">
            <router-link to="/profile">个人中心</router-link>
          </a-menu-item>

          <a-menu-item key="logout" v-if="authStore.isAuthenticated">
            <a @click="handleLogout">退出</a>
          </a-menu-item>
        </a-menu>
      </div>
    </a-layout-header>

    <a-layout-content class="main-content">
      <div class="container">
        <router-view />
      </div>
    </a-layout-content>

    <a-layout-footer class="footer">
      <a-typography-text type="secondary">
        &copy; 使用 Vue3 + TypeScript + Node.js + Prisma + PostgreSQL 构建
      </a-typography-text>
    </a-layout-footer>

    <!-- 开发工具 - 仅在开发环境显示 -->
    <MarkdownDevTools v-if="isDevelopment" />
    
    <!-- 全局反馈组件 -->
    <GlobalFeedback ref="globalFeedback" />
  </a-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/authStore'
import MarkdownDevTools from './components/MarkdownDevTools.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 获取当前路由
const currentRoute = computed(() => route.path)

// 检查是否为开发环境
const isDevelopment = import.meta.env.DEV

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<style>
#app {
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.logo {
  color: white !important;
  margin: 0 !important;
}

.nav-menu {
  background: transparent;
  border-bottom: none;
  line-height: 64px;
  min-width: 400px;
  flex: 1;
  justify-content: flex-end;
}

.nav-menu .ant-menu-item {
  color: rgba(255, 255, 255, 0.8);
  border-bottom: 2px solid transparent;
}

.nav-menu .ant-menu-item:hover,
.nav-menu .ant-menu-item-selected {
  color: white;
  border-bottom-color: rgba(255, 255, 255, 0.8);
}

.nav-menu .ant-menu-item a {
  color: inherit;
  text-decoration: none;
}

.main-content {
  flex: 1;
  background: #f0f2f5;
  padding: 24px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer {
  text-align: center;
  background: #001529;
  color: rgba(255, 255, 255, 0.65);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    padding: 16px;
    gap: 12px;
  }
  
  .logo {
    font-size: 18px !important;
    margin-bottom: 0 !important;
    text-align: center;
  }
  
  .nav-menu {
    width: 100%;
    justify-content: center;
    min-width: auto;
    line-height: 48px;
  }
  
  .nav-menu .ant-menu-item {
    padding: 0 12px;
    font-size: 14px;
  }
  
  .container {
    padding: 0 16px;
  }
  
  .main-content {
    padding: 16px 0;
  }
}

/* 小屏幕设备优化 */
@media (max-width: 576px) {
  .header-content {
    padding: 12px;
  }
  
  .logo {
    font-size: 16px !important;
  }
  
  .nav-menu {
    line-height: 44px;
  }
  
  .nav-menu .ant-menu-item {
    padding: 0 8px;
    font-size: 13px;
  }
  
  .container {
    padding: 0 12px;
  }
  
  .main-content {
    padding: 12px 0;
  }
}

/* 平板设备优化 */
@media (min-width: 768px) and (max-width: 1024px) {
  .header-content {
    padding: 0 20px;
  }
  
  .container {
    padding: 0 20px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .header-content {
    padding: 0 32px;
  }
  
  .container {
    padding: 0 32px;
  }
  
  .main-content {
    padding: 32px 0;
  }
}
</style>
