import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import request from '@/utils/request'
import { changePassword as apiChangePassword, login as apiLogin } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)
  const token = ref<string | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  async function login(username: string, password: string) {
    try {
      console.log('Attempting login with:', { username })
      
      const response = await apiLogin({
        username,
        password
      })
      
      // 确保我们获取到正确的数据结构
      const responseData = response.data || response
      console.log('Login response:', responseData)
      
      if (!responseData.access_token || !responseData.user) {
        console.error('Invalid login response:', responseData)
        return false
      }

      // 先设置 token，确保后续请求能带上 token
      token.value = responseData.access_token
      localStorage.setItem('token', responseData.access_token)
      
      // 再设置用户信息
      currentUser.value = responseData.user
      localStorage.setItem('user', JSON.stringify(responseData.user))
      
      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  function logout() {
    currentUser.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // 初始化时从localStorage恢复数据
  function init() {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      token.value = savedToken
      try {
        currentUser.value = JSON.parse(savedUser)
      } catch (e) {
        console.error('Failed to parse saved user:', e)
        logout()
      }
    }
  }

  // 修改密码
  async function changePassword(oldPassword: string, newPassword: string) {
    try {
      if (!currentUser.value) {
        throw new Error('用户未登录')
      }
      
      // 使用新的API端点
      const response = await apiChangePassword(oldPassword, newPassword)
      return response.data || response
    } catch (error) {
      console.error('修改密码失败:', error)
      throw error
    }
  }

  // 执行初始化
  init()

  return {
    currentUser,
    token,
    isLoggedIn,
    login,
    logout,
    init,
    changePassword
  }
}) 