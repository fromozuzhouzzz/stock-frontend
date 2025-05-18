export interface Inventory {
  id: number
  material_id: number
  material_name: string
  store_id: number
  store_name: string
  batch_number?: string
  quantity: number
  unit_price?: number
  expiry_date?: string
  production_date?: string
  warning_threshold?: number
  warning: boolean
  created_at: string
}

export interface InventoryForm {
  material_id: number
  store_id: number
  batch_number?: string
  quantity: number
  unit_price?: number
  expiry_date?: string
  production_date?: string
  warning_threshold?: number
}