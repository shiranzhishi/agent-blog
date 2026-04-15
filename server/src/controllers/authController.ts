import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

// 验证模式
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// 注册
export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // 创建用户
    const user = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        gender: true,
        createdAt: true
      }
    });
    
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: '注册失败' });
  }
};

// 登录
export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    console.log(isPasswordValid);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        gender: user.gender
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: '格式错误' });
    }
    res.status(500).json({ error: '登录失败' });
  }
};