import request from '@/utils/request'
import type { User } from '@/types'

export function login(data: { username: string; password: string }) {
  return request.post<{ access_token: string; user: User }>('/api/auth/login', data)
}

export function checkDb() {
  return request.get('/api/auth/check_db')
}

export function changePassword(oldPassword: string, newPassword: string) {
  return request.post<{ message: string }>('/api/auth/change-password', { 
    old_password: oldPassword,
    new_password: newPassword
  })
}

/**
 * 刷新token
 * 该函数会使用自定义配置发送请求，不使用全局拦截器中的token
 * 这样可以避免循环调用的问题
 */
export function refreshToken() {
  // 使用特殊标记的请求配置，避免在拦截器中被处理为需要刷新token
  return request.post<{ access_token: string }>('/api/auth/refresh-token', {}, {
    headers: {
      'X-Skip-Token-Refresh': 'true' // 特殊标记，在拦截器中使用
    }
  })
}

/**
 * 检查会话状态
 * 用于应用初始化或从后台恢复时验证会话是否有效
 */
export function checkSession() {
  return request.get<{ status: string }>('/api/auth/check-session', {
    headers: {
      'X-Skip-Token-Refresh': 'true' // 特殊标记，在拦截器中使用
    }
  })
} 