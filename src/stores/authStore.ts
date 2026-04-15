import { defineStore } from 'pinia';
import { authAPI, profileAPI } from '../services/api';
import type { User } from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null as User | null,
    isAuthenticated: !!localStorage.getItem('token'),
  }),
  
  getters: {
    isAdmin: (state) => state.user?.role === 'ADMIN',
    currentUser: (state) => state.user,
    avatarUrl: (state) => {
      if (!state.user?.avatar) return null;
      return `http://localhost:3000${state.user.avatar}`;
    }
  },
  
  actions: {
    setAuthData(token: string, user: User) {
      this.token = token;
      this.user = user;
      this.isAuthenticated = true;
      
      // 同步到localStorage以实现持久化
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    
    logout() {
      this.token = null;
      this.user = null;
      this.isAuthenticated = false;
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    
    // 初始化时从localStorage恢复用户信息
    initialize() {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          this.user = JSON.parse(userStr);
        } catch (e) {
          console.error('Failed to parse user data', e);
          this.logout();
        }
      }
    },
    
    // 直接调用API的登录方法并更新状态
    async login(credentials: { email: string; password: string }) {
      const response = await authAPI.login(credentials);
      this.setAuthData(response.data.token, response.data.user);
      return response;
    },

    // 刷新当前用户资料
    async refreshProfile() {
      try {
        const response = await profileAPI.get();
        if (this.user) {
          this.user = { ...this.user, ...response.data };
          localStorage.setItem('user', JSON.stringify(this.user));
        }
      } catch (e) {
        console.error('刷新用户资料失败', e);
      }
    },
  },
});