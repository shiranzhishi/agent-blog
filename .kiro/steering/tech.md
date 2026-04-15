# 技术栈

## 前端技术栈
- **Vue 3** 使用Composition API
- **TypeScript** 提供类型安全
- **Vite** 作为构建工具和开发服务器
- **Vue Router 4** 用于客户端路由
- **Pinia** 状态管理
- **Axios** HTTP请求库，配置拦截器
- **Ant Design Vue** UI组件库

## 后端技术栈
- **Node.js** 配合Express框架
- **TypeScript** 启用严格模式
- **Prisma ORM** 配合PostgreSQL数据库
- **JWT** 用于身份认证
- **bcrypt** 密码加密
- **Zod** 数据验证
- **CORS** 启用跨域请求

## 开发工具
- **tsx** 用于开发环境TypeScript执行
- **vue-tsc** Vue TypeScript类型检查
- **Prisma Studio** 数据库管理界面

## 包管理器
- **pnpm** 作为首选包管理器，提供更快的安装速度和更好的磁盘空间利用率

## 常用命令

### 前端开发
```bash
pnpm dev             # 启动Vite开发服务器 (localhost:5173)
pnpm build           # 生产环境构建 (vue-tsc + vite build)
pnpm preview         # 预览生产构建
```

### 后端开发
```bash
cd server
pnpm dev             # 使用tsx监听模式启动
pnpm build           # 编译TypeScript到dist/目录
pnpm start           # 运行编译后的JavaScript
```

### 数据库操作
```bash
cd server
pnpm db:generate     # 生成Prisma客户端
pnpm db:migrate      # 运行数据库迁移
pnpm db:push         # 推送模式更改到数据库
pnpm db:seed         # 填充种子数据
pnpm dlx prisma studio  # 打开Prisma Studio图形界面
```

## 构建配置
- 前端使用Vite的ES模块
- 后端编译为CommonJS到dist/文件夹
- 前后端都启用TypeScript严格模式
- 生成源码映射用于调试