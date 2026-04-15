import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updateAllPasswords() {
  try {
    console.log('开始更新所有用户密码为哈希格式...');
    
    // 定义要使用的密码
    const password = '12345';
    // 生成哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 更新所有用户的密码
    const updateResult = await prisma.user.updateMany({
      data: { password: hashedPassword }
    });
    
    // 同时设置管理员账号
    await prisma.user.updateMany({
      where: { email: 'jishenghao@qq.com' },
      data: { 
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log(`成功更新 ${updateResult.count} 个用户的密码！`);
    console.log(`管理员账号已设置：jishenghao@qq.com`);
    console.log(`所有用户密码已更新为: ${password}`);
    
  } catch (error) {
    console.error('更新密码时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行更新
updateAllPasswords();