import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import userRoutes from './routes/users';
import postRoutes from './routes/posts';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import chatRoutes from './routes/chat';
import path from 'path';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  //   origin: (origin, callback) => {
  //   // 允许的域名列表
  //   const allowedOrigins = [
  //     'http://localhost:5173',
  //     // 添加你要允许的开源网站域名
  //     'https://www.coze.cn/',
  //   ];
    
  //   // 开发环境允许所有来源，或者没有origin的请求（如Postman）
  //   if (!origin || process.env.NODE_ENV === 'development') {
  //     return callback(null, true);
  //   }
    
  //   // 检查是否在允许列表中
  //   if (allowedOrigins.includes(origin)) {
  //     callback(null, true);
  //   } else {
  //     callback(new Error('不被CORS策略允许的来源'));
  //   }
  // },
  // origin:true,
  credentials: true
}));
app.use(express.json());

// 静态文件服务 - 头像上传目录
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chat', chatRoutes);

// 错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});