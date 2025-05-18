import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PurchaseOrder, PurchaseOrderForm } from '@/types'
import { getPurchaseOrders, createPurchaseOrder } from '@/api/purchase'
import { ElMessage } from 'element-plus'

export const usePurchaseStore = defineStore('purchase', () => {
  const purchaseOrders = ref<PurchaseOrder[]>([])
  const loading = ref(false)

  async function fetchPurchaseOrders(): Promise<void> {
    loading.value = true
    try {
      const response = await getPurchaseOrders()
      if (response && response.data && Array.isArray(response.data)) {
        purchaseOrders.value = response.data
      } else if (Array.isArray(response)) {
        purchaseOrders.value = response
      } else {
        console.error('响应格式不正确:', response)
        purchaseOrders.value = []
      }
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error)
      ElMessage.error('获取采购订单失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function addPurchaseOrder(data: PurchaseOrderForm): Promise<boolean> {
    try {
      const response = await createPurchaseOrder(data)
      if (!response) {
        throw new Error('Invalid response format')
      }
      await fetchPurchaseOrders()
      ElMessage.success('创建采购订单成功')
      return true
    } catch (error) {
      console.error('Failed to create purchase order:', error)
      ElMessage.error('创建采购订单失败')
      return false
    }
  }

  return {
    purchaseOrders,
    loading,
    fetchPurchaseOrders,
    addPurchaseOrder
  }
}) 