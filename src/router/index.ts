import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

// 确保已包含Register组件的路由配置
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/PostList.vue')
  },
  {
    path: '/posts',
    name: 'PostList',
    component: () => import('../views/PostList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/posts/create',
    name: 'PostCreate',
    component: () => import('../views/PostCreate.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/posts/:id/edit',
    name: 'PostEdit',
    component: () => import('../views/PostCreate.vue'),
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/posts/:id',
    name: 'PostDetail',
    component: () => import('../views/PostDetail.vue'),
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/users',
    name: 'UserList',
    component: () => import('../views/UserList.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  // 404 错误处理
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  // 直接访问store的响应式属性，不需要computed
  const isAuthenticated = authStore.isAuthenticated;
  const isAdmin = authStore.isAdmin;
  
  // 需要未登录的路由
  if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: 'Home' });
    return;
  }
  
  // 需要登录的路由
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login' });
    return;
  }
  
  // 需要管理员权限的路由
  if (to.meta.requiresAdmin && !isAdmin) {
    next({ name: 'Home' });
    return;
  }
  
  // 验证帖子详情页面的ID参数
  if (to.name === 'PostDetail' && to.params.id) {
    const postId = to.params.id as string;
    // 检查ID是否为有效数字
    if (!/^\d+$/.test(postId)) {
      next({ name: 'NotFound' });
      return;
    }
  }
  
  next();
});

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error);
  // 可以在这里添加错误上报逻辑
});

export default router;