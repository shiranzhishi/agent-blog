# 代码高亮使用指南

## 概述

我们的Markdown系统集成了`highlight.js`，支持100+种编程语言的语法高亮。无论是在PostCreate编辑器中预览，还是在PostDetail详情页面查看，都会自动应用代码高亮。

## 基本用法

### 1. 行内代码

使用单个反引号包围代码：

```markdown
这是一个 `console.log('Hello World')` 行内代码示例。
```

**效果：**
这是一个 `console.log('Hello World')` 行内代码示例。

### 2. 代码块

使用三个反引号包围代码块，并指定语言：

````markdown
```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
  return `Welcome, ${name}`;
}

greet('World');
```
````

**效果：**
```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
  return `Welcome, ${name}`;
}

greet('World');
```

## 支持的编程语言

### 前端开发

#### JavaScript
````markdown
```javascript
// ES6+ 语法支持
const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};

// 类和模块
class Component {
  constructor(props) {
    this.props = props;
  }
  
  render() {
    return `<div>${this.props.title}</div>`;
  }
}

export default Component;
```
````

#### TypeScript
````markdown
```typescript
interface User {
  id: number;
  name: string;
  email?: string;
}

class UserService {
  private users: User[] = [];
  
  addUser(user: User): void {
    this.users.push(user);
  }
  
  findUser(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }
}

// 泛型和高级类型
type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
};
```
````

#### Vue.js
````markdown
```vue
<template>
  <div class="user-card">
    <h3>{{ user.name }}</h3>
    <p v-if="user.email">{{ user.email }}</p>
    <button @click="handleClick">Contact</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface User {
  name: string;
  email?: string;
}

const props = defineProps<{
  user: User;
}>();

const isActive = ref(false);

const handleClick = () => {
  isActive.value = !isActive.value;
};
</script>

<style scoped>
.user-card {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
</style>
```
````

#### CSS/SCSS
````markdown
```css
/* CSS变量和现代特性 */
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --border-radius: 8px;
}

.card {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border-radius: var(--border-radius);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
}

/* Grid和Flexbox */
.layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
```
````

````markdown
```scss
// SCSS/Sass 语法
$primary-color: #3498db;
$secondary-color: #2ecc71;

@mixin button-style($bg-color, $text-color: white) {
  background-color: $bg-color;
  color: $text-color;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: darken($bg-color, 10%);
  }
}

.btn-primary {
  @include button-style($primary-color);
}

.btn-secondary {
  @include button-style($secondary-color);
}
```
````

### 后端开发

#### Python
````markdown
```python
# Python 类和装饰器
from typing import List, Optional
import asyncio

class UserRepository:
    def __init__(self, db_connection):
        self.db = db_connection
    
    async def find_user(self, user_id: int) -> Optional[dict]:
        query = "SELECT * FROM users WHERE id = ?"
        result = await self.db.fetch_one(query, user_id)
        return result
    
    async def create_user(self, user_data: dict) -> int:
        query = """
        INSERT INTO users (name, email, created_at) 
        VALUES (?, ?, NOW())
        """
        return await self.db.execute(query, user_data['name'], user_data['email'])

# 装饰器和上下文管理器
def retry(max_attempts: int = 3):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise e
                    await asyncio.sleep(2 ** attempt)
        return wrapper
    return decorator

@retry(max_attempts=3)
async def fetch_data(url: str) -> dict:
    # 实现数据获取逻辑
    pass
```
````

#### Node.js/Express
````markdown
```javascript
// Express.js API
const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const app = express();

// 中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// 路由和验证
app.post('/api/users', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await createUser(req.body);
    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```
````

### 数据库

#### SQL
````markdown
```sql
-- 复杂查询和窗口函数
WITH user_stats AS (
  SELECT 
    u.id,
    u.name,
    COUNT(p.id) as post_count,
    AVG(p.views) as avg_views,
    ROW_NUMBER() OVER (ORDER BY COUNT(p.id) DESC) as rank
  FROM users u
  LEFT JOIN posts p ON u.id = p.author_id
  WHERE u.created_at >= '2024-01-01'
  GROUP BY u.id, u.name
)
SELECT 
  name,
  post_count,
  ROUND(avg_views, 2) as avg_views,
  rank,
  CASE 
    WHEN rank <= 10 THEN 'Top Author'
    WHEN rank <= 50 THEN 'Active Author'
    ELSE 'Regular Author'
  END as author_level
FROM user_stats
WHERE post_count > 0
ORDER BY rank;

-- 存储过程
DELIMITER //
CREATE PROCEDURE GetUserPosts(
  IN user_id INT,
  IN limit_count INT DEFAULT 10
)
BEGIN
  SELECT 
    p.id,
    p.title,
    p.content,
    p.created_at,
    COUNT(c.id) as comment_count
  FROM posts p
  LEFT JOIN comments c ON p.id = c.post_id
  WHERE p.author_id = user_id
  GROUP BY p.id
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END //
DELIMITER ;
```
````

### 配置文件

