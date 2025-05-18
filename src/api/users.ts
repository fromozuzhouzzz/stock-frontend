import request from '@/utils/request'
import type { User } from '@/types'

// 获取用户列表
export function getUserList() {
  return request.get<{ data: User[] }>('/api/users/')
}

// 创建新用户
export interface CreateUserData {
  username: string
  password: string
  role: 'admin' | 'store_manager' | 'purchaser'
  store_id?: number
}

export function createUser(data: CreateUserData) {
  return request.post<User>('/api/users/', data)
}

// 更新用户信息
export interface UpdateUserData {
  username?: string
  role?: 'admin' | 'store_manager' | 'purchaser'
  store_id?: number
  password?: string
}

export function updateUser(id: number, data: UpdateUserData) {
  return request.put<User>(`/api/users/${id}`, data)
}

// 删除用户
export function deleteUser(id: number) {
  return request.delete(`/api/users/${id}`)
}

// 重置用户密码
export function resetPassword(id: number, password: string) {
  return request.post<{ message: string }>(`/api/users/${id}/reset-password`, { password })
} 