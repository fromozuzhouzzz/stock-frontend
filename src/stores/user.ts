import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import request from '@/utils/request'
import { 
  changePassword as apiChangePassword, 
  login as apiLogin,
  refreshToken as apiRefreshToken,
  checkSession as apiCheckSession
} from '@/api/auth'
import { isTokenExpiredOrExpiring } from '@/utils/jwt'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isRefreshingToken = ref(false)
  const refreshPromise = ref<Promise<boolean> | null>(null)

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

  /**
   * 刷新token
   * @returns 是否刷新成功
   */
  async function refreshToken() {
    // 如果已经在刷新中，直接返回刷新的Promise
    if (isRefreshingToken.value && refreshPromise.value) {
      return refreshPromise.value
    }

    console.log('开始刷新token')
    isRefreshingToken.value = true
    
    // 创建新的Promise，并保存引用，以便可以在其他请求中共享结果
    refreshPromise.value = new Promise<boolean>(async (resolve) => {
      try {
        if (!token.value) {
          console.warn('无token可刷新，需要重新登录')
          logout()
          resolve(false)
          return
        }

        const response = await apiRefreshToken()
        const responseData = response.data
        
        if (responseData && responseData.access_token) {
          console.log('成功获取新token')
          token.value = responseData.access_token
          localStorage.setItem('token', responseData.access_token)
          resolve(true)
        } else {
          console.error('刷新token失败: 未收到新token')
          logout()
          resolve(false)
        }
      } catch (error) {
        console.error('刷新token出错:', error)
        logout()
        resolve(false)
      } finally {
        isRefreshingToken.value = false
        refreshPromise.value = null
      }
    })

    return refreshPromise.value
  }

  /**
   * 检查token状态
   * @returns 如果token有效，返回true；否则返回false
   */
  async function checkTokenStatus(): Promise<boolean> {
    if (!token.value) {
      return false
    }

    // 检查token是否过期或即将过期
    if (isTokenExpiredOrExpiring(token.value)) {
      console.log('Token已过期或即将过期，尝试刷新')
      return await refreshToken()
    }

    try {
      // 即使token看起来有效，仍然检查会话状态
      await apiCheckSession()
      return true
    } catch (error) {
      console.warn('会话状态检查失败:', error)
      // 尝试刷新token
      return await refreshToken()
    }
  }

  /**
   * 检查并确保会话有效
   * 用于应用启动时或从后台恢复时
   */
  async function ensureValidSession(): Promise<boolean> {
    try {
      const isValid = await checkTokenStatus()
      if (!isValid) {
        ElMessage.warning('会话已过期，请重新登录')
        logout()
      }
      return isValid
    } catch (error) {
      console.error('检查会话有效性失败:', error)
      logout()
      return false
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
    changePassword,
    refreshToken,
    checkTokenStatus,
    ensureValidSession,
    isRefreshingToken
  }
}) 