import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface UserPayload {
  id: number;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: '无效的认证令牌' });
  }
};

// 角色验证中间件
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未授权，请先登录' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '没有足够的权限执行此操作' });
    }
    
    next();
  };
};

// 可选认证中间件 - 不会阻止请求，但会在有有效token时设置req.user
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    // 没有token，但请求继续
    return next();
  }
  
  try {
    // 尝试验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    // token无效，但请求继续（不会返回401错误）
    next();
  }
};