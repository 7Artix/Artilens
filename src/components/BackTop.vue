<template>
  <transition name="fade">
    <div 
      v-show="visible" 
      class="back-top" 
      @click="scrollToTop"
      title="Back to Top"
    >
      <svg viewBox="0 0.5 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 15L12 9L6 15" />
      </svg>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const visible = ref(false)
const threshold = 300 // 滚动超过300px后显示

const handleScroll = () => {
  visible.value = window.scrollY > threshold
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.back-top {
  z-index: 900;
  
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.4);
  
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease, transform 0.3s ease;
  color: #555;
}

.back-top:hover {
  background: rgba(200, 200, 200, 0.5); 
  transform: scale(1.05);
}

.icon {
  width: 24px;
  height: 24px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>