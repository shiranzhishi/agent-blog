# 博客MCP服务器

这是一个Model Context Protocol (MCP) 服务器，用于在Kiro对话中直接发布和管理博客文章。

## 功能特性

- ✅ **自动登录**: 无需手动设置JWT令牌，自动使用配置的用户名密码登录
- ✅ **创建文章**: 在对话中直接创建新文章
- ✅ **更新文章**: 修改现有文章内容
- ✅ **发布文章**: 将草稿文章发布上线
- ✅ **文章列表**: 查看所有文章或筛选草稿/已发布文章
- ✅ **凭据管理**: 可以在运行时更新登录凭据

## 安装和配置

### 1. 安装依赖

```bash
cd mcp-blog-server
pnpm install
```

### 2. 配置登录凭据

创建或编辑 `config.json` 文件：

```json
{
  "credentials": {
    "email": "your-email@example.com",
    "password": "your-password"
  },
  "apiBaseUrl": "http://localhost:3000/api"
}
```

**默认配置：**
- 邮箱: `jishenghao@qq.com`
- 密码: `12345`
- API地址: `http://localhost:3000/api`

### 3. 构建项目

```bash
pnpm build
```

### 4. 启动后端API服务器

```bash
cd ../server
pnpm dev
```

确保博客API服务器在 `http://localhost:3000` 正常运行。

### 5. 配置Kiro MCP

MCP配置应该在 `.kiro/settings/mcp.json`：

```json
{
  "mcpServers": {
    "blog-server": {
      "command": "node",
      "args": ["./mcp-blog-server/dist/index.js"],
      "env": {
        "BLOG_API_URL": "http://localhost:3000/api",
        "BLOG_EMAIL": "jishenghao@qq.com",
        "BLOG_PASSWORD": "12345"
      },
      "disabled": false,
      "autoApprove": ["list_posts", "create_post", "update_post", "publish_post", "update_credentials"]
    }
  }
}
```

## 使用方法

### 🚀 直接使用（无需设置令牌）

现在可以直接在对话中使用，系统会自动登录：

```
请帮我创建一篇文章：
标题：Vue 3 开发最佳实践
内容：这是一篇关于Vue 3开发的文章...
发布：false（保存为草稿）
```

### 📝 创建文章

```
请帮我创建一篇技术文章：
- 标题：TypeScript进阶技巧
- 内容：详细介绍TypeScript的高级特性...
- 立即发布：true
```

### 🚀 发布文章

```
请帮我发布ID为1的文章
```

### 📚 查看文章列表

```
请显示所有草稿文章
```

### 🔐 更新登录凭据

```
请帮我更新登录凭据：
邮箱：new-email@example.com
密码：new-password
```

## 可用工具

| 工具名称 | 描述 | 参数 |
|---------|------|------|
| `create_post` | 创建新文章 | title(必需), content, published |
| `update_post` | 更新现有文章 | id(必需), title, content, published |
| `publish_post` | 发布文章 | id(必需) |
| `list_posts` | 获取文章列表 | published(可选) |
| `update_credentials` | 更新登录凭据 | email(必需), password(必需) |

## 配置选项

### 配置文件 (config.json)
```json
{
  "credentials": {
    "email": "登录邮箱",
    "password": "登录密码"
  },
  "apiBaseUrl": "API基础URL"
}
```

### 环境变量
- `BLOG_API_URL`: 博客API的基础URL
- `BLOG_EMAIL`: 登录邮箱
- `BLOG_PASSWORD`: 登录密码

**优先级**: 环境变量 > 配置文件 > 默认值

## 开发模式

```bash
pnpm dev
```

## 故障排除

### 常见问题

**Q: 提示"登录失败"**
A: 检查 `config.json` 中的邮箱和密码是否正确，确保用户在博客系统中存在

**Q: 提示"403 没有足够的权限"**
A: 检查用户是否有权限操作该文章（只能操作自己的文章）

**Q: 连接失败**
A: 确保博客API服务器正在运行（默认端口3000）

**Q: 自动登录失败**
A: 
1. 检查配置文件格式是否正确
2. 确认用户名密码是否正确
3. 检查API服务器是否可访问

### 调试步骤

1. **检查配置文件**
   ```bash
   cat mcp-blog-server/config.json
   ```

2. **测试API连接**
   ```bash
   curl http://localhost:3000/api/posts
   ```

3. **测试登录**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"jishenghao@qq.com","password":"12345"}'
   ```

4. **重新构建MCP服务器**
   ```bash
   cd mcp-blog-server
   pnpm build
   ```

## 架构说明

### HTTP API模式
```
Kiro → MCP服务器 → HTTP请求 → Express服务器 → Prisma → PostgreSQL
```

### 优势
- ✅ **稳定可靠** - 成熟的HTTP协议
- ✅ **易于调试** - 标准的REST API
- ✅ **兼容性好** - 无特殊依赖要求
- ✅ **安全认证** - JWT令牌机制

### 要求
- 需要启动Express API服务器
- 需要网络连接到API端点
- 依赖JWT身份认证

## 技术栈

- **MCP SDK** - Model Context Protocol实现
- **Axios** - HTTP请求库
- **TypeScript** - 类型安全
- **Zod** - 数据验证
- **JWT** - 身份认证令牌

## 版本信息

- **版本**: 1.0.0
- **模式**: HTTP API
- **兼容性**: 需要Express后端服务器