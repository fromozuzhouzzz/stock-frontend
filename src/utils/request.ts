import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/stores/user'
import { isTokenExpiredOrExpiring } from '@/utils/jwt'

// 存储待重试的请求队列
const pendingRequests: Array<() => void> = []

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000
})

// 请求拦截器
request.interceptors.request.use(
  async config => {
    const token = localStorage.getItem('token')
    // 如果请求头中有跳过刷新标记，则不执行token刷新逻辑
    const skipTokenRefresh = config.headers['X-Skip-Token-Refresh'] === 'true'
    
    if (token) {
      // 检查token是否将要过期且不是刷新token的请求
      if (!skipTokenRefresh && isTokenExpiredOrExpiring(token)) {
        try {
          const userStore = useUserStore()
          const refreshSuccessful = await userStore.refreshToken()
          
          if (refreshSuccessful) {
            // 使用新的token
            config.headers.Authorization = `Bearer ${userStore.token}`
          } else {
            // 刷新失败，跳转登录页
            userStore.logout()
            router.push('/login')
            return Promise.reject(new Error('Token过期，请重新登录'))
          }
        } catch (error) {
          console.error('刷新Token失败:', error)
        }
      } else {
        // 正常添加token
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 添加调试日志
    console.log('API响应:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      headers: response.headers,
      data: response.data
    })
    
    // 特殊处理销售导入API
    if (response.config.url?.includes('/api/sales/import/')) {
      console.log('销售导入API响应:', response.data)
      // 确保响应直接返回，不经过其他处理
      return response.data
    }

    if (response.config.responseType === 'blob') {
      const contentType = response.headers['content-type']
      if (contentType && contentType.includes('application/json')) {
        return response.data.text().then((text: string) => {
          const error = JSON.parse(text)
          return Promise.reject(new Error(error.message || '导出失败'))
        })
      }
      return response
    }
    return response.data
  },
  async error => {
    console.error('Response error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    })

    // 特殊处理销售导入API的错误
    if (error.config?.url?.includes('/api/sales/import/')) {
      console.error('销售导入API错误:', error.response?.data)
    }

    // 获取原始请求配置
    const originalRequest = error.config
    const userStore = useUserStore()

    // 如果状态码是401（未授权）
    if (error.response?.status === 401) {
      // 检查是否是刷新token的请求或已经重试过的请求
      if (
        originalRequest.url === '/api/auth/refresh-token' || 
        originalRequest._retry || 
        originalRequest.headers['X-Skip-Token-Refresh'] === 'true'
      ) {
        // 如果是刷新token的请求本身失败，或已经重试过，则直接登出
        userStore.logout()
        router.push('/login')
        return Promise.reject(error)
      }

      // 标记该请求正在重试
      originalRequest._retry = true

      // 如果用户store正在刷新token，则将当前请求加入待重试队列
      if (userStore.isRefreshingToken) {
        return new Promise(resolve => {
          pendingRequests.push(() => {
            // 用新token更新请求头
            originalRequest.headers.Authorization = `Bearer ${userStore.token}`
            resolve(axios(originalRequest))
          })
        })
      }

      // 尝试刷新token
      try {
        const refreshSuccessful = await userStore.refreshToken()
        
        if (refreshSuccessful) {
          // 刷新token成功，使用新token重试原始请求
          originalRequest.headers.Authorization = `Bearer ${userStore.token}`
          
          // 执行所有等待的请求
          pendingRequests.forEach(callback => callback())
          pendingRequests.length = 0
          
          // 重新发送原始请求
          return axios(originalRequest)
        } else {
          // 刷新失败，重定向到登录页面
          router.push('/login')
          return Promise.reject(error)
        }
      } catch (refreshError) {
        console.error('刷新token出错:', refreshError)
        userStore.logout()
        router.push('/login')
        return Promise.reject(error)
      }
    }

    if (error.response?.data instanceof Blob) {
      return new Promise((_, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string)
            ElMessage.error(errorData.message || '导出失败')
            reject(new Error(errorData.message || '导出失败'))
          } catch (e) {
            ElMessage.error('导出失败')
            reject(new Error('导出失败'))
          }
        }
        reader.onerror = () => {
          ElMessage.error('导出失败')
          reject(new Error('导出失败'))
        }
        reader.readAsText(error.response.data)
      })
    }

    // 检查是否为库存不足错误，如果是，则不显示默认错误提示，由业务组件处理
    const errorMessage = error.response?.data?.message
    if (errorMessage && typeof errorMessage === 'string' && errorMessage.includes('Insufficient inventory')) {
      // 不显示默认错误消息，由业务组件自行处理
      return Promise.reject(error)
    }

    // 处理服务器500错误，尝试重新连接
    if (error.response?.status === 500) {
      // 特殊情况：如果是HuggingFace Spaces刚启动，可能需要多重试几次
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 1
      } else if (originalRequest._retryCount < 3) {
        originalRequest._retryCount++
      } else {
        // 重试3次后仍失败
        ElMessage.error('服务器暂时不可用，请稍后重试')
        return Promise.reject(error)
      }

      // 使用指数退避算法，等待时间随重试次数增加
      const retryDelay = Math.pow(2, originalRequest._retryCount) * 1000
      console.log(`服务器错误，${retryDelay}ms后重试(${originalRequest._retryCount}/3)`)
      
      return new Promise(resolve => {
        setTimeout(() => {
          console.log('重试请求:', originalRequest.url)
          resolve(axios(originalRequest))
        }, retryDelay)
      })
    }

    // 显示默认错误消息
    ElMessage.error(errorMessage || '请求失败')
    return Promise.reject(error)
  }
)

export default request 