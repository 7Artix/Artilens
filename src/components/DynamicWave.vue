<template>
  <div class="wave-bg">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvasRef = ref(null);
let ctx = null;
let width = 0;
let height = 0;
let animationId = null;
let time = 0;

// 配置参数
const config = {
  lineGap: 40,         // 线条垂直间距
  lineColor: 'rgba(0, 0, 0, 0.05)', // 线条颜
  lineWidth: 1,        // 线条宽度
  speed: 0.005,        // 流动速度
  amplitude: 40,       // 振幅基础值
  wavelengthX: 0.003,  // X轴波长系数
  wavelengthY: 0.005,  // Y轴波长系数（影响纵向变化的连贯性）
};

const resize = () => {
  if (canvasRef.value) {
    // 增加一点额外的尺寸以防止边缘露出
    width = window.innerWidth;
    height = window.innerHeight;
    canvasRef.value.width = width;
    canvasRef.value.height = height;
  }
};

const draw = () => {
  if (!ctx) return;
  
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = config.lineWidth;
  ctx.strokeStyle = config.lineColor;

  // 遍历垂直方向，画出多条水平线
  // 从负边距开始画，保证波动不露出空白
  for (let y = -config.amplitude * 2; y < height + config.amplitude * 2; y += config.lineGap) {
    ctx.beginPath();
    
    // 每条线由多个点组成，xStep 越小越平滑
    const xStep = 10;
    for (let x = 0; x <= width + xStep; x += xStep) {
      // 核心算法：通过 x, y 和 time 共同计算偏移量
      // 叠加两个正弦波：
      // 1. 主波：受 x 和 time 影响
      // 2. 干扰波：受 x, y 和 time 影响，产生地形扭曲感
      const yOffset = 
        Math.sin(x * config.wavelengthX + time) * config.amplitude * 0.5 +
        Math.sin((x * 0.5 + y) * config.wavelengthY + time * 1.5) * config.amplitude;

      if (x === 0) {
        ctx.moveTo(x, y + yOffset);
      } else {
        ctx.lineTo(x, y + yOffset);
      }
    }
    ctx.stroke();
  }

  time += config.speed;
  animationId = requestAnimationFrame(draw);
};

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    draw();
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', resize);
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
</script>

<style scoped>
.wave-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1; /* 修改为 -1，确保绝对在内容之下 */
  background-color: #f9f9f9;
  pointer-events: none;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>