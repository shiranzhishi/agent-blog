/**
 * 博客内问答路由（基于 BM25 关键词检索）
 *
 * GET  /api/chat/status         查看索引状态
 * POST /api/chat/reindex        手动重建索引（管理员）
 * POST /api/chat/ask            提问，返回 TopK 相关文章
 */
import express from 'express';
import { z } from 'zod';
import { auth, authorize } from '../middleware/auth';
import {
  getIndexStatus,
  reindex,
  searchTopK,
} from '../services/searchService';

const router: express.Router = express.Router();

// 查看索引状态
router.get('/status', (_req, res) => {
  try {
    res.json(getIndexStatus());
  } catch (err) {
    console.error('获取索引状态失败:', err);
    res.status(500).json({ error: '获取索引状态失败' });
  }
});

// 手动重建索引（仅管理员）
router.post('/reindex', auth, authorize(['ADMIN']), async (_req, res) => {
  try {
    const result = await reindex();
    res.json({ message: '索引重建完成', ...result });
  } catch (err) {
    console.error('重建索引失败:', err);
    res.status(500).json({ error: '重建索引失败' });
  }
});

// 提问
const askSchema = z.object({
  question: z.string().min(1).max(500),
  topK: z.number().int().min(1).max(10).optional(),
});

router.post('/ask', async (req, res) => {
  try {
    const { question, topK } = askSchema.parse(req.body);
    const results = await searchTopK(question, topK ?? 3);

    if (results.length === 0) {
      return res.json({
        question,
        answer: '没有找到相关文章。可以换个关键词试试，或者发布一些内容后再问。',
        sources: [],
      });
    }

    const top = results[0];
    const answer =
      `根据博客内容，最相关的文章是《${top.title}》。\n\n` +
      `摘要：${top.snippet}${top.snippet.length >= 200 ? '...' : ''}`;

    res.json({
      question,
      answer,
      sources: results,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error('问答失败:', err);
    res.status(500).json({ error: '问答失败' });
  }
});

export default router;
