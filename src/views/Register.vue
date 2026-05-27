<template>
  <div class="register-container">
    <a-card title="用户注册" :style="{ width: '460px', margin: '50px auto' }">
      <a-form
        :model="registerData"
        @finish="handleRegister"
        layout="vertical"
      >
        <a-form-item
          label="邮箱"
          name="email"
          :rules="[
            { required: true, message: '请输入邮箱地址!' },
            { type: 'email', message: '请输入有效的邮箱地址!' }
          ]"
        >
          <a-input v-model:value="registerData.email" placeholder="请输入邮箱地址" />
        </a-form-item>
        
        <a-form-item label="用户名" name="name">
          <a-input v-model:value="registerData.name" placeholder="请输入用户名（可选）" />
        </a-form-item>

        <a-form-item label="性别" name="gender">
          <a-radio-group v-model:value="registerData.gender">
            <a-radio value="MALE">男</a-radio>
            <a-radio value="FEMALE">女</a-radio>
            <a-radio value="OTHER">其他</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item
          label="密码"
          name="password"
          :rules="[
            { required: true, message: '请输入密码!' },
            { min: 6, message: '密码长度至少为6位!' }
          ]"
        >
          <a-input-password v-model:value="registerData.password" placeholder="请输入密码（至少6位）" />
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
            注册
          </a-button>
        </a-form-item>
        
        <div class="login-link">
          已有账号？<router-link to="/login">去登录</router-link>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { authAPI } from '../services/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);
const error = ref('');
const registerData = ref({
  email: '',
  name: '',
  password: '',
  gender: undefined as string | undefined,
});

const handleRegister = async () => {
  loading.value = true;
  error.value = '';
  
  if (registerData.value.password.length < 6) {
    error.value = '密码长度至少为6位';
    loading.value = false;
    return;
  }
  
  try {
    const payload: any = {
      email: registerData.value.email,
      password: registerData.value.password,
    };
    if (registerData.value.name) payload.name = registerData.value.name;
    if (registerData.value.gender) payload.gender = registerData.value.gender;

    await authAPI.register(payload);
    
    router.push({
      path: '/login',
      query: { registered: 'true' }
    });
  } catch (err: any) {
    if (err.response?.status === 400) {
      if (Array.isArray(err.response.data.error)) {
        error.value = err.response.data.error[0].message || '注册信息有误';
      } else {
        error.value = err.response.data.error || '注册失败';
      }
    } else {
      error.value = '注册失败，请稍后重试';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-link {
  text-align: center;
  margin-top: 16px;
  color: #666;
}

.login-link a {
  color: #1890ff;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
