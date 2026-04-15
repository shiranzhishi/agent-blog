/**
 * 性能监控服务
 * 用于监控Markdown渲染性能和缓存效果
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  totalRenders: number;
  cacheHits: number;
  cacheMisses: number;
  averageRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  totalRenderTime: number;
}

class PerformanceMonitorService {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // 最大保存的指标数量
  private isEnabled = true;

  /**
   * 开始性能测量
   */
  public startMeasure(name: string, metadata?: Record<string, any>): string {
    if (!this.isEnabled) return '';

    const measureId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.metrics.push(metric);
    
    // 限制指标数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    return measureId;
  }

  /**
   * 结束性能测量
   */
  public endMeasure(measureId: string): number | null {
    if (!this.isEnabled || !measureId) return null;

    const metric = this.metrics.find(m => 
      measureId.includes(m.name) && !m.endTime
    );

    if (!metric) return null;

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    return metric.duration;
  }

  /**
   * 记录Markdown渲染性能
   */
  public recordMarkdownRender(contentLength: number, fromCache: boolean, duration: number) {
    if (!this.isEnabled) return;

    this.startMeasure('markdown_render', {
      contentLength,
      fromCache,
      duration,
      timestamp: Date.now()
    });
  }

  /**
   * 获取性能统计信息
   */
  public getStats(): PerformanceStats {
    const renderMetrics = this.metrics.filter(m => 
      m.name === 'markdown_render' && m.metadata
    );

    if (renderMetrics.length === 0) {
      return {
        totalRenders: 0,
        cacheHits: 0,
        cacheMisses: 0,
        averageRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: 0,
        totalRenderTime: 0
      };
    }

    const cacheHits = renderMetrics.filter(m => m.metadata?.fromCache).length;
    const cacheMisses = renderMetrics.length - cacheHits;
    const durations = renderMetrics
      .map(m => m.metadata?.duration || 0)
      .filter(d => d > 0);

    const totalRenderTime = durations.reduce((sum, d) => sum + d, 0);
    const averageRenderTime = durations.length > 0 ? totalRenderTime / durations.length : 0;
    const maxRenderTime = durations.length > 0 ? Math.max(...durations) : 0;
    const minRenderTime = durations.length > 0 ? Math.min(...durations) : 0;

    return {
      totalRenders: renderMetrics.length,
      cacheHits,
      cacheMisses,
      averageRenderTime: Math.round(averageRenderTime * 100) / 100,
      maxRenderTime: Math.round(maxRenderTime * 100) / 100,
      minRenderTime: Math.round(minRenderTime * 100) / 100,
      totalRenderTime: Math.round(totalRenderTime * 100) / 100
    };
  }

  /**
   * 获取缓存命中率
   */
  public getCacheHitRate(): number {
    const stats = this.getStats();
    if (stats.totalRenders === 0) return 0;
    return Math.round((stats.cacheHits / stats.totalRenders) * 100 * 100) / 100;
  }

  /**
   * 获取最近的性能指标
   */
  public getRecentMetrics(count: number = 10): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.name === 'markdown_render')
      .slice(-count)
      .reverse();
  }

  /**
   * 清除所有指标
   */
  public clearMetrics() {
    this.metrics = [];
  }

  /**
   * 启用/禁用性能监控
   */
  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * 检查是否启用
   */
  public isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * 导出性能报告
   */
  public exportReport(): string {
    const stats = this.getStats();
    const cacheHitRate = this.getCacheHitRate();
    const recentMetrics = this.getRecentMetrics(5);

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        ...stats,
        cacheHitRate: `${cacheHitRate}%`
      },
      recentMetrics: recentMetrics.map(m => ({
        contentLength: m.metadata?.contentLength || 0,
        fromCache: m.metadata?.fromCache || false,
        duration: m.metadata?.duration || 0,
        timestamp: new Date(m.metadata?.timestamp || 0).toISOString()
      }))
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * 记录页面加载性能
   */
  public recordPageLoad(pageName: string, loadTime: number) {
    if (!this.isEnabled) return;

    this.startMeasure('page_load', {
      pageName,
      loadTime,
      timestamp: Date.now()
    });
  }

  /**
   * 获取页面加载统计
   */
  public getPageLoadStats(): Record<string, { count: number; averageTime: number }> {
    const pageLoadMetrics = this.metrics.filter(m => 
      m.name === 'page_load' && m.metadata
    );

    const stats: Record<string, { times: number[]; count: number; averageTime: number }> = {};

    pageLoadMetrics.forEach(metric => {
      const pageName = metric.metadata?.pageName || 'unknown';
      const loadTime = metric.metadata?.loadTime || 0;

      if (!stats[pageName]) {
        stats[pageName] = { times: [], count: 0, averageTime: 0 };
      }

      stats[pageName].times.push(loadTime);
      stats[pageName].count++;
    });

    // 计算平均时间
    Object.keys(stats).forEach(pageName => {
      const pageStats = stats[pageName];
      if (pageStats && pageStats.times) {
        const times = pageStats.times;
        pageStats.averageTime = times.length > 0 
          ? Math.round((times.reduce((sum, t) => sum + t, 0) / times.length) * 100) / 100
          : 0;
        
        // 删除临时的times数组
        delete (pageStats as any).times;
      }
    });

    return stats;
  }
}

// 导出单例实例
export const performanceMonitor = new PerformanceMonitorService();
export default performanceMonitor;