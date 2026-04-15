/**
 * Markdown缓存服务
 * 提供Markdown内容的缓存和渲染优化功能
 */

import MarkdownIt from 'markdown-it';
import { performanceMonitor } from './performanceMonitor';

// 缓存接口定义
interface CacheEntry {
  html: string;
  timestamp: number;
  hash: string;
}

// 缓存配置
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟过期
const MAX_CACHE_SIZE = 100; // 最大缓存条目数

class MarkdownCacheService {
  private cache = new Map<string, CacheEntry>();
  private md: MarkdownIt;

  constructor() {
    // 初始化Markdown-it实例，配置代码高亮
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str, lang) => {
        const langClass = lang ? ` language-${lang}` : '';
        const langAttr = lang ? ` data-language="${lang}"` : '';
        return `<pre class="hljs"${langAttr}><code class="hljs${langClass}">${this.md.utils.escapeHtml(str)}</code></pre>`;
      }
    });

    // 配置插件和规则
    this.configureMarkdown();
  }

  /**
   * 配置Markdown渲染规则
   */
  private configureMarkdown() {
    // 自定义链接渲染规则
    const defaultRender = this.md.renderer.rules.link_open || function(tokens, idx, options, _env, renderer) {
      return renderer.renderToken(tokens, idx, options);
    };

    this.md.renderer.rules.link_open = (tokens, idx, options, _env, renderer) => {
      const token = tokens[idx];
      if (!token) return '';
      
      const href = token.attrGet('href');
      
      // 外部链接添加target="_blank"
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        token.attrSet('target', '_blank');
        token.attrSet('rel', 'noopener noreferrer');
      }
      
      return defaultRender(tokens, idx, options, _env, renderer);
    };

    // 自定义表格渲染
    this.md.renderer.rules.table_open = function () {
      return '<div class="table-wrapper"><table class="markdown-table">\n';
    };

    this.md.renderer.rules.table_close = function () {
      return '</table></div>\n';
    };

    // 移除自定义代码块渲染，使用默认的 highlight 配置
  }

  /**
   * 生成内容哈希值
   */
  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > CACHE_EXPIRY) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 限制缓存大小
   */
  private limitCacheSize() {
    if (this.cache.size > MAX_CACHE_SIZE) {
      // 删除最旧的条目
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, this.cache.size - MAX_CACHE_SIZE + 10);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * 渲染Markdown内容（带缓存）
   */
  public render(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    const startTime = performance.now();

    // 生成缓存键
    const hash = this.generateHash(content);
    const cacheKey = `md_${hash}`;

    // 检查缓存
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp < CACHE_EXPIRY) && cached.hash === hash) {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMarkdownRender(content.length, true, duration);
      return cached.html;
    }

    // 渲染Markdown
    const html = this.md.render(content);
    const duration = performance.now() - startTime;

    // 记录性能指标
    performanceMonitor.recordMarkdownRender(content.length, false, duration);

    // 存储到缓存
    this.cache.set(cacheKey, {
      html,
      timestamp: now,
      hash
    });

    // 定期清理缓存
    if (Math.random() < 0.1) { // 10%的概率触发清理
      this.cleanExpiredCache();
      this.limitCacheSize();
    }

    return html;
  }

  /**
   * 预热缓存 - 批量渲染内容
   */
  public preloadCache(contents: string[]) {
    contents.forEach(content => {
      if (content && typeof content === 'string') {
        this.render(content);
      }
    });
  }

  /**
   * 清空缓存
   */
  public clearCache() {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      expiryTime: CACHE_EXPIRY
    };
  }

  /**
   * 为md-editor-v3提供配置
   */
  public getMdEditorConfig() {
    return {
      markdownItConfig: (md: any) => {
        // 应用我们的配置，不包含 highlight
        md.set({
          html: true,
          linkify: true,
          typographer: true,
          // 移除 highlight 配置
        });

        // 应用自定义渲染规则
        const defaultLinkRender = md.renderer.rules.link_open || function(tokens: any, idx: any, options: any, _env: any, renderer: any) {
          return renderer.renderToken(tokens, idx, options);
        };

        md.renderer.rules.link_open = (tokens: any, idx: any, options: any, _env: any, renderer: any) => {
          const token = tokens[idx];
          if (!token) return '';
          
          const href = token.attrGet('href');
          
          // 外部链接添加target="_blank"
          if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
            token.attrSet('target', '_blank');
            token.attrSet('rel', 'noopener noreferrer');
          }
          
          return defaultLinkRender(tokens, idx, options, _env, renderer);
        };

        // 表格渲染优化
        md.renderer.rules.table_open = function () {
          return '<div class="table-wrapper"><table class="markdown-table">\n';
        };

        md.renderer.rules.table_close = function () {
          return '</table></div>\n';
        };

        return md;
      }
    };
  }

  /**
   * 获取Markdown-it实例（用于高级配置）
   */
  public getMarkdownInstance(): MarkdownIt {
    return this.md;
  }
}

// 导出单例实例
export const markdownCache = new MarkdownCacheService();
export default markdownCache;