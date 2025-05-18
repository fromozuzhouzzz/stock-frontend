import request from '@/utils/request'
import type { PurchaseOrder, PurchaseOrderForm } from '@/types'

export function getPurchaseOrders() {
  return request.get<{ data: PurchaseOrder[] }>('/api/purchase/')
}

export function createPurchaseOrder(data: PurchaseOrderForm) {
  return request.post<PurchaseOrder>('/api/purchase/', data)
} 