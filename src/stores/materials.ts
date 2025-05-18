import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Material } from '@/types'
import { getMaterialList, createMaterial, updateMaterial, deleteMaterial } from '@/api/materials'
import { ElMessage } from 'element-plus'

export const useMaterialStore = defineStore('materials', () => {
  const materials = ref<Material[]>([])
  const loading = ref(false)
  const currentMaterial = ref<Material | null>(null)

  async function fetchMaterials(): Promise<void> {
    loading.value = true
    try {
      const response = await getMaterialList()
      if (response && response.data && Array.isArray(response.data)) {
        materials.value = response.data
      } else if (Array.isArray(response)) {
        materials.value = response
      } else {
        console.error('响应格式不正确:', response)
        materials.value = []
      }
    } catch (error) {
      console.error('获取物料列表失败:', error)
      ElMessage.error('获取物料列表失败')
    } finally {
      loading.value = false
    }
  }

  async function addMaterial(material: Omit<Material, 'id'>): Promise<boolean> {
    try {
      await createMaterial(material)
      await fetchMaterials()
      ElMessage.success('添加成功')
      return true
    } catch (error) {
      console.error('添加物料失败:', error)
      ElMessage.error('添加物料失败')
      return false
    }
  }

  async function updateMaterialById(id: number, material: Partial<Material>): Promise<boolean> {
    try {
      await updateMaterial(id, material)
      await fetchMaterials()
      ElMessage.success('更新成功')
      return true
    } catch (error) {
      console.error('更新物料失败:', error)
      ElMessage.error('更新物料失败')
      return false
    }
  }

  async function deleteMaterialById(id: number): Promise<boolean> {
    try {
      await deleteMaterial(id)
      return true
    } catch (error: any) {
      throw error.response?.data?.message 
        ? new Error(error.response.data.message)
        : error
    }
  }

  function setCurrentMaterial(material: Material | null): void {
    currentMaterial.value = material
  }

  return {
    materials,
    loading,
    currentMaterial,
    fetchMaterials,
    addMaterial,
    updateMaterialById,
    deleteMaterialById,
    setCurrentMaterial
  }
}) 