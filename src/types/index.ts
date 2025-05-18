export interface User {
  id: number
  username: string
  role: 'admin' | 'store_manager' | 'purchaser'
  store_id?: number
  store_name?: string
  created_at?: string
}

export interface Material {
  id: number
  name: string
  unit: string
  category: string
  warning_threshold: number
  processed_name?: string
  processed_unit?: string
  processed_warning_threshold?: number
  conversion_ratio?: number
  created_at?: string
  updated_at?: string
  current_stock?: number
  status?: 'normal' | 'warning'
}

export interface Inventory {
  id: number
  material_id: number
  material_name: string
  store_id: number
  store_name: string
  quantity: number
  unit: string
  warning: boolean
  warning_threshold: number
  updated_at: string
  batch_number?: string
  unit_price?: number
  production_date?: string
  expiry_date?: string
  batchCount?: number
  isProcessed?: boolean
  totalGroupQuantity?: number
}

export interface Store {
  id: number
  name: string
  address: string
  created_at: string
}

export interface InventoryStats {
  total_materials: number
  warning_count: number
  total_quantity: number
  warning_items: WarningItem[]
}

export interface WarningItem {
  material_name: string
  quantity: number
  warning_threshold: number
  store_name: string
  unit: string
}

export interface SalesRecord {
  id: number
  store_id: number
  store_name: string
  dish_id: number
  dish_name: string
  quantity: number
  unit: string
  sale_date: string
  created_at: string
  material_id?: number
}

export interface SalesRecordForm {
  store_id: number | undefined
  dish_id: number | undefined
  quantity: number
  sale_date: string | Date
  material_id?: number
}

export interface PurchaseOrder {
  id: number
  material_id: number
  material_name: string
  quantity: number
  status: 'pending' | 'approved' | 'completed' | 'cancelled'
  created_by: string
  created_at: string
}

export interface PurchaseOrderForm {
  material_id: number
  quantity: number
}

export interface Price {
  id: number
  material_id: number
  material_name: string
  material_unit: string
  purchase_price: string
  transfer_price: string
  effective_date: string
  status: 'pending' | 'active' | 'expired'
}

export interface PriceAdjustment {
  id: number
  material_id: number
  material_name: string
  material_unit: string
  price_type: 'purchase' | 'transfer'
  old_price: string
  new_price: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  effective_date: string
  created_at: string
}

export interface Dish {
  id: number
  name: string
  category: string
  description: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface DishRecipe {
  id: number
  dish_id: number
  version: string
  status: 'draft' | 'active' | 'archived'
  effective_date: string
  materials: RecipeMaterial[]
}

export interface RecipeMaterial {
  id: number
  recipe_id: number
  material_id: number
  material_name?: string
  material_unit?: string
  quantity: number
  is_required: boolean
  loss_rate: number
  alternative_material_id?: number
  alternative_material_name?: string
  notes?: string
} 