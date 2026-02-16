<script setup lang="ts">
</script>

<template>
  <div class="grid-background"></div>
</template>

<style scoped>
.grid-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1; 
  pointer-events: none;
  
  /* --- 参数配置 --- */
  --grid-color: rgba(0, 0, 0, 0.05); /* 颜色 */
  --grid-size: 30px;  /* 网格疏密 (数值越小越密) */
  --line-width: 1px;  /* 线条粗细 */

  /* 使用 repeating-linear-gradient 生成倾斜网格 */
  background-image: 
    /* 第一组斜线 (45度) */
    repeating-linear-gradient(
      45deg, 
      var(--grid-color) 0, 
      var(--grid-color) var(--line-width), 
      transparent var(--line-width), 
      transparent var(--grid-size)
    ),
    /* 第二组斜线 (-45度，形成交叉) */
    repeating-linear-gradient(
      -45deg, 
      var(--grid-color) 0, 
      var(--grid-color) var(--line-width), 
      transparent var(--line-width), 
      transparent var(--grid-size)
    );
}

/* 移动端适配：让网格稍微密集一点 */
@media (max-width: 768px) {
  .grid-background {
    --grid-size: 20px;
  }
}
</style>