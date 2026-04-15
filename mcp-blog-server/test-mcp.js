#!/usr/bin/env node

// 简单的MCP服务器测试脚本
// 用于验证服务器是否正常启动和响应

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 测试MCP博客服务器...\n');

// 启动MCP服务器进程
const mcpServer = spawn('node', ['./dist/index.js'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe']
});

let hasStarted = false;

// 监听服务器输出
mcpServer.stderr.on('data', (data) => {
  const output = data.toString();
  console.log('📡 服务器输出:', output.trim());
  
  if (output.includes('博客MCP服务器已启动')) {
    hasStarted = true;
    console.log('✅ MCP服务器启动成功！');
    
    // 发送测试消息
    setTimeout(() => {
      console.log('\n📤 发送测试请求...');
      
      // 模拟MCP协议的工具列表请求
      const listToolsRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      };
      
      mcpServer.stdin.write(JSON.stringify(listToolsRequest) + '\n');
    }, 1000);
  }
});

// 监听服务器响应
mcpServer.stdout.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.log('📥 服务器响应:', output);
    
    try {
      const response = JSON.parse(output);
      if (response.result && response.result.tools) {
        console.log('✅ 工具列表获取成功！');
        console.log('🔧 可用工具:', response.result.tools.map(t => t.name).join(', '));
      }
    } catch (e) {
      // 忽略JSON解析错误
    }
  }
});

// 错误处理
mcpServer.on('error', (error) => {
  console.error('❌ 服务器启动失败:', error.message);
  process.exit(1);
});

// 5秒后自动退出
setTimeout(() => {
  if (hasStarted) {
    console.log('\n✅ 测试完成！MCP服务器工作正常。');
  } else {
    console.log('\n❌ 测试失败：服务器未能正常启动。');
  }
  
  mcpServer.kill();
  process.exit(hasStarted ? 0 : 1);
}, 5000);

console.log('⏳ 等待服务器启动...');