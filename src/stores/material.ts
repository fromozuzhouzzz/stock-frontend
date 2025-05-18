import { defineStore } from 'pinia'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import type { Material } from '@/types'

interface MaterialState {
  loading: boolean
  materials: Material[]
}

export const useMaterialStore = defineStore('material', {
  state: (): MaterialState => ({
    loading: false,
    materials: []
  }),

  actions: {
    async fetchMaterials() {
      this.loading = true
      try {
        console.log('Fetching materials...')
        const res = await request.get('/api/materials/')
        console.log('Materials response:', res)
        
        if (res.data && Array.isArray(res.data)) {
          this.materials = res.data
          console.log('Updated materials:', this.materials)
        } else {
          console.error('Invalid materials response format:', res)
          this.materials = []
        }
      } catch (error) {
        console.error('获取物料列表失败:', error)
        ElMessage.error('获取物料列表失败')
        this.materials = []
      } finally {
        this.loading = false
      }
    }
  }
}) 