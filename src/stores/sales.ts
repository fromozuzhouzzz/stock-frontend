import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SalesRecord, SalesRecordForm } from '@/types'
import { getSalesList, createSalesRecord, updateSalesRecord, deleteSalesRecord } from '@/api/sales'
import { ElMessage, ElMessageBox } from 'element-plus'

export const useSalesStore = defineStore('sales', () => {
  const salesList = ref<SalesRecord[]>([])
  const loading = ref(false)

  async function fetchSales(): Promise<void> {
    loading.value = true
    try {
      const response = await getSalesList()
      if (!response || !response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format')
      }
      // 确保按创建时间倒序排序
      salesList.value = [...response.data].sort((a: SalesRecord, b: SalesRecord) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    } catch (error) {
      console.error('Failed to fetch sales:', error)
      ElMessage.error('获取销售记录失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function addSalesRecord(data: SalesRecordForm): Promise<boolean> {
    try {
      await createSalesRecord(data)
      // 重新获取完整的销售记录列表
      await fetchSales()
      ElMessage.success('添加销售记录成功')
      return true
    } catch (error: any) {
      console.error('Failed to add sales record:', error)
      
      // 特殊处理库存不足错误
      if (error.response?.data?.message && typeof error.response.data.message === 'string') {
        const errorMsg = error.response.data.message
        
        // 检查是否为库存不足错误
        if (errorMsg.includes('Insufficient inventory')) {
          // 提取物料名称
          let materialName = ''
          
          if (errorMsg.includes('for processed material:')) {
            materialName = errorMsg.split('for processed material:')[1].trim()
          } else if (errorMsg.includes('for material:')) {
            materialName = errorMsg.split('for material:')[1].trim()
          }
          
          // 显示中文提示弹窗
          ElMessageBox.alert(
            `"${materialName || '所需物料'}"库存数量不足，无法完成销售记录添加。`,
            '库存不足提示',
            {
              confirmButtonText: '确定',
              type: 'warning',
              callback: () => {}
            }
          )
          
          return false
        }
      }
      
      // 其他错误仍使用通用错误提示
      ElMessage.error('添加销售记录失败')
      return false
    }
  }

  // 添加编辑销售记录方法
  async function updateSales(id: number, data: SalesRecordForm): Promise<boolean> {
    try {
      await updateSalesRecord(id, data)
      // 重新获取完整的销售记录列表
      await fetchSales()
      ElMessage.success('更新销售记录成功')
      return true
    } catch (error: any) {
      console.error('Failed to update sales record:', error)
      
      // 特殊处理库存不足错误
      if (error.response?.data?.message && typeof error.response.data.message === 'string') {
        const errorMsg = error.response.data.message
        
        // 检查是否为库存不足错误
        if (errorMsg.includes('Insufficient inventory')) {
          // 提取物料名称
          let materialName = ''
          
          if (errorMsg.includes('for processed material:')) {
            materialName = errorMsg.split('for processed material:')[1].trim()
          } else if (errorMsg.includes('for material:')) {
            materialName = errorMsg.split('for material:')[1].trim()
          }
          
          // 显示中文提示弹窗
          ElMessageBox.alert(
            `库存不足：${materialName || '所需物料'}库存数量不足，无法完成销售记录更新。`,
            '库存不足提示',
            {
              confirmButtonText: '确定',
              type: 'warning',
              callback: () => {}
            }
          )
          
          return false
        }
      }
      
      ElMessage.error('更新销售记录失败')
      return false
    }
  }

  // 添加删除销售记录方法
  async function deleteSales(id: number): Promise<boolean> {
    try {
      await deleteSalesRecord(id)
      // 重新获取完整的销售记录列表
      await fetchSales()
      ElMessage.success('删除销售记录成功')
      return true
    } catch (error) {
      console.error('Failed to delete sales record:', error)
      ElMessage.error('删除销售记录失败')
      return false
    }
  }

  return {
    salesList,
    loading,
    fetchSales,
    addSalesRecord,
    updateSales,
    deleteSales
  }
}) 