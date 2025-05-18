import request from '@/utils/request'
import type { Store } from '@/types'

// 获取门店列表
export function getStoreList() {
  return request.get<{ data: Store[] }>('/api/stores/')
}

// 创建新门店
export function createStore(data: Omit<Store, 'id' | 'created_at'>) {
  return request.post<Store>('/api/stores/', data)
}

// 更新门店信息
export function updateStore(id: number, data: Partial<Omit<Store, 'id' | 'created_at'>>) {
  return request.put<Store>(`/api/stores/${id}`, data)
}

// 删除门店
export function deleteStore(id: number) {
  return request.delete(`/api/stores/${id}`)
} 