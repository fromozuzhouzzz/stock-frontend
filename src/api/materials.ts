import request from '@/utils/request'
import type { Material } from '@/types'

// 获取所有物料
export function getMaterials() {
  return request({
    url: '/api/materials/',
    method: 'get'
  })
}

// 获取物料分类
export function getMaterialCategories() {
  return request({
    url: '/api/materials/categories/',
    method: 'get'
  })
}

// 更新物料分类
export function updateMaterialCategory(oldCategory: string, newCategory: string) {
  return request.post('/api/materials/categories/update/', {
    oldCategory,
    newCategory
  }, {
    timeout: 15000
  })
}

// 添加物料分类
export function addMaterialCategory(newCategory: string) {
  return request.post('/api/materials/categories/add/', {
    newCategory
  }, {
    timeout: 15000
  })
}

// 获取物料列表
export function getMaterialList() {
  return request.get<{ data: Material[] }>('/api/materials/')
}

// 创建物料
export function createMaterial(data: Omit<Material, 'id'>) {
  return request.post<Material>('/api/materials/', data)
}

// 更新物料
export function updateMaterial(id: number, data: Partial<Material>) {
  return request.put<Material>(`/api/materials/${id}`, data)
}

// 删除物料
export function deleteMaterial(id: number) {
  return request.delete(`/api/materials/${id}`)
} 