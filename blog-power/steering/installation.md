# 博客发布Power - 安装指南

## 📦 Power包结构

你的博客发布Power现在符合Kiro Powers规范：

```
blog-power/
├── POWER.md                    # Power主文档（包含YAML frontmatter）
├── mcp.json                    # MCP服务器配置
└── steering/                   # 指导文档
    ├── getting-started.md      # 快速开始指南
    └── installation.md         # 本安装指南
```

## 🚀 安装步骤

### 1. 确保MCP服务器已构建

在安装Power之前，确保MCP服务器已经构建：

```bash
cd mcp-blog-server
npm install
npm run build
```

### 2. 通过Kiro Powers UI安装

1. **打开Powers配置面板**
   - 在Kiro中说："请打开Powers配置面板"
   - 或使用命令面板搜索"Powers"

2. **安装本地Power**
   - 在Powers面板中选择"安装本地Power"或"添加Power"
   - 浏览并选择 `blog-power` 文件夹
   - 确认安装

### 3. 验证安装

安装完成后，在Kiro对话中测试：

```
请显示我安装的所有Powers
```

你应该能看到"博客发布Power"在列表中。

## ⚙️ 配置选项

### 环境变量配置

Power支持通过环境变量配置：

```bash
# 设置登录凭据
export BLOG_EMAIL="your-email@example.com"
export BLOG_PASSWORD="your-password"
export BLOG_API_URL="http://localhost:3000/api"
```

### 默认配置

如果不设置环境变量，将使用以下默认值：
- 邮箱: `jishenghao@qq.com`
- 密码: `12345`
- API地址: `http://localhost:3000/api`

## 📋 使用前检查清单

在使用Power之前，请确保：

- [ ] MCP服务器已构建 (`mcp-blog-server/dist/index.js` 存在)
- [ ] 博客后端API正在运行 (`cd server && npm run dev`)
- [ ] 博客前端正在运行 (`npm run dev`)
- [ ] 环境变量配置正确（如果需要自定义）
- [ ] 网络连接正常，可以访问API

## 🎯 测试功能

安装成功后，测试以下功能：

### 基础功能测试
```
# 测试1：创建文章
请帮我创建一篇文章：
标题：测试文章
内容：这是一篇测试文章

# 测试2：查看文章列表
请显示我的所有文章

# 测试3：发布文章（如果有草稿）
请发布ID为1的文章
```

### 高级功能测试
```
# 测试4：AI生成内容
请帮我生成一篇关于"JavaScript异步编程"的技术文章并发布

# 测试5：批量管理
请显示所有草稿文章，然后发布第一篇
```

## 🛠️ 故障排除

### Power安装失败

**Q: 提示"Power validation failed"**
A: 确保Power包只包含允许的文件（POWER.md, mcp.json, steering/*.md）

**Q: 提示"POWER.md must start with YAML frontmatter"**
A: 确保POWER.md文件以 `---` 开头的YAML frontmatter

### 功能无法使用

**Q: MCP服务器无法连接**
A: 
1. 检查 `mcp-blog-server/dist/index.js` 是否存在
2. 确保MCP服务器已正确构建
3. 检查mcp.json中的路径是否正确

**Q: 登录失败**
A: 
1. 检查环境变量配置
2. 确保博客API服务器正在运行
3. 验证用户凭据是否正确

## 🎉 成功安装

如果所有测试都通过，恭喜你！博客发布Power已经成功安装。

现在你可以在Kiro对话中直接：
- 创建和发布博客文章
- 管理现有文章
- 使用AI生成内容并自动发布
- 批量管理文章

享受无缝的博客写作体验！🎊