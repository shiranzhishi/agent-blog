<template>
  <div class="about">
    <a-page-header title="关于项目" sub-title="Vue3 + TypeScript + Node.js + Prisma + PostgreSQL 全栈演示" />
    
    <a-card title="技术栈" :style="{ marginBottom: '24px' }">
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :md="8">
          <a-card size="small" title="前端技术" :bordered="false">
            <a-list size="small" :data-source="frontendTech">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-typography-text>
                    <CheckCircleOutlined style="color: #52c41a; margin-right: 8px;" />
                    {{ item }}
                  </a-typography-text>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
        
        <a-col :xs="24" :md="8">
          <a-card size="small" title="后端技术" :bordered="false">
            <a-list size="small" :data-source="backendTech">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-typography-text>
                    <CheckCircleOutlined style="color: #52c41a; margin-right: 8px;" />
                    {{ item }}
                  </a-typography-text>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
        
        <a-col :xs="24" :md="8">
          <a-card size="small" title="数据库" :bordered="false">
            <a-list size="small" :data-source="databaseTech">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-typography-text>
                    <CheckCircleOutlined style="color: #52c41a; margin-right: 8px;" />
                    {{ item }}
                  </a-typography-text>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
      </a-row>
    </a-card>

    <a-card title="功能特性" :style="{ marginBottom: '24px' }">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" v-for="feature in features" :key="feature.title">
          <a-card size="small" :hoverable="true">
            <template #title>
              <a-typography-text strong>{{ feature.title }}</a-typography-text>
            </template>
            <a-typography-paragraph>{{ feature.description }}</a-typography-paragraph>
          </a-card>
        </a-col>
      </a-row>
    </a-card>

    <a-card title="快速开始" :style="{ marginBottom: '24px' }">
      <a-collapse>
        <a-collapse-panel key="1" header="1. 安装依赖">
          <a-typography-paragraph>
            <pre><code># 后端
cd server
npm install

# 前端
cd ..
npm install</code></pre>
          </a-typography-paragraph>
        </a-collapse-panel>
        
        <a-collapse-panel key="2" header="2. 配置数据库">
          <a-typography-paragraph>
            <pre><code># 复制环境变量模板
cd server
cp .env.example .env

# 编辑 .env 文件，配置数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/yourdb?schema=public"</code></pre>
          </a-typography-paragraph>
        </a-collapse-panel>
        
        <a-collapse-panel key="3" header="3. 初始化数据库">
          <a-typography-paragraph>
            <pre><code># 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev --name init

# 种子数据
npx prisma db seed</code></pre>
          </a-typography-paragraph>
        </a-collapse-panel>
        
        <a-collapse-panel key="4" header="4. 启动服务">
          <a-typography-paragraph>
            <pre><code># 启动后端服务
npm run dev

# 启动前端服务（新终端）
cd ..
npm run dev</code></pre>
          </a-typography-paragraph>
        </a-collapse-panel>
      </a-collapse>
    </a-card>

    <a-card title="项目结构">
      <a-typography-paragraph>
        <pre><code>my-vue3-app/
├── src/                    # 前端代码
│   ├── components/         # Vue组件
│   ├── services/          # API服务
│   └── App.vue           # 主应用组件
├── server/                # 后端代码
│   ├── src/
│   │   ├── routes/       # API路由
│   │   └── index.ts      # 服务器入口
│   ├── prisma/           # Prisma配置
│   └── package.json      # 后端依赖
└── package.json          # 前端依赖</code></pre>
      </a-typography-paragraph>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { CheckCircleOutlined } from '@ant-design/icons-vue';

// 前端技术栈数据
const frontendTech = [
  'Vue 3 + Composition API',
  'TypeScript',
  'Vite 构建工具',
  'Axios HTTP客户端',
  'Ant Design Vue'
];

// 后端技术栈数据
const backendTech = [
  'Node.js + Express',
  'TypeScript',
  'Prisma ORM',
  'Zod 数据验证',
  'JWT 身份认证'
];

// 数据库技术数据
const databaseTech = [
  'PostgreSQL',
  'Prisma Schema定义',
  '类型安全查询',
  '数据库迁移'
];

// 功能特性数据
const features = [
  {
    title: '用户管理',
    description: '创建、编辑、删除用户，查看用户发布的帖子，支持角色权限控制'
  },
  {
    title: '帖子管理',
    description: '发布、编辑、删除帖子，支持草稿和发布状态切换'
  },
  {
    title: '响应式设计',
    description: '适配不同屏幕尺寸，提供良好的移动端体验'
  },
  {
    title: '类型安全',
    description: '前后端全程TypeScript，编译时类型检查'
  }
];
</script>

<style scoped>
.about {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

pre {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.45;
}

code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  color: #24292e;
}
</style>