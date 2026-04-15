# MCP配置回退指南 - HTTP API版本

## 概述

我们已经成功将MCP博客服务器回退到稳定的HTTP API版本。现在需要更新MCP配置以移除数据库相关的环境变量。

## 需要更新的配置

### 1. 工作区MCP配置

请手动更新 `.kiro/settings/mcp.json` 文件：

**当前配置（需要修改）：**
```json
{
  "mcpServers": {
    "blog-server": {
      "command": "node",
      "args": ["./mcp-blog-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://jishenghao:19970309@localhost:5432/testForDemo",
        "BLOG_EMAIL": "jishenghao@qq.com",
        "BLOG_PASSWORD": "12345"
      },
      "disabled": false,
      "autoApprove": ["list_posts", "create_post", "update_post", "publish_post", "update_credentials"]
    }
  }
}
```

**正确配置（HTTP API版本）：**
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

### 2. 主要变更

- ❌ 移除：`DATABASE_URL`
- ✅ 添加：`BLOG_API_URL`

### 3. 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `BLOG_API_URL` | 博客API服务器地址 | `http://localhost:3000/api` |
| `BLOG_EMAIL` | 登录邮箱 | `jishenghao@qq.com` |
| `BLOG_PASSWORD` | 登录密码 | `12345` |

## 使用前提

### 1. 启动后端API服务器

```bash
cd server
pnpm dev
```

确保服务器在 `http://localhost:3000` 正常运行。

### 2. 验证API连接

```bash
curl http://localhost:3000/api/posts
```

应该返回401未授权错误（这是正常的，说明API服务器正在运行）。

## 测试步骤

1. **更新MCP配置**：按照上面的正确配置更新 `.kiro/settings/mcp.json`
2. **重启MCP服务器**：配置更新后会自动重新连接
3. **测试功能**：在对话中尝试使用博客功能

## 测试命令

```
请显示我的所有文章
```

如果配置正确，应该能看到文章列表或者自动登录的提示。

## 故障排除

### 问题1：工具列表为空
- 检查MCP配置是否正确更新
- 确认没有DATABASE_URL环境变量
- 重启Kiro或重新连接MCP服务器

### 问题2：连接失败
- 确保后端API服务器正在运行
- 检查BLOG_API_URL是否正确
- 验证端口3000没有被其他程序占用

### 问题3：登录失败
- 检查BLOG_EMAIL和BLOG_PASSWORD是否正确
- 确认用户在数据库中存在
- 验证密码是否匹配

## 架构说明

**当前架构（HTTP API模式）：**
```
Kiro → MCP服务器 → HTTP请求 → Express服务器 → Prisma → 数据库
```

**优势：**
- ✅ 稳定可靠
- ✅ 易于调试
- ✅ 标准HTTP协议
- ✅ 无复杂依赖

**要求：**
- 需要启动Express服务器
- 需要网络连接到API
- 依赖JWT认证机制

## 完成确认

配置更新完成后，你应该能够：

1. 在对话中创建文章
2. 查看文章列表
3. 发布和更新文章
4. 更新登录凭据

如果遇到问题，请检查：
- MCP配置是否正确
- 后端服务器是否运行
- 网络连接是否正常