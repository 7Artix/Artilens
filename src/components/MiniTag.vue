<template>
  <span 
    class="mini-tag" 
    @click.stop="handleTagClick"
  >
    {{ name }}
  </span>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  }
})

const router = useRouter()

const handleTagClick = () => {
  // 跳转到搜索页面并带上 tag 参数
  router.push(`/search?tag=${encodeURIComponent(props.name)}`)
}
</script>

<style scoped>
.mini-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.4); 
  backdrop-filter: blur(16px);
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255,255,255,0.4);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  color: #666;
  margin-right: 6px;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

/* 悬浮效果 */
.mini-tag:hover {
  background: rgba(0, 0, 0, 0.5);
  color: white;
}

/* 点击效果 */
.mini-tag:active {
  transform: scale(0.95);
  background: #005bb5;
}
</style>