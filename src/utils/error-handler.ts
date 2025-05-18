import { ElMessage } from 'element-plus'
import type { AxiosError } from 'axios'

interface ApiError {
  message: string
  code?: string
  details?: Record<string, string>
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error)
  
  if (isAxiosError(error)) {
    const apiError = error.response?.data as ApiError
    
    // 处理验证错误
    if (error.response?.status === 422 && apiError.details) {
      Object.values(apiError.details).forEach(message => {
        ElMessage.error(message)
      })
      return
    }
    
    // 处理其他已知错误
    if (apiError?.message) {
      ElMessage.error(apiError.message)
      return
    }
    
    // 处理网络错误
    if (error.message === 'Network Error') {
      ElMessage.error('网络连接失败，请检查网络设置')
      return
    }
  }
  
  // 处理未知错误
  ElMessage.error('操作失败，请稍后重试')
}

function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError === true
}

export function handleSuccess(message: string) {
  ElMessage.success(message)
} 