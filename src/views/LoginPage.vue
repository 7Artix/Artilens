<template>
  <div class="login-page">
    <DynamicWave/>
    <div class="login-card">
      <h2>System Access</h2>

      <!-- 状态 1: 未登录，显示输入框 -->
      <div v-if="!isLoggedIn" class="form-group">
        <input 
          type="password" 
          v-model="password" 
          placeholder="Password" 
          @keyup.enter="handleLogin"
          ref="passwordInput"
        />
        <button @click="handleLogin" :disabled="loading">
          {{ loading ? 'Verifying...' : 'Unlock' }}
        </button>
      </div>

      <!-- 状态 2: 已登录，显示操作面板 -->
      <div v-else class="action-group">
        <p class="status-text">Artifact Validated</p>
        <div class="buttons">
          <button @click="goToAdmin">Go to Console</button>
          <button @click="handleLogout" class="logout-btn">Logout</button>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DynamicWave from '../components/DynamicWave.vue'

const password = ref('')
const error = ref('')
const loading = ref(false)
const isLoggedIn = ref(false)
const router = useRouter()
const passwordInput = ref(null)

// 检查登录状态
onMounted(() => {
  const token = localStorage.getItem('authToken')
  if (token) {
    isLoggedIn.value = true
  } else {
    // 自动聚焦输入框
    passwordInput.value?.focus()
  }
})

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value })
    })
    const data = await res.json()
    
    if (data.success) {
      localStorage.setItem('authToken', data.token)
      isLoggedIn.value = true
      router.push('/admin') // 登录成功直接跳转
    } else {
      error.value = 'Access Denied'
    }
  } catch (e) {
    error.value = 'Server Error'
  } finally {
    loading.value = false
  }
}

const goToAdmin = () => {
  router.push('/admin')
}

const handleLogout = () => {
  localStorage.removeItem('authToken')
  isLoggedIn.value = false
  password.value = ''
  error.value = ''
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: #f0f0f0;
}
.login-card {
  padding: 40px;
  border-radius: 20px;
  display: flex; flex-direction: column; gap: 15px;
  width: 300px; text-align: center;
  z-index: 10;
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.4); 
  backdrop-filter: blur(16px);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255,255,255,0.4);
}
.form-group, .action-group {
  display: flex; flex-direction: column; gap: 15px;
}
.buttons {
  display: flex; gap: 10px; justify-content: center;
}
input {
  padding: 12px; border: 1px solid #ddd; border-radius: 8px; outline: none;
}
button {
  padding: 12px; background: #000; color: white; border: none; border-radius: 8px; cursor: pointer; flex: 1;
}
.logout-btn {
  background: #ff4757;
}
.status-text {
  color: #2ecc71; font-weight: bold; margin: 0;
}
.error { color: red; font-size: 12px; margin: 0; }
</style>