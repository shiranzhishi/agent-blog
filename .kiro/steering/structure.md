# 项目结构

## 根目录组织
```
my-vue3-app/
├── src/                 # 前端Vue 3应用
├── server/              # 后端Node.js API
├── public/              # 静态资源
├── package.json         # 前端依赖
└── vite.config.ts       # Vite配置
```

## 前端结构 (`src/`)
```
src/
├── components/          # Vue组件
│   ├── About.vue       # 静态内容页面
│   ├── Login.vue       # 认证表单
│   ├── Register.vue    
│   ├── PostList.vue    # 内容管理
│   ├── UserList.vue    # 管理员功能
│   └── *.vue           # 其他功能组件
├── router/             # Vue Router配置
├── services/           # API层
│   └── api.ts          # Axios设置和拦截器
├── stores/             # Pinia状态管理
│   └── authStore.ts    # 认证状态
├── types/              # TypeScript类型定义
├── assets/             # 静态资源（图片等）
├── App.vue             # 根组件
└── main.ts             # 应用入口点
```

## 后端结构 (`server/`)
```
server/
├── src/
│   ├── controllers/    # 请求处理器
│   ├── middleware/     # Express中间件（认证等）
│   ├── routes/         # API路由定义
│   ├── index.ts        # Express服务器设置
│   └── seed.ts         # 数据库种子数据
├── prisma/
│   ├── schema.prisma   # 数据库模式定义
│   └── migrations/     # 数据库迁移文件
├── .env.example        # 环境变量模板
└── package.json        # 后端依赖
```

## 关键架构模式

### 前端模式
- **Composition API**: 所有Vue组件使用`<script setup>`语法
- **集中式API**: 单个`api.ts`文件组织所有端点
- **状态管理**: Pinia存储用于认证和全局状态
- **路由守卫**: 路由配置中的认证检查

### 后端模式
- **路由-控制器模式**: 路由定义与业务逻辑分离
- **中间件链**: 认证、CORS、错误处理
- **数据库优先**: Prisma模式驱动TypeScript类型
- **环境配置**: 不同环境的`.env`文件

### 数据流
1. **前端 → API**: Axios请求头中携带JWT令牌
2. **API → 数据库**: Prisma客户端提供类型安全
3. **身份认证**: JWT令牌存储在localStorage中
4. **错误处理**: API拦截器中集中处理

## 文件命名约定
- **Vue组件**: PascalCase（如`UserList.vue`）
- **TypeScript文件**: camelCase（如`authStore.ts`）
- **API端点**: RESTful命名（`/api/users`、`/api/posts`）
- **数据库模型**: Prisma模式中使用PascalCase