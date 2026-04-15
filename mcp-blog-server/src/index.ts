#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置文件验证模式
const configFileSchema = z.object({
  credentials: z.object({
    email: z.string().email('邮箱格式不正确'),
    password: z.string().min(1, '密码不能为空'),
  }),
  apiBaseUrl: z.string().default('http://localhost:3000/api'),
});

// 运行时配置验证模式
const runtimeConfigSchema = z.object({
  apiBaseUrl: z.string(),
  credentials: z.object({
    email: z.string(),
    password: z.string(),
  }),
  authToken: z.string().optional(),
});

// 文章创建参数验证
const createPostSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  content: z.string().optional(),
  published: z.boolean().default(false),
});

// 文章更新参数验证
const updatePostSchema = z.object({
  id: z.number().int().positive('文章ID必须是正整数'),
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  published: z.boolean().optional(),
});

class BlogMCPServer {
  private server: Server;
  private config: z.infer<typeof runtimeConfigSchema>;

  constructor() {
    this.server = new Server(
      {
        name: 'blog-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // 加载配置
    this.config = this.loadConfig();
    this.setupHandlers();
  }

  private loadConfig(): z.infer<typeof runtimeConfigSchema> {
    // 尝试从配置文件加载
    const configPath = join(__dirname, '../config.json');
    let fileConfig: any = {};
    
    if (existsSync(configPath)) {
      try {
        const configContent = readFileSync(configPath, 'utf-8');
        fileConfig = JSON.parse(configContent);
        console.error('📁 已加载配置文件:', configPath);
      } catch (error) {
        console.error('⚠️ 配置文件解析失败，使用默认配置:', error);
      }
    } else {
      console.error('⚠️ 配置文件不存在，使用默认配置');
    }

    // 合并环境变量和文件配置
    const mergedConfig = {
      apiBaseUrl: process.env.BLOG_API_URL || fileConfig.apiBaseUrl || 'http://localhost:3000/api',
      credentials: {
        email: process.env.BLOG_EMAIL || fileConfig.credentials?.email || 'jishenghao@qq.com',
        password: process.env.BLOG_PASSWORD || fileConfig.credentials?.password || '12345',
      },
    };

    try {
      // 验证配置
      const validatedConfig = configFileSchema.parse(mergedConfig);
      console.error('✅ 配置验证成功');
      console.error('📧 登录邮箱:', validatedConfig.credentials.email);
      console.error('🌐 API地址:', validatedConfig.apiBaseUrl);
      
      return {
        ...validatedConfig,
        authToken: undefined, // 初始时没有token
      };
    } catch (error) {
      console.error('❌ 配置验证失败:', error);
      throw new Error('配置文件格式错误，请检查config.json文件');
    }
  }

  // 自动登录获取token
  private async ensureAuthenticated(): Promise<void> {
    if (this.config.authToken) {
      // 检查token是否仍然有效
      try {
        await axios.get(`${this.config.apiBaseUrl}/posts`, {
          headers: { Authorization: `Bearer ${this.config.authToken}` },
        });
        return; // token仍然有效
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.error('🔄 当前token已失效，重新登录...');
          this.config.authToken = undefined;
        } else {
          // 非认证问题，直接抛出
          throw error;
        }
      }
    }

    // 执行登录
    try {
      console.error('🔐 正在自动登录...');
      const response = await axios.post(`${this.config.apiBaseUrl}/auth/login`, {
        email: this.config.credentials.email,
        password: this.config.credentials.password,
      });

      this.config.authToken = response.data.token;
      console.error('✅ 自动登录成功');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || '未知错误';
      console.error('❌ 自动登录失败:', errorMsg);
      throw new Error(`登录失败: ${errorMsg}。请检查config.json中的用户名和密码是否正确。`);
    }
  }

  private setupHandlers() {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_post',
            description: '创建新的博客文章',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: '文章标题',
                },
                content: {
                  type: 'string',
                  description: '文章内容（支持Markdown格式）',
                },
                published: {
                  type: 'boolean',
                  description: '是否立即发布（默认为false，保存为草稿）',
                  default: false,
                },
              },
              required: ['title'],
            },
          },
          {
            name: 'update_post',
            description: '更新现有的博客文章',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: '文章ID',
                },
                title: {
                  type: 'string',
                  description: '文章标题',
                },
                content: {
                  type: 'string',
                  description: '文章内容',
                },
                published: {
                  type: 'boolean',
                  description: '是否发布',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'publish_post',
            description: '发布指定的文章',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: '要发布的文章ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'list_posts',
            description: '获取文章列表',
            inputSchema: {
              type: 'object',
              properties: {
                published: {
                  type: 'boolean',
                  description: '筛选已发布或草稿文章（不指定则返回所有）',
                },
              },
            },
          },
          {
            name: 'get_post',
            description: '根据ID查询文章详情',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: '文章ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'delete_post',
            description: '删除指定的文章',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: '要删除的文章ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'update_credentials',
            description: '更新登录凭据（用户名和密码）',
            inputSchema: {
              type: 'object',
              properties: {
                email: {
                  type: 'string',
                  description: '登录邮箱',
                },
                password: {
                  type: 'string',
                  description: '登录密码',
                },
              },
              required: ['email', 'password'],
            },
          },
        ],
      };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_post':
            return await this.createPost(args);
          case 'update_post':
            return await this.updatePost(args);
          case 'publish_post':
            return await this.publishPost(args);
          case 'get_post':
            return await this.getPost(args);
          case 'delete_post':
            return await this.deletePost(args);
          case 'list_posts':
            return await this.listPosts(args);
          case 'update_credentials':
            return await this.updateCredentials(args);
          default:
            throw new Error(`未知的工具: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${error instanceof Error ? error.message : '未知错误'}`,
            },
          ],
        };
      }
    });
  }

  private async createPost(args: any) {
    const validatedArgs = createPostSchema.parse(args);
    
    // 确保已认证
    await this.ensureAuthenticated();

    const response = await axios.post(
      `${this.config.apiBaseUrl}/posts`,
      validatedArgs,
      {
        headers: {
          Authorization: `Bearer ${this.config.authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const post = response.data;
    const status = post.published ? '已发布' : '已保存为草稿';
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ 文章创建成功！\n\n📝 标题: ${post.title}\n📊 状态: ${status}\n🆔 文章ID: ${post.id}\n⏰ 创建时间: ${new Date(post.createdAt).toLocaleString('zh-CN')}`,
        },
      ],
    };
  }

  private async updatePost(args: any) {
    const validatedArgs = updatePostSchema.parse(args);
    
    // 确保已认证
    await this.ensureAuthenticated();

    const { id, ...updateData } = validatedArgs;
    
    const response = await axios.put(
      `${this.config.apiBaseUrl}/posts/${id}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${this.config.authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const post = response.data;
    const status = post.published ? '已发布' : '草稿';
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ 文章更新成功！\n\n📝 标题: ${post.title}\n📊 状态: ${status}\n🆔 文章ID: ${post.id}\n⏰ 更新时间: ${new Date(post.updatedAt).toLocaleString('zh-CN')}`,
        },
      ],
    };
  }

  private async publishPost(args: any) {
    const { id } = z.object({ id: z.number() }).parse(args);
    
    // 确保已认证
    await this.ensureAuthenticated();

    const response = await axios.patch(
      `${this.config.apiBaseUrl}/posts/${id}/publish`,
      {},
      {
        headers: {
          Authorization: `Bearer ${this.config.authToken}`,
        },
      }
    );

    const post = response.data;
    
    return {
      content: [
        {
          type: 'text',
          text: `🚀 文章发布成功！\n\n📝 标题: ${post.title}\n🆔 文章ID: ${post.id}\n⏰ 发布时间: ${new Date().toLocaleString('zh-CN')}`,
        },
      ],
    };
  }

  private async getPost(args: any) {
    const { id } = z.object({ id: z.number().int().positive('文章ID必须是正整数') }).parse(args);

    // 确保已认证
    await this.ensureAuthenticated();

    const response = await axios.get(
      `${this.config.apiBaseUrl}/posts/${id}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.authToken}`,
        },
      }
    );

    const post = response.data;
    const status = post.published ? '✅ 已发布' : '📝 草稿';
    const author = post.author?.name || post.author?.email || '未知';
    const content = post.content
      ? (post.content.length > 500 ? post.content.substring(0, 500) + '...(内容已截断)' : post.content)
      : '(无内容)';

    return {
      content: [
        {
          type: 'text',
          text: `📖 文章详情\n\n🆔 ID: ${post.id}\n📝 标题: ${post.title}\n📊 状态: ${status}\n✍️ 作者: ${author}\n⏰ 创建时间: ${new Date(post.createdAt).toLocaleString('zh-CN')}\n🔄 更新时间: ${new Date(post.updatedAt).toLocaleString('zh-CN')}\n\n📄 内容:\n${content}`,
        },
      ],
    };
  }

  private async deletePost(args: any) {
    const { id } = z.object({ id: z.number() }).parse(args);
    
    // 确保已认证
    await this.ensureAuthenticated();

    // 先获取文章信息用于确认
    const getResponse = await axios.get(
      `${this.config.apiBaseUrl}/posts/${id}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.authToken}`,
        },
      }
    );

    const post = getResponse.data;

    // 执行删除
    await axios.delete(
      `${this.config.apiBaseUrl}/posts/${id}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.authToken}`,
        },
      }
    );
    
    return {
      content: [
        {
          type: 'text',
          text: `🗑️ 文章删除成功！\n\n📝 已删除文章: ${post.title}\n🆔 文章ID: ${post.id}\n⏰ 删除时间: ${new Date().toLocaleString('zh-CN')}`,
        },
      ],
    };
  }

  private async listPosts(args: any) {
    const { published } = z.object({ published: z.boolean().optional() }).parse(args);
    
    // 确保已认证
    await this.ensureAuthenticated();

    const params = published !== undefined ? { published } : {};
    
    const response = await axios.get(`${this.config.apiBaseUrl}/posts`, {
      params,
      headers: {
        Authorization: `Bearer ${this.config.authToken}`,
      },
    });

    const posts = response.data;
    
    if (posts.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '📝 暂无文章',
          },
        ],
      };
    }

    const postList = posts
      .map((post: any) => {
        const status = post.published ? '✅ 已发布' : '📝 草稿';
        const date = new Date(post.createdAt).toLocaleDateString('zh-CN');
        return `${post.id}. ${post.title} (${status}) - ${date}`;
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `📚 文章列表 (共 ${posts.length} 篇):\n\n${postList}`,
        },
      ],
    };
  }

  private async updateCredentials(args: any) {
    const { email, password } = z.object({ 
      email: z.string().email('邮箱格式不正确'), 
      password: z.string().min(1, '密码不能为空') 
    }).parse(args);
    
    // 更新配置中的凭据
    this.config.credentials.email = email;
    this.config.credentials.password = password;
    this.config.authToken = undefined; // 清除旧token
    
    // 尝试使用新凭据登录
    try {
      await this.ensureAuthenticated();
      return {
        content: [
          {
            type: 'text',
            text: `🔐 登录凭据更新成功！\n📧 新邮箱: ${email}\n✅ 已自动登录验证`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ 凭据更新失败: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('博客MCP服务器已启动');
  }
}

const server = new BlogMCPServer();
server.run().catch(console.error);