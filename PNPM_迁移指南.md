# PNPM 包管理器迁移指南

## 迁移概述

本项目已从 npm 迁移到 pnpm 作为首选包管理器。pnpm 提供了更快的安装速度、更好的磁盘空间利用率和更严格的依赖管理。

## 已完成的迁移步骤

### 1. 清理旧的锁文件
- ✅ 删除了 `package-lock.json` 文件
- ✅ 删除了 `mcp-blog-server/package-lock.json` 文件
- ✅ 保留了 `pnpm-lock.yaml` 文件

### 2. 重新安装依赖
- ✅ 根目录：使用 `pnpm install` 重新安装前端依赖
- ✅ server 目录：使用 `pnpm install` 重新安装后端依赖  
- ✅ mcp-blog-server 目录：使用 `pnpm install` 重新安装 MCP 服务器依赖

### 3. 更新文档
- ✅ 更新了 `.kiro/steering/tech.md` 中的命令说明
- ✅ 更新了 `README.md` 中的安装和使用说明
- ✅ 添加了 `.npmrc` 配置文件
- ✅ 更新了 `.gitignore` 文件

## 新的命令对照表

| 功能 | 旧命令 (npm) | 新命令 (pnpm) |
|------|-------------|---------------|
| 安装依赖 | `npm install` | `pnpm install` |
| 启动开发服务器 | `npm run dev` | `pnpm dev` |
| 构建项目 | `npm run build` | `pnpm build` |
| 运行脚本 | `npm run script` | `pnpm script` |
| 全局执行包 | `npx package` | `pnpm dlx package` |
| 添加依赖 | `npm install package` | `pnpm add package` |
| 添加开发依赖 | `npm install -D package` | `pnpm add -D package` |
| 删除依赖 | `npm uninstall package` | `pnpm remove package` |

## 项目特定命令

### 前端开发
```bash
pnpm dev             # 启动 Vite 开发服务器
pnpm build           # 构建生产版本
pnpm preview         # 预览生产构建
```

### 后端开发
```bash
cd server
pnpm dev             # 启动后端开发服务器
pnpm build           # 编译 TypeScript
pnpm start           # 启动生产服务器
```

### 数据库操作
```bash
cd server
pnpm db:generate     # 生成 Prisma 客户端
pnpm db:migrate      # 运行数据库迁移
pnpm db:push         # 推送模式更改
pnpm db:seed         # 填充种子数据
pnpm dlx prisma studio  # 打开 Prisma Studio
```

### MCP 博客服务器
```bash
cd mcp-blog-server
pnpm dev             # 启动 MCP 服务器开发模式
pnpm build           # 构建 MCP 服务器
pnpm start           # 启动 MCP 服务器
```

## PNPM 的优势

### 1. 性能优势
- **更快的安装速度**：并行下载和链接
- **节省磁盘空间**：全局存储，硬链接复用
- **更快的 CI/CD**：缓存友好的设计

### 2. 依赖管理
- **严格的依赖解析**：避免幽灵依赖
- **更好的 monorepo 支持**：工作空间功能
- **精确的依赖树**：扁平化但不混乱

### 3. 开发体验
- **兼容 npm**：大部分命令相同
- **更好的错误信息**：清晰的依赖冲突提示
- **内置功能**：不需要额外工具

## 配置文件说明

### .npmrc
```ini
# 使用 pnpm 作为包管理器
package-manager=pnpm

# 启用严格的对等依赖检查
strict-peer-dependencies=false

# 自动安装对等依赖
auto-install-peers=true

# 使用符号链接
symlink=true

# 启用 hoisting
hoist=true
```

### .gitignore 更新
```gitignore
# 锁文件 - 只保留 pnpm-lock.yaml
package-lock.json
yarn.lock
# 保留 pnpm-lock.yaml
```

## 团队协作注意事项

1. **统一包管理器**：所有团队成员都应使用 pnpm
2. **锁文件管理**：提交 `pnpm-lock.yaml`，忽略其他锁文件
3. **CI/CD 更新**：更新构建脚本使用 pnpm 命令
4. **文档同步**：确保所有文档都使用新的命令格式

## 故障排除

### 常见问题

1. **依赖安装失败**
   ```bash
   # 清理缓存重新安装
   pnpm store prune
   rm -rf node_modules
   pnpm install
   ```

2. **符号链接问题**
   ```bash
   # 禁用符号链接（Windows 环境）
   pnpm config set symlink false
   ```

3. **权限问题**
   ```bash
   # 检查 pnpm 存储位置
   pnpm store path
   ```

### 回滚方案

如果需要回滚到 npm：
1. 删除 `pnpm-lock.yaml`
2. 删除 `node_modules`
3. 删除 `.npmrc`
4. 运行 `npm install`

## 总结

项目已成功迁移到 pnpm，所有依赖都已重新安装，文档已更新。团队成员现在可以使用 pnpm 命令进行开发，享受更快的安装速度和更好的依赖管理体验。