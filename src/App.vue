<template>
  <div class="app-container">
    <nav class="glass-nav">
      <div class="nav-left">
        <span class="site-icon">◈</span>
        <a href="#">Homepage</a>
        <a href="#">Projects</a>
      </div>
      <div class="nav-right">
        <div class="hologram-wrapper">
          <img 
            class="hologram-avatar" 
            src="/src/assets/artix.png" 
            alt="Avatar"
          />
        </div>
      </div>
    </nav>

    <main class="content-area">
      <h1 class="hero-text">Hi, {{ name }} Here</h1>
      <p class="description">
        Testing...  <b>Vue 3 + GSAP</b> Preview.
      </p>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'

// 定义响应式变量
const name = ref('Artix')

// 动画逻辑：页面加载后，文字和头像优雅地浮现
onMounted(() => {
  // 文字从下方升起
  gsap.from(".hero-text", { 
    y: 100, 
    opacity: 0, 
    duration: 1, 
    ease: "power4.out" 
  })

  // 头像淡淡地出现并带一点缩放
  gsap.from(".hologram-wrapper", {
    scale: 0.5,
    opacity: 0,
    duration: 1.5,
    delay: 0,
    ease: "power4.out"
  })
})
</script>

<style>
/* 基础背景：灰色底色需求 */
body {
  margin: 0;
  background-color: #ffffff;
  background-image: url("/src/assets/bg.contour.jpg");
  font-family: 'Inter', -apple-system, sans-serif;
}

/* 菜单栏：毛玻璃 (Backdrop Filter) */
.glass-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  height: 60px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px); /* 核心：高斯模糊 */
  -webkit-backdrop-filter: blur(15px);
  position: sticky;
  top: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 100;
}

.nav-left a {
  margin-left: 20px;
  text-decoration: none;
  color: #333;
  font-weight: 500;
}

/* 核心：全息头像效果实现 */
.hologram-wrapper {
  width: 50px;
  height: 50px;
  position: relative;
}

.hologram-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  /* 你的需求：从边缘开始向外逐渐模糊透明 */
  /* 使用 radial-gradient 遮罩：中心 50% 纯黑(可见)，边缘 100% 透明 */
  mask-image: radial-gradient(circle, black 40%, rgba(0,0,0,0.4) 70%, transparent 100%);
  -webkit-mask-image: radial-gradient(circle, black 40%, rgba(0,0,0,0.4) 70%, transparent 100%);
  
  transition: all 0.5s ease;
}

.hologram-avatar:hover {
  filter: brightness(1.2) contrast(1.1) drop-shadow(0 0 10px rgba(255,255,255,0.8));
  transform: scale(1.1);
}

.content-area {
  padding: 200px 40px;
  text-align: center;
}

.hero-text {
  font-size: 80px;
  line-height: 1;
  font-weight: 600;
  color: #d5d5d5;
  white-space: pre-line;
}
</style>