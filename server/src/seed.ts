import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据...');

  // 创建用户
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob',
    },
  });

  // 创建帖子
  const post1 = await prisma.post.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: '欢迎使用Vue3 + Prisma + PostgreSQL',
      content: '这是一个全栈应用示例，展示了如何使用Vue3、TypeScript、Node.js、Prisma和PostgreSQL构建现代Web应用。',
      published: true,
      authorId: user1.id,
    },
  });

  const post2 = await prisma.post.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: 'TypeScript最佳实践',
      content: '在大型项目中使用TypeScript可以显著提高代码质量和开发效率。',
      published: true,
      authorId: user2.id,
    },
  });

  const post3 = await prisma.post.upsert({
    where: { id: 3 },
    update: {},
    create: {
      title: 'Prisma ORM入门指南',
      content: 'Prisma是一个现代的数据库工具包，提供了类型安全的数据库访问方式。',
      published: false,
      authorId: user1.id,
    },
  });

  console.log('种子数据创建完成:', { user1, user2, post1, post2, post3 });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });