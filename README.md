# Vue3 + TypeScript + Node.js + Prisma + PostgreSQL 全栈演示

这是一个现代全栈Web应用演示项目，展示了如何使用以下技术栈构建完整的Web应用：

## 🚀 技术栈

### 前端
- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全的JavaScript超集
- **Vite** - 快速的构建工具
- **Axios** - HTTP客户端

### 后端
- **Node.js** - JavaScript运行时
- **Express** - Web应用框架
- **TypeScript** - 类型安全的JavaScript超集
- **Prisma** - 现代数据库工具包
- **PostgreSQL** - 关系型数据库
- **Zod** - 数据验证库

## 📁 项目结构

```
my-vue3-app/
├── src/                    # 前端代码
│   ├── components/         # Vue组件
│   │   ├── About.vue      # 项目介绍
│   │   ├── PostList.vue   # 帖子管理
│   │   └── UserList.vue   # 用户管理
│   ├── services/          # API服务
│   │   └── api.ts        # API封装
│   ├── App.vue           # 主应用组件
│   └── main.ts           # 应用入口
├── server/                # 后端代码
│   ├── src/
│   │   ├── routes/       # API路由
│   │   │   ├── posts.ts  # 帖子路由
│   │   │   └── users.ts  # 用户路由
│   │   ├── seed.ts       # 数据库种子数据
│   │   └── index.ts      # 服务器入口
│   ├── prisma/           # Prisma配置
│   │   └── schema.prisma # 数据库模式
│   ├── .env.example      # 环境变量模板
│   ├── package.json      # 后端依赖
│   └── tsconfig.json     # TypeScript配置
├── package.json          # 前端依赖
└── README.md            # 项目说明
```

## 🛠️ 快速开始

### 前置要求
- Node.js (v18+)
- PostgreSQL (v12+)
- pnpm (推荐) 或 npm

### 1. 安装依赖

#### 前端依赖
```bash
pnpm install
```

#### 后端依赖
```bash
cd server
pnpm install
```

### 2. 数据库配置

#### 创建数据库
在PostgreSQL中创建数据库：
```sql
CREATE DATABASE vue_prisma_demo;
```

#### 配置环境变量
```bash
cd server
cp .env.example .env
```

编辑 `.env` 文件：
```env
DATABASE_URL="postgresql://username:password@localhost:5432/vue_prisma_demo?schema=public"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

### 3. 数据库初始化

#### 生成Prisma客户端
```bash
pnpm dlx prisma generate
```

#### 运行数据库迁移
```bash
pnpm dlx prisma migrate dev --name init
```

#### 添加种子数据
```bash
pnpm db:seed
```

### 4. 启动服务

#### 启动后端服务
```bash
# 在 server 目录下
pnpm dev
```
后端服务将在 `http://localhost:3000` 启动

#### 启动前端服务
```bash
# 在项目根目录下
pnpm dev
```
前端服务将在 `http://localhost:5173` 启动

## 🔗 API 端点

### 用户管理
- `GET /api/users` - 获取所有用户
- `GET /api/users/:id` - 获取单个用户
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

### 帖子管理
- `GET /api/posts` - 获取所有帖子
- `GET /api/posts/:id` - 获取单个帖子
- `POST /api/posts` - 创建帖子
- `PUT /api/posts/:id` - 更新帖子
- `DELETE /api/posts/:id` - 删除帖子
- `PATCH /api/posts/:id/publish` - 发布帖子

## 🎯 功能特性

### 用户管理
- ✅ 创建新用户
- ✅ 编辑用户信息
- ✅ 删除用户
- ✅ 查看用户帖子
- ✅ 响应式表单验证

### 帖子管理
- ✅ 发布新帖子
- ✅ 编辑帖子内容
- ✅ 删除帖子
- ✅ 草稿/发布状态切换
- ✅ 按状态筛选帖子

### 技术特性
- ✅ 类型安全（TypeScript）
- ✅ 响应式设计
- ✅ 错误处理
- ✅ 加载状态
- ✅ 数据验证
- ✅ 优雅降级

## 🧪 开发命令

### 后端开发
```bash
cd server
pnpm dev            # 开发模式
pnpm build          # 构建生产版本
pnpm start          # 启动生产服务
```

### 前端开发
```bash
pnpm dev            # 开发模式
pnpm build          # 构建生产版本
pnpm preview        # 预览生产构建
```

### 数据库命令
```bash
# 在 server 目录下
pnpm dlx prisma migrate dev      # 开发迁移
pnpm dlx prisma migrate reset    # 重置数据库
pnpm dlx prisma studio          # 打开Prisma Studio
pnpm db:seed                    # 运行种子脚本
```

## 📊 数据库模式

### User 模型
- `id` - 主键 (Int)
- `email` - 邮箱 (String, 唯一)
- `name` - 姓名 (String, 可选)
- `createdAt` - 创建时间 (DateTime)
- `updatedAt` - 更新时间 (DateTime)
- `posts` - 关联的帖子 (Post[])

### Post 模型
- `id` - 主键 (Int)
- `title` - 标题 (String)
- `content` - 内容 (String, 可选)
- `published` - 发布状态 (Boolean, 默认 false)
- `createdAt` - 创建时间 (DateTime)
- `updatedAt` - 更新时间 (DateTime)
- `authorId` - 作者ID (Int)
- `author` - 关联的作者 (User)

## 🐛 常见问题

### 数据库连接问题
确保PostgreSQL正在运行，并且数据库连接字符串正确。

### 端口冲突
如果端口被占用，可以在 `.env` 文件中修改端口号。

### CORS问题
确保前后端的URL配置正确匹配。

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License