#### JSON
````markdown
```json
{
  "name": "my-vue3-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.13",
    "vue-router": "^4.6.3",
    "pinia": "^3.0.3"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.1",
    "typescript": "~5.6.2",
    "vite": "^6.0.3"
  }
}
```
````

#### YAML
````markdown
```yaml
# Docker Compose 配置
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```
````

### Shell脚本

#### Bash
````markdown
```bash
#!/bin/bash

# 部署脚本
set -e

PROJECT_DIR="/var/www/myapp"
BACKUP_DIR="/var/backups/myapp"
LOG_FILE="/var/log/deploy.log"

# 函数定义
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

backup_current() {
  if [ -d "$PROJECT_DIR" ]; then
    log "Creating backup..."
    tar -czf "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C "$PROJECT_DIR" .
  fi
}

deploy() {
  log "Starting deployment..."
  
  # 备份当前版本
  backup_current
  
  # 拉取最新代码
  cd "$PROJECT_DIR"
  git pull origin main
  
  # 安装依赖
  pnpm install --frozen-lockfile
  
  # 构建项目
  pnpm run build
  
  # 重启服务
  sudo systemctl restart myapp
  
  log "Deployment completed successfully!"
}

# 主执行逻辑
case "$1" in
  deploy)
    deploy
    ;;
  backup)
    backup_current
    ;;
  *)
    echo "Usage: $0 {deploy|backup}"
    exit 1
    ;;
esac
```
````

## 高级功能

### 1. 代码块标题

````markdown
```javascript title="utils/api.js"
export const fetchUserData = async (userId) => {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
};
```
````

### 2. 行号显示

我们的系统会自动为代码块添加行号（通过CSS实现）。

### 3. 代码复制功能

每个代码块都会自动添加复制按钮，用户可以一键复制代码。

### 4. 语言检测

如果不指定语言，系统会尝试自动检测：

````markdown
```
function autoDetect() {
  console.log('This will be detected as JavaScript');
}
```
````

## 样式自定义

### 主题配置

我们使用GitHub风格的代码高亮主题，你可以在`markdownCache.ts`中修改：

```typescript
import 'highlight.js/styles/github.css';  // 当前主题

// 其他可选主题：
// import 'highlight.js/styles/github-dark.css';
// import 'highlight.js/styles/vs2015.css';
// import 'highlight.js/styles/atom-one-dark.css';
```

### CSS自定义

在组件样式中可以进一步自定义：

```css
/* 代码块容器 */
.optimized-markdown-renderer .code-block-wrapper {
  position: relative;
  margin: 16px 0;
}

/* 代码高亮样式 */
.optimized-markdown-renderer .markdown-content pre.hljs {
  background-color: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 14px;
  line-height: 1.5;
}

/* 复制按钮 */
.optimized-markdown-renderer .code-block-wrapper .copy-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #d0d7de;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
}
```

## 使用技巧

### 1. 选择合适的语言标识符

常用语言标识符：
- `javascript` 或 `js`
- `typescript` 或 `ts`
- `python` 或 `py`
- `java`
- `csharp` 或 `cs`
- `cpp` 或 `c++`
- `html`
- `css`
- `scss` 或 `sass`
- `json`
- `yaml` 或 `yml`
- `xml`
- `sql`
- `bash` 或 `shell`
- `dockerfile`

### 2. 代码格式化

在粘贴代码前，建议先格式化：
- JavaScript/TypeScript: 使用Prettier
- Python: 使用Black或autopep8
- Java: 使用Google Java Format

### 3. 注释和文档

在代码中添加适当的注释：

````markdown
```javascript
/**
 * 用户认证服务
 * @class AuthService
 */
class AuthService {
  /**
   * 用户登录
   * @param {string} email - 用户邮箱
   * @param {string} password - 用户密码
   * @returns {Promise<Object>} 登录结果
   */
  async login(email, password) {
    // 验证输入参数
    if (!email || !password) {
      throw new Error('邮箱和密码不能为空');
    }
    
    // 调用API进行认证
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    return response.json();
  }
}
```
````

## 故障排除

### 1. 代码不高亮

**可能原因：**
- 语言标识符错误
- 代码块格式不正确
- highlight.js未正确加载

**解决方法：**
- 检查语言标识符是否正确
- 确保使用三个反引号包围代码
- 检查浏览器控制台是否有错误

### 2. 复制按钮不显示

**可能原因：**
- JavaScript未正确执行
- CSS样式被覆盖

**解决方法：**
- 检查浏览器控制台错误
- 确认OptimizedMarkdownRenderer组件正常工作

### 3. 样式显示异常

**可能原因：**
- CSS冲突
- 主题文件未加载

**解决方法：**
- 检查CSS加载顺序
- 确认highlight.js样式文件正确导入

## 总结

我们的代码高亮系统提供了：

✅ **100+种语言支持**  
✅ **自动语言检测**  
✅ **一键复制功能**  
✅ **GitHub风格主题**  
✅ **响应式设计**  
✅ **性能优化缓存**  

无论是在PostCreate编辑器中预览，还是在PostDetail详情页面查看，都能享受到一致的高质量代码高亮体验。