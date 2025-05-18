import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
  error => {
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

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
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

    // 显示默认错误消息
    ElMessage.error(errorMessage || '请求失败')
    return Promise.reject(error)
  }
)

export default request 