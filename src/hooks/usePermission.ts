import { useUserStore } from '@/stores/user'
import type { User } from '@/types'

// 权限枚举
export const enum Permissions {
  // 物料权限
  MATERIAL_VIEW = 'material.view',
  MATERIAL_CREATE = 'material.create',
  MATERIAL_UPDATE = 'material.update',
  MATERIAL_DELETE = 'material.delete',
  
  // 库存权限
  INVENTORY_VIEW = 'inventory.view',
  INVENTORY_CREATE = 'inventory.create',
  INVENTORY_UPDATE = 'inventory.update',
  INVENTORY_EXPORT = 'inventory.export',
  
  // 销售权限
  SALES_VIEW = 'sales.view',
  SALES_CREATE = 'sales.create',
  SALES_EXPORT = 'sales.export',
  
  // 采购权限
  PURCHASE_VIEW = 'purchase.view',
  PURCHASE_CREATE = 'purchase.create',
  PURCHASE_APPROVE = 'purchase.approve',
  
  // 价格管理权限
  PRICE_ADJUST = 'price.adjust',
  PRICE_APPROVE = 'price.approve',
  
  // 菜品管理权限
  DISH_CREATE = 'dish.create',
  DISH_UPDATE = 'dish.update',
  DISH_RECIPE = 'dish.recipe',
  DISH_DELETE = 'dish.delete',
  
  // 门店管理权限
  STORE_VIEW = 'store.view',
  STORE_CREATE = 'store.create',
  STORE_UPDATE = 'store.update',
  STORE_DELETE = 'store.delete',
  
  // 用户管理权限
  USER_VIEW = 'user.view',
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  
  // 系统设置权限
  SETTINGS_VIEW = 'settings.view'
}

// 角色权限映射表
export const RolePermissions: Record<string, string[]> = {
  admin: [
    // 物料权限
    Permissions.MATERIAL_VIEW,
    Permissions.MATERIAL_CREATE,
    Permissions.MATERIAL_UPDATE,
    Permissions.MATERIAL_DELETE,
    
    // 库存权限
    Permissions.INVENTORY_VIEW,
    Permissions.INVENTORY_CREATE,
    Permissions.INVENTORY_UPDATE,
    Permissions.INVENTORY_EXPORT,
    
    // 销售权限
    Permissions.SALES_VIEW,
    Permissions.SALES_CREATE,
    Permissions.SALES_EXPORT,
    
    // 采购权限
    Permissions.PURCHASE_VIEW,
    Permissions.PURCHASE_CREATE,
    Permissions.PURCHASE_APPROVE,
    
    // 价格管理权限
    Permissions.PRICE_ADJUST,
    Permissions.PRICE_APPROVE,
    
    // 菜品管理权限
    Permissions.DISH_CREATE,
    Permissions.DISH_UPDATE,
    Permissions.DISH_RECIPE,
    Permissions.DISH_DELETE,
    
    // 门店管理权限
    Permissions.STORE_VIEW,
    Permissions.STORE_CREATE,
    Permissions.STORE_UPDATE,
    Permissions.STORE_DELETE,
    
    // 用户管理权限
    Permissions.USER_VIEW,
    Permissions.USER_CREATE,
    Permissions.USER_UPDATE,
    Permissions.USER_DELETE,
    
    // 系统设置权限
    Permissions.SETTINGS_VIEW
  ],
  purchaser: [
    Permissions.MATERIAL_VIEW,
    Permissions.PURCHASE_VIEW,
    Permissions.PURCHASE_CREATE,
    Permissions.PRICE_ADJUST,
    Permissions.INVENTORY_VIEW,
    Permissions.STORE_VIEW
  ],
  store_manager: [
    Permissions.MATERIAL_VIEW,
    Permissions.INVENTORY_VIEW,
    Permissions.INVENTORY_CREATE,
    Permissions.INVENTORY_UPDATE,
    Permissions.INVENTORY_EXPORT,
    Permissions.SALES_VIEW,
    Permissions.SALES_CREATE,
    Permissions.SALES_EXPORT,
    Permissions.PURCHASE_VIEW,
    Permissions.STORE_VIEW
  ]
}

// 用于直接检查用户权限的工具函数
export function checkPermission(user: User | null, permission: string): boolean {
  if (!user) return false
  return RolePermissions[user.role]?.includes(permission) || false
}

// 组合式API钩子
export function usePermission() {
  const userStore = useUserStore()

  const hasPermission = (permission: string) => {
    return checkPermission(userStore.currentUser, permission)
  }

  return {
    hasPermission
  }
} 