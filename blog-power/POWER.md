---
name: blog-power
displayName: 博客发布Power
description: 在Kiro对话中直接发布和管理博客文章
version: 1.0.0
keywords: [blog, 博客, 文章, 发布, 写作, 内容管理]
author: 姬生皓
---

# 博客发布Power

这是一个用于在Kiro对话中直接发布和管理博客文章的Power。

## 功能特性

- ✅ **自动登录**: 无需手动设置JWT令牌，自动使用配置的用户名密码登录
- ✅ **创建文章**: 在对话中直接创建新文章
- ✅ **更新文章**: 修改现有文章内容
- ✅ **发布文章**: 将草稿文章发布上线
- ✅ **文章列表**: 查看所有文章或筛选草稿/已发布文章
- ✅ **凭据管理**: 可以在运行时更新登录凭据

## 快速开始

### 1. 配置登录凭据

默认凭据：
- 邮箱: `jishenghao@qq.com`
- 密码: `12345`

如需修改，可以通过环境变量配置：
```bash
export BLOG_EMAIL="your-email@example.com"
export BLOG_PASSWORD="your-password"
export BLOG_API_URL="http://localhost:3000/api"
```

### 2. 确保博客系统运行

```bash
# 启动后端API
cd server
npm run dev

# 启动前端（新终端）
npm run dev
```

### 3. 在对话中使用

#### 创建并发布文章
```
请帮我创建一篇文章：
标题：Vue 3 Composition API 最佳实践
内容：在现代前端开发中，Vue 3的Composition API为我们提供了更灵活的组件逻辑组织方式...
立即发布：true
```

#### 管理现有文章
```
请显示我的所有草稿文章，然后发布ID为2的文章
```

#### 更新登录凭据
```
请帮我更新登录凭据：
邮箱：new-email@example.com
密码：new-password
```

## 使用场景

### AI内容生成 + 自动发布
```
请帮我生成一篇关于"TypeScript装饰器使用指南"的技术文章，包含代码示例和最佳实践，然后直接发布到博客
```

### 批量内容管理
```
请帮我：
1. 查看所有草稿文章
2. 发布标题包含"Vue"的文章
3. 创建一篇新的React对比文章
```

## 可用工具

- `create_post`: 创建新文章
- `update_post`: 更新现有文章
- `publish_post`: 发布文章
- `list_posts`: 获取文章列表
- `update_credentials`: 更新登录凭据

## 配置选项

### 环境变量
- `BLOG_EMAIL`: 登录邮箱（默认: jishenghao@qq.com）
- `BLOG_PASSWORD`: 登录密码（默认: 12345）
- `BLOG_API_URL`: API基础URL（默认: http://localhost:3000/api）

## 故障排除

### 常见问题

**Q: 提示"登录失败"**
A: 检查环境变量中的邮箱和密码是否正确

**Q: API连接失败**
A: 确保博客服务器在 http://localhost:3000 正常运行

**Q: 权限不足**
A: 检查用户是否有权限操作该文章（只能操作自己的文章）

## 技术特性

- **TypeScript**: 完整的类型安全
- **自动重连**: Token过期时自动重新登录
- **错误处理**: 友好的错误提示和解决建议
- **配置灵活**: 支持环境变量配置
- **安全认证**: JWT令牌自动管理

## 版本信息

- **版本**: 1.0.0
- **兼容性**: Kiro Powers系统
- **依赖**: 需要安装MCP服务器依赖