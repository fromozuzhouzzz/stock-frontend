import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Inventory } from '@/types'
import { getInventoryList } from '@/api/inventory'
import { exportInventory as apiExportInventory } from '@/api/inventory'
import type { UpdateStockData } from '@/api/inventory'
import { updateInventory } from '@/api/inventory'
import { ElMessage } from 'element-plus'

export const useInventoryStore = defineStore('inventory', () => {
  const inventoryList = ref<Inventory[]>([])
  const loading = ref(false)

  async function fetchInventory() {
    loading.value = true
    try {
      const response = await getInventoryList()
      if (!response || !('data' in response) || !Array.isArray(response.data)) {
        throw new Error('Invalid response format')
      }
      inventoryList.value = response.data as Inventory[]
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
      ElMessage.error('获取库存列表失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateStock(data: UpdateStockData) {
    try {
      const response = await updateInventory(data)
      if (!response) {
        throw new Error('Invalid response format')
      }
      return response
    } catch (error) {
      console.error('Failed to update inventory:', error)
      throw error
    }
  }

  async function exportInventory(): Promise<{ data: Blob }> {
    try {
      return await apiExportInventory()
    } catch (error) {
      console.error('Failed to export inventory:', error)
      throw error
    }
  }

  return {
    inventoryList,
    loading,
    fetchInventory,
    updateStock,
    exportInventory
  }
})