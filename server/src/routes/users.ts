import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { auth, authorize } from '../middleware/auth';

const router: express.Router = express.Router();
const prisma = new PrismaClient();

// 验证模式
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).default('USER')
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional()
});

// 获取所有用户
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        posts: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// 获取单个用户
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // 检查权限
    if (req.user?.role !== 'ADMIN' && req.user?.id !== userId) {
      return res.status(403).json({ error: '没有足够的权限' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// 创建用户
router.post('/', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    
    const user = await prisma.user.create({
      data: validatedData,
      include: {
        posts: true
      }
    });
    
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// 更新用户
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // 检查权限
    if (req.user?.role !== 'ADMIN' && req.user?.id !== userId) {
      return res.status(403).json({ error: '没有足够的权限' });
    }
    
    const validatedData = updateUserSchema.parse(req.body);
    
    // 不允许普通用户修改角色
    if (req.user?.role !== 'ADMIN' && validatedData.role) {
      delete validatedData.role;
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      include: {
        posts: true
      }
    });
    
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// 删除用户
router.delete('/:id', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    await prisma.user.delete({
      where: { id: userId }
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;