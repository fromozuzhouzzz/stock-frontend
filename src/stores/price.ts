import { defineStore } from 'pinia'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import type { PriceAdjustment } from '@/types'

interface PriceState {
  loading: boolean
  prices: any[]
  history: PriceAdjustment[]
  total: number
  currentPage: number
}

export const usePriceStore = defineStore('price', {
  state: (): PriceState => ({
    loading: false,
    prices: [],
    history: [],
    total: 0,
    currentPage: 1
  }),

  actions: {
    async fetchPrices(page = 1) {
      this.loading = true
      try {
        const res = await request.get('/api/prices/', {
          params: { page, per_page: 10 }
        })
        this.prices = res.data
        this.total = res.data?.total || 0
        this.currentPage = page
      } catch (error) {
        console.error('获取价格列表失败:', error)
        ElMessage.error('获取价格列表失败')
      } finally {
        this.loading = false
      }
    },

    async fetchHistory(page = 1) {
      this.loading = true
      try {
        const res = await request.get('/api/prices/history/', {
          params: { page, per_page: 10 }
        })
        this.history = res.data
        this.total = res.data?.total || 0
        this.currentPage = page
      } catch (error) {
        console.error('获取价格历史失败:', error)
        ElMessage.error('获取价格历史失败')
      } finally {
        this.loading = false
      }
    },

    async submitAdjustment(data: any) {
      try {
        await request.post('/api/prices/adjust/', data)
        ElMessage.success('价格调整申请已提交')
        return true
      } catch (error) {
        console.error('提交价格调整失败:', error)
        return false
      }
    },

    async approveAdjustment(id: number, action: 'approved' | 'rejected') {
      try {
        await request.post(`/api/prices/approve/${id}/`, { action })
        ElMessage.success(action === 'approved' ? '已通过审核' : '已拒绝申请')
        return true
      } catch (error) {
        console.error('处理价格调整失败:', error)
        return false
      }
    }
  }
})