import request from '@/utils/request'
import type { SalesRecord, SalesRecordForm } from '@/types'

export function getSalesList() {
  return request.get<{ data: SalesRecord[] }>('/api/sales/')
}

export function createSalesRecord(data: SalesRecordForm) {
  return request.post<SalesRecord>('/api/sales/', data)
}

export function exportSales() {
  return request({
    url: '/api/sales/export/',
    method: 'get',
    responseType: 'blob',
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  })
}

export function updateSalesRecord(id: number, data: SalesRecordForm) {
  return request.put<SalesRecord>(`/api/sales/${id}/`, data)
}

export function deleteSalesRecord(id: number) {
  return request.delete<{ message: string }>(`/api/sales/${id}/`)
}

export function getSalesStats(params?: {
  period?: 'day' | 'week' | 'month'
  start_date?: string
  end_date?: string
  exclude_main_store?: boolean
}) {
  return request.get('/api/sales/stats/', { 
    params,
    timeout: 15000 // 增加超时时间到15秒
  })
}

export interface ImportSalesData {
  store_id: number
  sale_date: string
  sales_items: Array<{
    dish_name: string
    quantity: number
  }>
  should_deduct_inventory?: boolean
}

export function importSalesData(data: ImportSalesData) {
  return request.post<{ success: boolean; message: string; imported_count: number }>('/api/sales/import/', data)
} 