import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { auth, optionalAuth } from '../middleware/auth'; // 导入新中间件

const router: express.Router = express.Router();
const prisma = new PrismaClient();

// 验证模式
const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  published: z.boolean().optional()
});

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  published: z.boolean().optional()
});

// 获取所有帖子 - 公开接口，但可以根据权限过滤，支持搜索参数
router.get('/', optionalAuth, async (req, res) => { // 使用optionalAuth中间件
  try {
    const { published, title, author, dateFrom, dateTo } = req.query;
    const where: any = {};
    
    // 基础权限过滤
    // 如果未登录，只能看到已发布的帖子
    if (!req.user) { // 现在可以直接检查req.user是否存在
      where.published = true;
    } 
    // 如果已登录但不是管理员，只能看到自己的帖子和已发布的帖子
    else if (req.user.role !== 'ADMIN') {
      where.OR = [
        { published: true },
        { authorId: req.user.id }
      ];
    }
    // 管理员可以看到所有帖子
    
    // 搜索过滤条件
    if (published !== undefined) {
      where.published = published === 'true';
    }
    
    // 标题搜索 - 不区分大小写的模糊匹配
    if (title && typeof title === 'string') {
      where.title = {
        contains: title,
        mode: 'insensitive'
      };
    }
    
    // 作者搜索 - 支持按作者名称或邮箱搜索
    if (author && typeof author === 'string') {
      where.author = {
        OR: [
          {
            name: {
              contains: author,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: author,
              mode: 'insensitive'
            }
          }
        ]
      };
    }
    
    // 时间范围过滤
    if (dateFrom || dateTo) {
      where.createdAt = {};
      
      if (dateFrom && typeof dateFrom === 'string') {
        where.createdAt.gte = new Date(dateFrom);
      }
      
      if (dateTo && typeof dateTo === 'string') {
        // 将结束日期设置为当天的23:59:59
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }
    
    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            _count: { select: { posts: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(posts);
  } catch (error) {
    console.error('获取帖子列表失败:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// 搜索帖子 - 专门的搜索端点
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { title, author, published, dateFrom, dateTo, page = 1, pageSize = 10 } = req.query;
    const where: any = {};
    
    // 基础权限过滤
    if (!req.user) {
      where.published = true;
    } else if (req.user.role !== 'ADMIN') {
      where.OR = [
        { published: true },
        { authorId: req.user.id }
      ];
    }
    
    // 搜索过滤条件
    if (published !== undefined) {
      where.published = published === 'true';
    }
    
    if (title && typeof title === 'string') {
      where.title = {
        contains: title,
        mode: 'insensitive'
      };
    }
    
    if (author && typeof author === 'string') {
      where.author = {
        OR: [
          {
            name: {
              contains: author,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: author,
              mode: 'insensitive'
            }
          }
        ]
      };
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      
      if (dateFrom && typeof dateFrom === 'string') {
        where.createdAt.gte = new Date(dateFrom);
      }
      
      if (dateTo && typeof dateTo === 'string') {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }
    
    // 分页参数
    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 10;
    const skip = (pageNum - 1) * pageSizeNum;
    
    // 获取总数和分页数据
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              _count: { select: { posts: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSizeNum
      }),
      prisma.post.count({ where })
    ]);
    
    res.json({
      posts,
      pagination: {
        current: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum)
      }
    });
  } catch (error) {
    console.error('搜索帖子失败:', error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

// 获取帖子详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }
    
    const where: any = { id: postId };
    
    // 权限检查：未登录用户只能看已发布的帖子
    if (!req.user) {
      where.published = true;
    } else if (req.user.role !== 'ADMIN') {
      // 非管理员只能看自己的帖子或已发布的帖子
      where.OR = [
        { published: true },
        { authorId: req.user.id }
      ];
    }
    
    const post = await prisma.post.findFirst({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            _count: { select: { posts: true } }
          }
        }
      }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// 创建帖子 - 需要登录
router.post('/', auth, async (req, res) => {
  try {
    const validatedData = createPostSchema.parse(req.body);
    
    // 使用当前登录用户的ID作为作者ID
    const post = await prisma.post.create({
      data: {
        ...validatedData,
        authorId: req.user!.id // 从JWT token中获取用户ID
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    res.status(201).json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// 更新帖子 - 作者可以更新自己的帖子，管理员可以更新所有
router.put('/:id', auth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const validatedData = updatePostSchema.parse(req.body);
    
    // 检查帖子是否存在并验证权限
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (req.user?.role !== 'ADMIN' && req.user?.id !== post.authorId) {
      return res.status(403).json({ error: '没有足够的权限' });
    }
    
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: validatedData,
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });
    
    res.json(updatedPost);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// 删除帖子 - 作者可以删除自己的帖子，管理员可以删除所有
router.delete('/:id', auth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    // 检查帖子是否存在并验证权限
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (req.user?.role !== 'ADMIN' && req.user?.id !== post.authorId) {
      return res.status(403).json({ error: '没有足够的权限' });
    }
    
    await prisma.post.delete({ where: { id: postId } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// 发布帖子 - 作者可以发布自己的帖子，管理员可以发布所有
router.patch('/:id/publish', auth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    // 检查帖子是否存在并验证权限
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (req.user?.role !== 'ADMIN' && req.user?.id !== post.authorId) {
      return res.status(403).json({ error: '没有足够的权限' });
    }
    
    const publishedPost = await prisma.post.update({
      where: { id: postId },
      data: { published: true },
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });
    
    res.json(publishedPost);
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

export default router;