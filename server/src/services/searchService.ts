/**
 * 博客内搜索服务（基于 BM25）
 *
 * 设计要点：
 * - 内存索引：服务启动时把所有已发布文章读进内存，按需懒加载
 * - 中英文分词：英文按非字母数字切分；中文按 1-2-3 字滑窗（n-gram）切分
 *   不引入额外分词库（如 jieba）以保持零依赖、零 native 模块
 * - 评分：标准 BM25 (k1=1.5, b=0.75)
 *
 * 这不是"AI"，是改良版 TF-IDF，但对博客内容已经够用且完全零成本
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// BM25 超参，工业界常用默认值
const K1 = 1.5;
const B = 0.75;

interface IndexedDoc {
  id: number;
  title: string;
  content: string | null;
  // 词 → 词频
  termFreq: Map<string, number>;
  // 文档总长度（词数）
  length: number;
}

interface SearchIndex {
  docs: IndexedDoc[];
  // 词 → 出现该词的文档数
  docFreq: Map<string, number>;
  // 平均文档长度
  avgLength: number;
}

let index: SearchIndex | null = null;

/**
 * 文本切词
 * 1. 英文 / 数字：按非字母数字字符切分，转小写
 * 2. 中文：连续中文字符按 1-2 字 n-gram 切分（兼顾召回与精度）
 */
function tokenize(text: string): string[] {
  if (!text) return [];

  const tokens: string[] = [];
  // 分别识别 ASCII 词块 与 中文字符块
  const re = /[a-zA-Z0-9]+|[\u4e00-\u9fa5]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const piece = m[0];
    if (/^[a-zA-Z0-9]+$/.test(piece)) {
      // 英文/数字：直接当作一个词，转小写
      tokens.push(piece.toLowerCase());
    } else {
      // 中文：单字 + 双字 n-gram
      for (let i = 0; i < piece.length; i++) {
        tokens.push(piece[i]);
        if (i + 1 < piece.length) {
          tokens.push(piece.slice(i, i + 2));
        }
      }
    }
  }
  return tokens;
}

/**
 * 标题权重通过重复达成：标题里的词在索引里被算两次
 */
function tokenizeDoc(title: string, content: string | null): string[] {
  const titleTokens = tokenize(title);
  const contentTokens = tokenize(content || '');
  return [...titleTokens, ...titleTokens, ...contentTokens];
}

/**
 * 构建索引（从数据库读所有已发布文章）
 */
export async function buildIndex(): Promise<void> {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { id: true, title: true, content: true },
  });

  const docs: IndexedDoc[] = [];
  const docFreq = new Map<string, number>();

  for (const post of posts) {
    const tokens = tokenizeDoc(post.title, post.content);
    const termFreq = new Map<string, number>();
    for (const t of tokens) {
      termFreq.set(t, (termFreq.get(t) || 0) + 1);
    }
    docs.push({
      id: post.id,
      title: post.title,
      content: post.content,
      termFreq,
      length: tokens.length,
    });
    // 文档级 docFreq：每个唯一词只算一次
    for (const t of termFreq.keys()) {
      docFreq.set(t, (docFreq.get(t) || 0) + 1);
    }
  }

  const totalLen = docs.reduce((s, d) => s + d.length, 0);
  const avgLength = docs.length > 0 ? totalLen / docs.length : 0;

  index = { docs, docFreq, avgLength };
  console.log(`[search] BM25 索引就绪，文档 ${docs.length} 篇，词典 ${docFreq.size} 个`);
}

/**
 * 计算 BM25 得分
 * 公式：sum_t [ idf(t) * (tf(t,d) * (k1+1)) / (tf(t,d) + k1 * (1 - b + b * |d|/avgdl)) ]
 */
function bm25Score(queryTokens: string[], doc: IndexedDoc, idx: SearchIndex): number {
  let score = 0;
  const N = idx.docs.length;
  for (const t of queryTokens) {
    const tf = doc.termFreq.get(t);
    if (!tf) continue;
    const df = idx.docFreq.get(t) || 0;
    // BM25 标准 IDF（防负值）
    const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
    const numer = tf * (K1 + 1);
    const denom = tf + K1 * (1 - B + (B * doc.length) / (idx.avgLength || 1));
    score += idf * (numer / denom);
  }
  return score;
}

/**
 * 检索 TopK
 */
export async function searchTopK(
  query: string,
  k = 3
): Promise<Array<{ id: number; title: string; snippet: string; score: number }>> {
  if (!index) {
    await buildIndex();
  }
  if (!index || index.docs.length === 0) {
    return [];
  }

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  // 去重，避免同一查询词重复加分
  const uniqQueryTokens = Array.from(new Set(queryTokens));

  const scored = index.docs
    .map((doc) => ({
      doc,
      score: bm25Score(uniqQueryTokens, doc, index!),
    }))
    .filter((x) => x.score > 0);

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, k).map((x) => ({
    id: x.doc.id,
    title: x.doc.title,
    snippet: (x.doc.content || '').slice(0, 200),
    score: Number(x.score.toFixed(4)),
  }));
}

/**
 * 重新构建索引（文章新增/编辑/删除后调用）
 */
export async function reindex(): Promise<{ docs: number; terms: number }> {
  await buildIndex();
  return {
    docs: index?.docs.length ?? 0,
    terms: index?.docFreq.size ?? 0,
  };
}

/**
 * 索引状态
 */
export function getIndexStatus() {
  return {
    indexBuilt: index !== null,
    docs: index?.docs.length ?? 0,
    terms: index?.docFreq.size ?? 0,
    avgDocLength: index ? Number(index.avgLength.toFixed(1)) : 0,
  };
}
