/**
 * Markdown预加载服务
 * 用于预热缓存和优化渲染性能
 */

import { markdownCache } from './markdownCache';
import type { Post } from './api';

class MarkdownPreloaderService {
  private preloadQueue: string[] = [];
  private isProcessing = false;
  private batchSize = 5; // 每批处理的数量
  private processingDelay = 50; // 处理间隔（毫秒）

  /**
   * 预加载帖子列表的Markdown内容
   */
  public preloadPosts(posts: Post[]) {
    const contents = posts
      .map(post => post.content)
      .filter((content): content is string => Boolean(content));

    this.addToQueue(contents);
  }

  /**
   * 添加内容到预加载队列
   */
  public addToQueue(contents: string[]) {
    // 过滤掉已经在队列中的内容
    const newContents = contents.filter(content => 
      !this.preloadQueue.includes(content)
    );

    this.preloadQueue.push(...newContents);
    
    // 如果当前没有在处理，开始处理队列
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * 处理预加载队列
   */
  private async processQueue() {
    if (this.preloadQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;

    // 分批处理，避免阻塞主线程
    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, this.batchSize);
      
      // 使用requestIdleCallback优化处理时机
      await this.processBatch(batch);
      
      // 添加延迟，避免过度占用资源
      if (this.preloadQueue.length > 0) {
        await this.delay(this.processingDelay);
      }
    }

    this.isProcessing = false;
  }

  /**
   * 处理一批内容
   */
  private processBatch(contents: string[]): Promise<void> {
    return new Promise((resolve) => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          this.renderBatch(contents);
          resolve();
        });
      } else {
        // 降级到setTimeout
        setTimeout(() => {
          this.renderBatch(contents);
          resolve();
        }, 0);
      }
    });
  }

  /**
   * 渲染一批内容
   */
  private renderBatch(contents: string[]) {
    contents.forEach(content => {
      try {
        markdownCache.render(content);
      } catch (error) {
        console.warn('预加载Markdown内容失败:', error);
      }
    });
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清空预加载队列
   */
  public clearQueue() {
    this.preloadQueue = [];
    this.isProcessing = false;
  }

  /**
   * 获取队列状态
   */
  public getQueueStatus() {
    return {
      queueLength: this.preloadQueue.length,
      isProcessing: this.isProcessing,
      batchSize: this.batchSize
    };
  }

  /**
   * 设置批处理大小
   */
  public setBatchSize(size: number) {
    this.batchSize = Math.max(1, Math.min(size, 20)); // 限制在1-20之间
  }

  /**
   * 设置处理延迟
   */
  public setProcessingDelay(delay: number) {
    this.processingDelay = Math.max(0, Math.min(delay, 1000)); // 限制在0-1000ms之间
  }

  /**
   * 立即预加载指定内容（高优先级）
   */
  public preloadImmediate(content: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const html = markdownCache.render(content);
        resolve(html);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 批量立即预加载（高优先级）
   */
  public async preloadImmediateBatch(contents: string[]): Promise<string[]> {
    const results: string[] = [];
    
    for (const content of contents) {
      try {
        const html = await this.preloadImmediate(content);
        results.push(html);
      } catch (error) {
        console.warn('立即预加载失败:', error);
        results.push('');
      }
    }
    
    return results;
  }
}

// 导出单例实例
export const markdownPreloader = new MarkdownPreloaderService();
export default markdownPreloader;