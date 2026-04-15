import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { auth } from '../middleware/auth';

const router: express.Router = express.Router();
const prisma = new PrismaClient();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// multer 配置
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user?.id}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 最大 2MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 jpg、png、gif、webp 格式的图片'));
    }
  }
});

// 验证模式
const updateProfileSchema = z.object({
  name: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(6, '新密码长度至少为6位'),
});

// 获取当前用户资料
router.get('/', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        gender: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: '获取资料失败' });
  }
});

// 更新个人资料（姓名、性别）
router.put('/', auth, async (req, res) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        gender: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: '更新资料失败' });
  }
});

// 上传头像
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的图片' });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    // 删除旧头像文件
    const oldUser = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (oldUser?.avatar) {
      const oldPath = path.join(__dirname, '../..', oldUser.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: avatarPath },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        gender: true,
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: '上传头像失败' });
  }
});

// 修改密码
router.put('/password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: '原密码错误' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword }
    });

    res.json({ message: '密码修改成功' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: '修改密码失败' });
  }
});

export default router;
