/**
 * Markdown功能测试工具
 * 用于验证缓存和性能优化功能
 */

import { markdownCache } from '../services/markdownCache';
import { performanceMonitor } from '../services/performanceMonitor';

// 测试用的Markdown内容
const testMarkdownContent = `
# 测试标题

这是一个**测试文档**，用于验证Markdown渲染和缓存功能。

## 代码示例

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
  return "success";
}
\`\`\`

## 列表测试

- 第一项
- 第二项
  - 嵌套项目
  - 另一个嵌套项目

## 表格测试

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
| 数据4 | 数据5 | 数据6 |

## 链接测试

这是一个[内部链接](#test)和一个[外部链接](https://example.com)。

> 这是一个引用块，用于测试样式。

\`行内代码\`测试。
`;

/**
 * 测试Markdown渲染性能
 */
export function testMarkdownPerformance() {
  console.log('开始Markdown性能测试...');
  
  // 清除之前的缓存和指标
  markdownCache.clearCache();
  performanceMonitor.clearMetrics();
  
  const iterations = 10;
  const results = [];
  
  // 第一次渲染（无缓存）
  console.log('测试首次渲染（无缓存）...');
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    markdownCache.render(testMarkdownContent);
    const endTime = performance.now();
    results.push(endTime - startTime);
  }
  
  // 第二次渲染（有缓存）
  console.log('测试缓存渲染...');
  const cachedResults = [];
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    markdownCache.render(testMarkdownContent);
    const endTime = performance.now();
    cachedResults.push(endTime - startTime);
  }
  
  // 计算统计信息
  const avgFirstRender = results.reduce((a, b) => a + b, 0) / results.length;
  const avgCachedRender = cachedResults.reduce((a, b) => a + b, 0) / cachedResults.length;
  const speedImprovement = ((avgFirstRender - avgCachedRender) / avgFirstRender * 100);
  
  console.log('性能测试结果:');
  console.log(`首次渲染平均时间: ${avgFirstRender.toFixed(2)}ms`);
  console.log(`缓存渲染平均时间: ${avgCachedRender.toFixed(2)}ms`);
  console.log(`性能提升: ${speedImprovement.toFixed(1)}%`);
  
  // 获取性能监控统计
  const stats = performanceMonitor.getStats();
  console.log('性能监控统计:', stats);
  console.log(`缓存命中率: ${performanceMonitor.getCacheHitRate()}%`);
  
  return {
    avgFirstRender,
    avgCachedRender,
    speedImprovement,
    stats
  };
}

/**
 * 测试不同大小内容的渲染性能
 */
export function testContentSizePerformance() {
  console.log('开始内容大小性能测试...');
  
  const sizes = [100, 500, 1000, 5000, 10000]; // 字符数
  const results: Record<number, { firstRender: number; cachedRender: number }> = {};
  
  sizes.forEach(size => {
    // 生成指定大小的内容
    const content = generateMarkdownContent(size);
    
    // 清除缓存
    markdownCache.clearCache();
    
    // 测试首次渲染
    const startFirst = performance.now();
    markdownCache.render(content);
    const firstRenderTime = performance.now() - startFirst;
    
    // 测试缓存渲染
    const startCached = performance.now();
    markdownCache.render(content);
    const cachedRenderTime = performance.now() - startCached;
    
    results[size] = {
      firstRender: firstRenderTime,
      cachedRender: cachedRenderTime
    };
    
    console.log(`${size}字符内容 - 首次: ${firstRenderTime.toFixed(2)}ms, 缓存: ${cachedRenderTime.toFixed(2)}ms`);
  });
  
  return results;
}

/**
 * 生成指定大小的Markdown内容
 */
function generateMarkdownContent(targetSize: number): string {
  const baseContent = `
# 标题 ${Math.random()}

这是一段测试内容，包含**粗体**和*斜体*文本。

## 子标题

\`\`\`javascript
function test() {
  return "Hello World";
}
\`\`\`

- 列表项 1
- 列表项 2

`;
  
  let content = baseContent;
  while (content.length < targetSize) {
    content += `\n段落 ${Math.random()}: 这是一段随机生成的内容，用于测试不同大小文档的渲染性能。包含一些**格式化**文本和\`代码\`。\n`;
  }
  
  return content.substring(0, targetSize);
}

/**
 * 测试缓存功能
 */
export function testCacheFunction() {
  console.log('开始缓存功能测试...');
  
  // 清除缓存
  markdownCache.clearCache();
  
  const content1 = "# 测试内容 1\n这是第一个测试内容。";
  const content2 = "# 测试内容 2\n这是第二个测试内容。";
  
  // 渲染内容1
  const html1_first = markdownCache.render(content1);
  const html1_second = markdownCache.render(content1);
  
  // 渲染内容2
  const html2_first = markdownCache.render(content2);
  const html2_second = markdownCache.render(content2);
  
  // 验证缓存是否工作
  const cacheWorking = html1_first === html1_second && html2_first === html2_second;
  const differentContent = html1_first !== html2_first;
  
  console.log('缓存功能测试结果:');
  console.log(`缓存是否工作: ${cacheWorking ? '是' : '否'}`);
  console.log(`不同内容渲染结果不同: ${differentContent ? '是' : '否'}`);
  
  // 获取缓存统计
  const cacheStats = markdownCache.getCacheStats();
  console.log('缓存统计:', cacheStats);
  
  return {
    cacheWorking,
    differentContent,
    cacheStats
  };
}

/**
 * 运行所有测试
 */
export function runAllTests() {
  console.log('=== Markdown功能完整测试 ===');
  
  const performanceResult = testMarkdownPerformance();
  console.log('\n');
  
  const sizeResult = testContentSizePerformance();
  console.log('\n');
  
  const cacheResult = testCacheFunction();
  console.log('\n');
  
  console.log('=== 测试完成 ===');
  
  return {
    performance: performanceResult,
    sizePerformance: sizeResult,
    cache: cacheResult
  };
}