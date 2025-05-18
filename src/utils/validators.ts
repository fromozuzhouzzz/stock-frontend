import type { Material, Inventory, SalesRecord } from '@/types'

export const materialValidators = {
  name: (value: string) => {
    if (!value) return '物料名称不能为空'
    if (value.length < 2) return '物料名称至少2个字符'
    if (value.length > 50) return '物料名称不能超过50个字符'
    return ''
  },

  unit: (value: string) => {
    if (!value) return '单位不能为空'
    if (value.length > 20) return '单位不能超过20个字符'
    return ''
  },

  warning_threshold: (value: number) => {
    if (value === undefined || value === null) return '预警阈值不能为空'
    if (value < 0) return '预警阈值不能小于0'
    if (value > 999999) return '预警阈值不能超过999999'
    return ''
  }
}

export const inventoryValidators = {
  quantity: (value: number) => {
    if (value === undefined || value === null) return '库存数量不能为空'
    if (value < 0) return '库存数量不能小于0'
    if (value > 999999) return '库存数量不能超过999999'
    return ''
  },

  material_id: (value: number) => {
    if (!value) return '请选择物料'
    return ''
  },

  store_id: (value: number) => {
    if (!value) return '请选择门店'
    return ''
  }
}

export const salesValidators = {
  quantity: (value: number) => {
    if (value === undefined || value === null) return '销售数量不能为空'
    if (value <= 0) return '销售数量必须大于0'
    if (value > 999999) return '销售数量不能超过999999'
    return ''
  },

  material_id: (value: number) => {
    if (!value) return '请选择物料'
    return ''
  },

  store_id: (value: number) => {
    if (!value) return '请选择门店'
    return ''
  },

  sale_date: (value: string) => {
    if (!value) return '请选择销售日期'
    return ''
  }
}

export function validateMaterial(material: Partial<Material>) {
  const errors: Record<string, string> = {}
  
  if ('name' in material) {
    const nameError = materialValidators.name(material.name!)
    if (nameError) errors.name = nameError
  }
  
  if ('unit' in material) {
    const unitError = materialValidators.unit(material.unit!)
    if (unitError) errors.unit = unitError
  }
  
  if ('warning_threshold' in material) {
    const thresholdError = materialValidators.warning_threshold(material.warning_threshold!)
    if (thresholdError) errors.warning_threshold = thresholdError
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateInventory(inventory: Partial<Inventory>) {
  const errors: Record<string, string> = {}
  
  if ('quantity' in inventory) {
    const quantityError = inventoryValidators.quantity(inventory.quantity!)
    if (quantityError) errors.quantity = quantityError
  }
  
  if ('material_id' in inventory) {
    const materialError = inventoryValidators.material_id(inventory.material_id!)
    if (materialError) errors.material_id = materialError
  }
  
  if ('store_id' in inventory) {
    const storeError = inventoryValidators.store_id(inventory.store_id!)
    if (storeError) errors.store_id = storeError
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateSalesRecord(record: Partial<SalesRecord>) {
  const errors: Record<string, string> = {}
  
  if ('quantity' in record) {
    const quantityError = salesValidators.quantity(record.quantity!)
    if (quantityError) errors.quantity = quantityError
  }
  
  if ('material_id' in record) {
    const materialError = salesValidators.material_id(record.material_id!)
    if (materialError) errors.material_id = materialError
  }
  
  if ('store_id' in record) {
    const storeError = salesValidators.store_id(record.store_id!)
    if (storeError) errors.store_id = storeError
  }
  
  if ('sale_date' in record) {
    const dateError = salesValidators.sale_date(record.sale_date!)
    if (dateError) errors.sale_date = dateError
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
} 