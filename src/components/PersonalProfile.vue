<template>
  <div class="profile-card">
    <!-- 1. 头像 -->
    <div class="avatar-section">
      <img v-if="profile.avatar" :src="profile.avatar" alt="Avatar" class="avatar" />
      <div v-else class="avatar-placeholder"></div>
    </div>

    <!-- 2. 名字 -->
    <div class="name-section">
      {{ profile.name }}
    </div>

    <!-- 3. Headline -->
    <div class="headline-section">
      <div v-for="(line, index) in profile.headline" :key="index" class="headline-item">
        {{ line }}
      </div>
    </div>

    <!-- 4. 底部操作行 (地区胶囊 + 社交图标) -->
    <div class="icon-row">
      
      <!-- 地区胶囊 -->
      <div class="location-capsule" v-if="profile.location && profile.location.value">
        <div class="capsule-icon-bg">
          <div v-if="isSvgFile(profile.location.icon)" 
               class="earth-icon-masked"
               :style="{ maskImage: `url(${profile.location.icon})`, WebkitMaskImage: `url(${profile.location.icon})` }">
          </div>
          <img v-else :src="profile.location.icon" class="earth-icon-img" />
        </div>
        <span class="location-text">{{ profile.location.value }}</span>
      </div>

      <!-- Email 图标 -->
      <a v-if="profile.email && profile.email.url" 
         :href="`mailto:${profile.email.url}`" 
         class="icon-link email-link" 
         title="Email">
         <div v-if="isSvgFile(profile.email.icon)" 
              class="email-icon-masked"
              :style="{ maskImage: `url(${profile.email.icon})`, WebkitMaskImage: `url(${profile.email.icon})` }">
         </div>
         <img v-else :src="profile.email.icon" class="social-img" />
      </a>

      <!-- 社交图标循环 -->
      <template v-for="(item, platform) in profile.social" :key="platform">
        <a v-if="item && item.url" :href="item.url" target="_blank" class="icon-link social-link" :title="platform">
          <img :src="item.icon" :alt="platform" class="social-img" />
        </a>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import yaml from 'js-yaml'

const profile = ref({
  name: '',
  avatar: '',
  headline: [],
  location: { value: '', icon: '' },
  email: { url: '', icon: '' },
  social: {}
})

const isSvgFile = (str) => {
  if (!str) return false
  return /\.svg($|\?)/i.test(str) || str.startsWith('data:image/svg+xml')
}

onMounted(async () => {
  try {
    const response = await fetch('/api/static/site/profile.yaml')
    if (response.ok) {
      const text = await response.text()
      const data = yaml.load(text)
      if (data) profile.value = { ...profile.value, ...data }
    }
  } catch (error) {
    console.error('Error loading profile:', error)
  }
})

const pillHeight = 24; // 稍微调高一点胶囊高度以匹配图标视觉
</script>

<style scoped>
/* --- 全局容器 --- */
.profile-card {
  display: flex;
  flex-direction: column;
  width: 320px; /* 固定宽度 */
  color: #333;
  z-index: 10;
}

/* --- 1. 头像 --- */
.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.avatar {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0px 20px rgba(0,0,0,0.2);
  border: solid 6px rgba(255,255,255,0.2);
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: #eee;
}

/* --- 2. 名字 --- */
.name-section {
  font-weight: 800;
  font-size: 1.8rem;
  text-align: center;
  margin-bottom: 4px;
  padding-left: 4px;
}

/* --- 3. Headline --- */
.headline-section {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  padding-left: 4px;
}

.headline-item {
  text-align: center;
  font-size: 1rem;
  color: #505050;
  line-height: 1.5;
  margin-bottom: 4px;
}

/* --- 4. 底部操作行 --- */
.icon-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap; /* 防止宽度不足时溢出 */
}

/* --- 地区胶囊样式 --- */
.location-capsule {
  background-color: #333;
  border-radius: calc(v-bind(pillHeight) * 1px / 2);
  display: flex;
  align-items: center;
  padding-left: 1px;
  height: calc(v-bind(pillHeight) * 1px);
  box-sizing: border-box;
  flex-shrink: 0; /* 防止被挤压 */
  margin-right: 0px;
}

.capsule-icon-bg {
  width: calc(v-bind(pillHeight) * 1px - 2px);
  height: calc(v-bind(pillHeight) * 1px - 2px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  position: relative;
}

.capsule-icon-bg::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(v-bind(pillHeight) * 1px - 3px);
  height: calc(v-bind(pillHeight) * 1px - 3px);
  background-color: #f9f9f9;
  border-radius: 50%;
  z-index: 9;
}

.earth-icon-masked {
  width: calc(v-bind(pillHeight) * 1px - 2px);
  height: calc(v-bind(pillHeight) * 1px - 2px);
  background-color: #333333;
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  position: relative;
  z-index: 10;
}

.earth-icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: relative;
  z-index: 10;
}

.location-text {
  color: #f9f9f9;
  font-size: 0.75rem;
  white-space: nowrap;
  transform: translateY(-1px);
  margin-right: 8px;
}

/* --- 图标通用样式 --- */
.icon-link {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: transform 0.2s ease-in-out, filter 0.2s ease-in-out;
  cursor: pointer;
}

.icon-link:hover {
  transform: scale(1.1);
  filter: drop-shadow(0 0px 10px rgba(0, 0, 0, 0.2));
}

.email-icon-masked {
  width: 22px;
  height: 22px;
  background-color: #333333;
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}

.social-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  display: block;
}
</style>