<script setup lang="ts">
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import NetworkErrorHandler from '@/components/NetworkErrorHandler.vue'
import { useUserStore } from '@/stores/user'
import { onMounted, onActivated, ref } from 'vue'
import { ElLoading } from 'element-plus'

interface NetworkErrorHandlerInstance {
  show: () => void;
  hide: () => void;
}

const userStore = useUserStore()
const networkErrorHandler = ref<NetworkErrorHandlerInstance | null>(null)

// 页面加载时检查会话状态
onMounted(async () => {
  if (userStore.isLoggedIn) {
    const loadingInstance = ElLoading.service({
      lock: true,
      text: '检查会话状态...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    
    try {
      await userStore.ensureValidSession()
    } catch (error) {
      // 生产环境仅在开发模式下输出错误日志
      if (import.meta.env.DEV) {
        console.error('会话状态检查失败:', error)
      }
      // 显示网络错误处理组件
      if (networkErrorHandler.value) {
        networkErrorHandler.value.show()
      }
    } finally {
      loadingInstance.close()
    }
  }
})

// 监听页面可见性变化，从后台恢复时检查会话
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible' && userStore.isLoggedIn) {
    // 检查距离上次活跃时间是否超过指定时间（例如30分钟）
    const lastActiveTime = localStorage.getItem('lastActiveTime')
    const now = Date.now()
    
    if (lastActiveTime) {
      const timeElapsed = now - parseInt(lastActiveTime)
      // 如果超过30分钟（1800000毫秒），则检查会话有效性
      if (timeElapsed > 1800000) {
        try {
          await userStore.ensureValidSession()
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('会话状态检查失败:', error)
          }
          // 显示网络错误处理组件
          if (networkErrorHandler.value) {
            networkErrorHandler.value.show()
          }
        }
      }
    }
    
    // 更新最后活跃时间
    localStorage.setItem('lastActiveTime', now.toString())
  }
}

// 添加页面可见性变化事件监听
onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  // 初始化最后活跃时间
  localStorage.setItem('lastActiveTime', Date.now().toString())
  
  // 添加全局网络错误监听
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

// 当组件被激活时（比如从后台切回）
onActivated(async () => {
  if (userStore.isLoggedIn) {
    try {
      await userStore.ensureValidSession()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('会话状态检查失败:', error)
      }
      // 显示网络错误处理组件
      if (networkErrorHandler.value) {
        networkErrorHandler.value.show()
      }
    }
  }
})

// 处理网络在线事件
const handleOnline = () => {
  // 网络连接恢复，隐藏错误提示并检查会话状态
  if (networkErrorHandler.value) {
    networkErrorHandler.value.hide()
  }
  
  // 检查会话状态
  if (userStore.isLoggedIn) {
    userStore.ensureValidSession().catch(error => {
      if (import.meta.env.DEV) {
        console.error('网络恢复后会话检查失败:', error)
      }
    })
  }
}

// 处理网络离线事件
const handleOffline = () => {
  // 网络断开连接，显示错误提示
  if (networkErrorHandler.value) {
    networkErrorHandler.value.show()
  }
}
</script>

<template>
  <error-boundary>
    <router-view />
    <network-error-handler 
      ref="networkErrorHandler"
      title="连接问题"
      message="无法连接到服务器，请检查网络连接或稍后再试。如果问题持续存在，可能需要重新登录。"
      :auto-retry="true"
      :retry-delay="15"
    />
  </error-boundary>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

#app {
  height: 100%;
}
</style>
