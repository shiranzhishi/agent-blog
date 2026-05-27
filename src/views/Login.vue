<template>
  <div class="login-container">
    <a-card title="用户登录" :style="{ width: '400px', margin: '50px auto' }">
      <a-alert
        v-if="registered"
        message="注册成功！请使用您的账号登录。"
        type="success"
        show-icon
        :style="{ marginBottom: '16px' }"
      />
      
      <a-form
        :model="loginData"
        @finish="handleLogin"
        layout="vertical"
      >
        <a-form-item
          label="邮箱"
          name="email"
          :rules="[{ required: true, message: '请输入邮箱地址!' }, { type: 'email', message: '请输入有效的邮箱地址!' }]"
        >
          <a-input v-model:value="loginData.email" placeholder="请输入邮箱地址" />
        </a-form-item>
        
        <a-form-item
          label="密码"
          name="password"
          :rules="[{ required: true, message: '请输入密码!' }]"
        >
          <a-input-password v-model:value="loginData.password" placeholder="请输入密码" />
        </a-form-item>
        
        <a-alert
          v-if="error"
          :message="error"
          type="error"
          show-icon
          :style="{ marginBottom: '16px' }"
        />
        
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" block>
            登录
          </a-button>
        </a-form-item>
        
        <div class="register-link">
          还没有账号？<router-link to="/register">立即注册</router-link>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const loading = ref(false);
const error = ref('');
const registered = ref(false);
const loginData = ref({
  email: '',
  password: ''
});

onMounted(() => {
  if (route.query.registered === 'true') {
    registered.value = true;
    setTimeout(() => {
      registered.value = false;
    }, 5000);
  }
});

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  try {
    // 使用store中的login方法
    await authStore.login(loginData.value);
    router.push('/');
  } catch (err: any) {
    error.value = err.response?.data?.error || '登录失败';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-link {
  text-align: center;
  margin-top: 16px;
  color: #666;
}

.register-link a {
  color: #1890ff;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>