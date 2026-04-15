# 博客发布Power - 快速开始

## 🚀 快速开始

### 1. 确保博客系统运行

在使用这个Power之前，请确保你的博客系统正在运行：

```bash
# 启动后端API
cd server
npm run dev

# 启动前端（新终端）
npm run dev
```

### 2. 配置登录凭据（可选）

默认凭据已设置为：
- 邮箱: `jishenghao@qq.com`
- 密码: `12345`

如需修改，可以通过环境变量配置：
```bash
export BLOG_EMAIL="your-email@example.com"
export BLOG_PASSWORD="your-password"
export BLOG_API_URL="http://localhost:3000/api"
```

### 3. 开始使用

现在你可以在Kiro对话中直接使用博客功能：

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

## 🎨 使用场景

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

## 🛠️ 故障排除

### 常见问题

**Q: 提示"登录失败"**
A: 检查环境变量中的邮箱和密码是否正确

**Q: API连接失败**
A: 确保博客服务器在 http://localhost:3000 正常运行

**Q: 权限不足**
A: 检查用户是否有权限操作该文章（只能操作自己的文章）

## 🔧 可用工具

- `create_post`: 创建新文章
- `update_post`: 更新现有文章
- `publish_post`: 发布文章
- `list_posts`: 获取文章列表
- `update_credentials`: 更新登录凭据