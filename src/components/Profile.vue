<template>
  <div class="profile-container">
    <a-card title="个人资料管理" :style="{ maxWidth: '600px', margin: '0 auto' }">
      <a-spin :spinning="loading">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <a-avatar :size="100" :src="avatarUrl">
            <template #icon>
              <UserOutlined />
            </template>
          </a-avatar>
          <a-upload
            :show-upload-list="false"
            :before-upload="handleAvatarUpload"
            accept=".jpg,.jpeg,.png,.gif,.webp"
          >
            <a-button :style="{ marginTop: '12px' }" :loading="avatarLoading">
              <UploadOutlined /> 更换头像
            </a-button>
          </a-upload>
          <a-typography-text type="secondary" :style="{ fontSize: '12px', marginTop: '4px' }">
            支持 jpg、png、gif、webp，最大 2MB
          </a-typography-text>
        </div>

        <a-divider />

        <!-- 基本信息表单 -->
        <a-form :model="profileForm" layout="vertical" @finish="handleUpdateProfile">
          <a-form-item label="邮箱">
            <a-input :value="profileForm.email" disabled />
          </a-form-item>

          <a-form-item label="用户名" name="name">
            <a-input v-model:value="profileForm.name" placeholder="请输入用户名" />
          </a-form-item>

          <a-form-item label="性别" name="gender">
            <a-radio-group v-model:value="profileForm.gender">
              <a-radio value="MALE">男</a-radio>
              <a-radio value="FEMALE">女</a-radio>
              <a-radio value="OTHER">其他</a-radio>
            </a-radio-group>
            <a-button v-if="profileForm.gender" type="link" size="small" @click="profileForm.gender = undefined">
              清除
            </a-button>
          </a-form-item>

          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="saving">
              保存修改
            </a-button>
          </a-form-item>
        </a-form>

        <a-divider />

        <!-- 修改密码 -->
        <a-typography-title :level="5">修改密码</a-typography-title>
        <a-form :model="passwordForm" layout="vertical" @finish="handleChangePassword">
          <a-form-item
            label="原密码"
            name="oldPassword"
            :rules="[{ required: true, message: '请输入原密码' }]"
          >
            <a-input-password v-model:value="passwordForm.oldPassword" placeholder="请输入原密码" />
          </a-form-item>

          <a-form-item
            label="新密码"
            name="newPassword"
            :rules="[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少为6位' }
            ]"
          >
            <a-input-password v-model:value="passwordForm.newPassword" placeholder="请输入新密码（至少6位）" />
          </a-form-item>
          <a-form-item
            label="确认新密码"
            name="confirmPassword"
            :rules="[
              { required: true, message: '请确认新密码' },
              { validator: validateConfirmPassword }
            ]"
          >
            <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请再次输入新密码" />
          </a-form-item>

          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="changingPassword">
              修改密码
            </a-button>
          </a-form-item>
        </a-form>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { UserOutlined, UploadOutlined } from '@ant-design/icons-vue';
import { profileAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const authStore = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const avatarLoading = ref(false);
const changingPassword = ref(false);

const profileForm = ref({
  email: '',
  name: '',
  gender: undefined as string | undefined,
});

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const avatarUrl = computed(() => authStore.avatarUrl);

// 确认密码校验
const validateConfirmPassword = (_rule: any, value: string) => {
  if (value && value !== passwordForm.value.newPassword) {
    return Promise.reject('两次输入的密码不一致');
  }
  return Promise.resolve();
};

// 加载用户资料
const loadProfile = async () => {
  loading.value = true;
  try {
    const { data } = await profileAPI.get();
    profileForm.value.email = data.email;
    profileForm.value.name = data.name || '';
    profileForm.value.gender = data.gender || undefined;
    // 同步更新 store
    await authStore.refreshProfile();
  } catch {
    message.error('加载资料失败');
  } finally {
    loading.value = false;
  }
};

// 更新基本信息
const handleUpdateProfile = async () => {
  saving.value = true;
  try {
    await profileAPI.update({
      name: profileForm.value.name || undefined,
      gender: profileForm.value.gender || null,
    });
    await authStore.refreshProfile();
    message.success('资料更新成功');
  } catch {
    message.error('更新失败');
  } finally {
    saving.value = false;
  }
};

// 上传头像
const handleAvatarUpload = async (file: File) => {
  // 客户端校验文件大小
  if (file.size > 2 * 1024 * 1024) {
    message.error('图片大小不能超过 2MB');
    return false;
  }
  avatarLoading.value = true;
  try {
    await profileAPI.uploadAvatar(file);
    await authStore.refreshProfile();
    message.success('头像更新成功');
  } catch {
    message.error('头像上传失败');
  } finally {
    avatarLoading.value = false;
  }
  return false; // 阻止 antd 默认上传行为
};

// 修改密码
const handleChangePassword = async () => {
  changingPassword.value = true;
  try {
    await profileAPI.changePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword,
    });
    message.success('密码修改成功');
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  } catch (err: any) {
    message.error(err.response?.data?.error || '修改密码失败');
  } finally {
    changingPassword.value = false;
  }
};

onMounted(loadProfile);
</script>

<style scoped>
.profile-container {
  padding: 24px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
</style>
