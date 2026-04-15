<template>
  <div>
    <canvas
      ref="canvas"
      style="border: 1px solid grey"
      width="500"
      height="500"
    >
    </canvas>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onMounted } from "vue";
// 1. 获取 canvas 画布标签
const canvas = ref<HTMLCanvasElement>();

onMounted(() => {
  if (canvas.value) {
    // 3. 获取 context 画笔对象
    const context = canvas.value.getContext("2d");
    if (context) {
      // 4. 画出自己想要的图像
      context.fillRect(100, 100, 50, 50);
      context.moveTo(100, 200);
      //   画笔画线到 (终点)
      context.lineTo(300, 400);
      //   调用画线的方法
      context.stroke();

      const gradient = context.createConicGradient(0, 300, 300);
      // 设置渐变颜色
      gradient.addColorStop(0, "skyblue");
      gradient.addColorStop(1, "red");
      // 填充样式
      context.fillStyle = gradient;
      // 绘制矩形
      context.fillRect(200, 200, 200, 200);
    }
  }
});
</script>
