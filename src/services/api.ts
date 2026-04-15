import axios from 'axios';
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理令牌过期等问题
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout();
      router.push('/login');
    }
    return Promise.reject(error);
  }
);

// 保留基础API方法，但移除状态管理相关的部分
export const authAPI = {
  register: (data: { email: string; password: string; name?: string; gender?: string }) => 
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => 
    api.post('/auth/login', data),
};

// 个人资料相关API
export const profileAPI = {
  // 获取当前用户资料
  get: () => api.get('/profile'),
  // 更新资料（姓名、性别）
  update: (data: { name?: string; gender?: string | null }) => api.put('/profile', data),
  // 上传头像
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.put('/profile/password', data),
};

// 用户相关API
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (data: { email: string; name?: string }) => api.post('/users', data),
  update: (id: number, data: { email?: string; name?: string }) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// 搜索过滤器接口
export interface SearchFilters {
  title?: string;
  author?: string;
  published?: boolean;
  dateFrom?: string;
  dateTo?: string;
  dateRange?: [any, any] | null; // 支持dayjs对象
}

// 分页配置接口
export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

// 搜索响应接口
export interface SearchResponse {
  posts: Post[];
  pagination: PaginationConfig;
}

// 帖子相关API
export const postAPI = {
  getAll: (published?: boolean, searchParams?: SearchFilters) => {
    const params: any = {};
    
    if (published !== undefined) {
      params.published = published;
    }
    
    if (searchParams) {
      if (searchParams.title) params.title = searchParams.title;
      if (searchParams.author) params.author = searchParams.author;
      if (searchParams.published !== undefined) params.published = searchParams.published;
      if (searchParams.dateFrom) params.dateFrom = searchParams.dateFrom;
      if (searchParams.dateTo) params.dateTo = searchParams.dateTo;
    }
    
    return api.get('/posts', { params });
  },
  
  search: (filters: SearchFilters, pagination?: { page?: number; pageSize?: number }): Promise<{ data: SearchResponse }> => {
    const params: any = {};
    
    // 搜索条件
    if (filters.title) params.title = filters.title;
    if (filters.author) params.author = filters.author;
    if (filters.published !== undefined) params.published = filters.published;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    
    // 分页参数
    if (pagination?.page) params.page = pagination.page;
    if (pagination?.pageSize) params.pageSize = pagination.pageSize;
    
    return api.get('/posts/search', { params });
  },
  
  getById: (id: number) => api.get(`/posts/${id}`),
  
  create: (data: { title: string; content?: string; published?: boolean; authorId?: number }) => 
    api.post('/posts', data),
    
  update: (id: number, data: { title?: string; content?: string; published?: boolean }) => 
    api.put(`/posts/${id}`, data),
    
  delete: (id: number) => api.delete(`/posts/${id}`),
  
  publish: (id: number) => api.patch(`/posts/${id}/publish`),
};

// 更新类型定义
export interface User {
  id: number;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  avatar: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  createdAt: string;
  updatedAt: string;
  posts: Post[];
}

export interface Post {
  id: number;
  title: string;
  content: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: number;
  author: {
    id: number;
    name: string | null;
    email: string;
    avatar: string | null;
  };
}

export default api;