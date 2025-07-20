import request from '@/utils/request'
import type { Inventory } from '@/types'

export function getInventoryList() {
  return request.get<{ data: Inventory[] }>('/api/inventory/')
}

export interface UpdateStockData {
  id?: number
  material_id: number
  store_id: number
  batch_number?: string
  quantity: number
  unit_price?: number
  production_date?: string
  expiry_date?: string
  warning_threshold?: number
  type?: 'add' | 'edit'
  auto_process?: boolean // 自动入库加工标志
}

export function updateInventory(data: UpdateStockData) {
  if (data.type === 'edit' && data.id) {
    const submitData = { ...data };
    delete submitData.type;
    delete submitData.id;
    
    return request.put<Inventory>(`/api/inventory/${data.id}/`, submitData);
  } else {
    const submitData = { ...data };
    delete submitData.type;
    delete submitData.id;
    
    return request.post<Inventory>('/api/inventory/', submitData);
  }
}

export interface TransferStockData {
  material_id: number
  source_store_id: number
  target_store_id: number
  quantity: number
  batch_number: string
}

export function transferStock(data: TransferStockData) {
  return request.post<{ source: Inventory, target: Inventory }>('/api/inventory/transfer/', data)
}

export function getInventoryStats() {
  return request.get<{
    total_materials: number
    warning_count: number
    total_quantity: number
    warning_items: Array<{
      material_name: string
      quantity: number
      warning_threshold: number
      store_name: string
      unit: string
    }>
  }>('/api/inventory/stats/')
}

export function exportInventory() {
  return request({
    url: '/api/inventory/export/',
    method: 'get',
    responseType: 'blob',
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }) as Promise<{ data: Blob }>
}

export interface CheckoutStockData {
  material_id: number
  store_id: number
  quantity: number
}

export function checkoutStock(data: CheckoutStockData) {
  return request.post<{
    success: boolean,
    updated_inventories: Inventory[],
    checkout_details: Array<{
      batch_number: string,
      quantity: number,
      unit_price: number
    }>
  }>('/api/inventory/checkout/', data)
}

export interface ProcessMaterialData {
  inventory_id?: number
  material_id: number
  store_id: number
  quantity: number
  batch_number?: string
}

export function processMaterial(data: ProcessMaterialData) {
  return request.post<{
    success: boolean,
    original_inventory: Inventory,
    processed_inventory: Inventory
  }>('/api/inventory/process/', data)
}