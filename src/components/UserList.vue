<template>
  <div class="user-list">
    <a-page-header title="用户管理" />
    
    <!-- 添加用户表单 -->
    <a-card title="添加新用户" :style="{ marginBottom: '24px' }">
      <a-form
        :model="newUser"
        @finish="handleAddUser"
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
          <a-input v-model:value="newUser.email" placeholder="请输入邮箱地址" />
        </a-form-item>
        
        <a-form-item label="姓名" name="name">
          <a-input v-model:value="newUser.name" placeholder="请输入姓名（可选）" />
        </a-form-item>
        
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading">
            添加用户
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 用户列表 -->
    <a-spin :spinning="loading">
      <a-alert
        v-if="error"
        :message="error"
        type="error"
        show-icon
        :style="{ marginBottom: '24px' }"
      />
      
      <a-card title="用户列表" :extra="`共 ${users.length} 位用户`">
        <a-row :gutter="[16, 16]">
          <a-col 
            v-for="user in users" 
            :key="user.id" 
            :xs="24" 
            :sm="12" 
            :md="8" 
            :lg="6"
          >
            <a-card size="small" :hoverable="true">
              <template #title>
                <a-typography-text strong>
                  {{ user.name || '未命名用户' }}
                </a-typography-text>
              </template>
              
              <template #extra>
                <a-dropdown>
                  <a-button type="text" size="small">
                    <template #icon>
                      <MoreOutlined />
                    </template>
                  </a-button>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item @click="editUser(user)">
                        <EditOutlined /> 编辑
                      </a-menu-item>
                      <a-menu-item @click="confirmDeleteUser(user.id)" danger>
                        <DeleteOutlined /> 删除
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </template>
              
              <a-space direction="vertical" size="small" style="width: 100%">
                <div>
                  <a-typography-text type="secondary">邮箱:</a-typography-text>
                  <br />
                  <a-typography-text copyable>{{ user.email }}</a-typography-text>
                </div>
                
                <div>
                  <a-typography-text type="secondary">角色:</a-typography-text>
                  <br />
                  <a-tag :color="user.role === 'ADMIN' ? 'red' : 'blue'">
                    {{ user.role === 'ADMIN' ? '管理员' : '用户' }}
                  </a-tag>
                </div>
                
                <div>
                  <a-typography-text type="secondary">帖子数:</a-typography-text>
                  <br />
                  <a-badge :count="user.posts.length" :number-style="{ backgroundColor: '#52c41a' }" />
                </div>
                
                <div>
                  <a-typography-text type="secondary">注册时间:</a-typography-text>
                  <br />
                  <a-typography-text>{{ formatDate(user.createdAt) }}</a-typography-text>
                </div>
              </a-space>
            </a-card>
          </a-col>
        </a-row>
      </a-card>
    </a-spin>

    <!-- 编辑用户对话框 -->
    <a-modal
      v-model:open="editModalVisible"
      title="编辑用户"
      @ok="handleUpdateUser"
      :confirm-loading="loading"
    >
      <a-form
        v-if="editingUser"
        :model="editingUser"
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
          <a-input v-model:value="editingUser.email" />
        </a-form-item>
        
        <a-form-item label="姓名" name="name">
          <a-input v-model:value="editingUser.name" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { userAPI, type User } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { MoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { Modal } from 'ant-design-vue';

const authStore = useAuthStore();
const users = ref<User[]>([]);
const loading = ref(false);
const error = ref('');
const editModalVisible = ref(false);
const newUser = ref({ email: '', name: '' });
const editingUser = ref<User | null>(null);

// 检查权限 - 使用computed确保响应式更新
const isAdmin = computed(() => authStore.isAdmin);

// 根据权限获取用户列表
const fetchUsers = async () => {
  if (!isAdmin.value) {
    error.value = '您没有权限查看用户列表';
    return;
  }
  
  loading.value = true;
  error.value = '';
  try {
    const response = await userAPI.getAll();
    users.value = response.data;
  } catch (err) {
    error.value = '获取用户列表失败';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleAddUser = async () => {
  loading.value = true;
  try {
    await userAPI.create(newUser.value);
    newUser.value = { email: '', name: '' };
    await fetchUsers();
  } catch (err) {
    error.value = '添加用户失败';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const editUser = (user: User) => {
  editingUser.value = { ...user };
  editModalVisible.value = true;
};

const handleUpdateUser = async () => {
  if (!editingUser.value) return;
  
  loading.value = true;
  try {
    await userAPI.update(editingUser.value.id, {
      email: editingUser.value.email,
      name: editingUser.value.name ?? undefined
    });
    editModalVisible.value = false;
    editingUser.value = null;
    await fetchUsers();
  } catch (err) {
    error.value = '更新用户失败';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const confirmDeleteUser = (id: number) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个用户吗？此操作不可恢复。',
    okText: '确定',
    cancelText: '取消',
    onOk: () => deleteUser(id),
  });
};

const deleteUser = async (id: number) => {
  loading.value = true;
  try {
    await userAPI.delete(id);
    await fetchUsers();
  } catch (err) {
    error.value = '删除用户失败';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN');
};

onMounted(fetchUsers);
</script>

<style scoped>
.user-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}
</style>