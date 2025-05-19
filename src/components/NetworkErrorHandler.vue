<template>
  <div v-if="isVisible" class="network-error-overlay">
    <div class="network-error-box">
      <el-icon class="error-icon"><WarningFilled /></el-icon>
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="action-buttons">
        <el-button type="primary" @click="retry">重试</el-button>
        <el-button v-if="showLoginButton" @click="gotoLogin">重新登录</el-button>
      </div>
      <div class="auto-retry-info" v-if="countdown > 0">
        {{ countdown }}秒后自动重试...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { ElIcon } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  title: {
    type: String,
    default: '网络连接问题'
  },
  message: {
    type: String,
    default: '无法连接到服务器，可能是网络问题或服务器暂时不可用。'
  },
  autoRetry: {
    type: Boolean,
    default: false
  },
  retryDelay: {
    type: Number,
    default: 10 // 默认10秒后自动重试
  },
  showLoginButton: {
    type: Boolean,
    default: true
  }
})

const router = useRouter()
const userStore = useUserStore()
const isVisible = ref(false)
const countdown = ref(0)
let countdownTimer: number | null = null
let autoRetryTimer: number | null = null

// 显示错误
const show = () => {
  isVisible.value = true
  if (props.autoRetry) {
    startCountdown()
  }
}

// 隐藏错误
const hide = () => {
  isVisible.value = false
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (autoRetryTimer) {
    clearTimeout(autoRetryTimer)
    autoRetryTimer = null
  }
}

// 开始倒计时
const startCountdown = () => {
  countdown.value = props.retryDelay
  
  // 清除之前的计时器
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  if (autoRetryTimer) {
    clearTimeout(autoRetryTimer)
  }
  
  // 设置倒计时
  countdownTimer = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }
  }, 1000)
  
  // 设置自动重试
  autoRetryTimer = window.setTimeout(() => {
    retry()
  }, props.retryDelay * 1000)
}

// 重试
const retry = () => {
  // 刷新当前页面
  window.location.reload()
}

// 去登录页
const gotoLogin = () => {
  userStore.logout()
  router.push('/login')
  hide()
}

// 组件卸载时清理
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  if (autoRetryTimer) {
    clearTimeout(autoRetryTimer)
  }
})

// 暴露方法给外部调用
defineExpose({
  show,
  hide
})
</script>

<style scoped>
.network-error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.network-error-box {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.error-icon {
  font-size: 48px;
  color: #f56c6c;
  margin-bottom: 20px;
}

h2 {
  margin: 0 0 15px;
  font-weight: 500;
  color: #303133;
}

p {
  margin: 0 0 25px;
  color: #606266;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.auto-retry-info {
  margin-top: 15px;
  font-size: 14px;
  color: #909399;
}
</style> 