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