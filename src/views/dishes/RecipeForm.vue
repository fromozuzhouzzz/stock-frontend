<template>
  <page-container :title="`${dish?.name || ''} - 配方管理`">
    <el-form 
      v-loading="dishStore.loading"
      label-width="100px"
    >
      <el-form-item label="配方版本">
        <el-input v-model="form.version" style="width: 200px" />
      </el-form-item>

      <el-form-item label="生效日期">
        <el-date-picker
          v-model="form.effective_date"
          type="date"
          placeholder="选择日期"
        />
      </el-form-item>

      <el-form-item label="配料清单">
        <div class="materials-list">
          <el-table :data="form.materials ? (form.materials as unknown as RecipeMaterialForm[]) : []" border>
            <el-table-column label="物料" min-width="180" align="center">
              <template #default="{ row }">
                <el-select 
                  v-model="row.material_id" 
                  filterable 
                  placeholder="请选择物料"
                  style="width: 100%"
                >
                  <el-option
                    v-for="option in materialOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <div v-if="!hasProcessedMaterials" class="material-warning">
                  <el-alert
                    type="warning"
                    :closable="false"
                    show-icon
                    size="small"
                  >
                    未找到可用的加工物料，请先在物料管理中配置加工信息
                  </el-alert>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="用量" width="180" align="center">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.quantity" 
                  :min="0" 
                  :precision="2"
                />
              </template>
            </el-table-column>
            <el-table-column label="损耗率" width="180" align="center">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.loss_rate" 
                  :min="0" 
                  :max="1"
                  :precision="2"
                  :step="0.01"
                />
              </template>
            </el-table-column>
            <el-table-column label="必需" width="60" align="center">
              <template #default="{ row }">
                <el-checkbox v-model="row.is_required" />
              </template>
            </el-table-column>
            <el-table-column label="备注" width="120" align="center">
              <template #default="{ row }">
                <el-input v-model="row.notes" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button 
                  type="danger" 
                  link
                  @click="removeMaterial($index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="action-buttons">
            <el-button type="primary" @click="addMaterial">
              <el-icon><Plus /></el-icon>添加配料
            </el-button>
            <el-button 
              type="primary" 
              @click="handleSave"
              v-permission="'dish.recipe'"
            >
              <el-icon><Check /></el-icon>保存
            </el-button>
            <el-button type="primary" @click="$router.push('/dishes')">
              <el-icon><Back /></el-icon>返回
            </el-button>
          </div>
        </div>
      </el-form-item>
    </el-form>
  </page-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDishStore } from '@/stores/dish'
import { useMaterialStore } from '@/stores/material'
import type { Dish, DishRecipe, RecipeMaterial } from '@/types'
import { ElMessage } from 'element-plus'
import { Back, Check, Plus } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const dishStore = useDishStore()
const materialStore = useMaterialStore()

const dish = ref<Dish | null>(null)

interface RecipeMaterialForm {
  material_id: number | null
  quantity: number
  is_required: boolean
  loss_rate: number
  notes: string
  id?: number
  recipe_id?: number
}

const form = ref<Partial<DishRecipe>>({
  version: '1.0',
  effective_date: new Date().toISOString().split('T')[0],
  materials: [] as unknown as RecipeMaterial[]
})

const addMaterial = () => {
  if (!form.value.materials) {
    form.value.materials = [] as unknown as RecipeMaterial[]
  }
  
  (form.value.materials as unknown as RecipeMaterialForm[]).push({
    material_id: null,
    quantity: 0,
    is_required: true,
    loss_rate: 0,
    notes: ''
  })
}

const handleSave = async () => {
  const dishId = Number(route.params.id)
  if (!dishId) return
  
  try {
    // 验证必填项
    if (!form.value.version) {
      ElMessage.error('请输入配方版本')
      return
    }
    if (!form.value.effective_date) {
      ElMessage.error('请选择生效日期')
      return
    }
    if (!form.value.materials?.length) {
      ElMessage.error('请至少添加一个配料')
      return
    }
    
    // 验证配料数据
    for (const material of form.value.materials as unknown as RecipeMaterialForm[]) {
      if (!material.material_id) {
        ElMessage.error('请选择物料')
        return
      }
      if (material.quantity <= 0) {
        ElMessage.error('用量必须大于0')
        return
      }
    }
    
    // 调用 store 的保存方法
    const success = await dishStore.saveRecipe(dishId, {
      version: form.value.version as string,
      effective_date: form.value.effective_date as string,
      materials: (form.value.materials as unknown as RecipeMaterialForm[]).map(m => ({
        id: m.id,
        recipe_id: m.recipe_id,
        material_id: m.material_id as number,
        quantity: m.quantity,
        is_required: m.is_required,
        loss_rate: m.loss_rate,
        notes: m.notes || ''
      })) as RecipeMaterial[]
    })
    
    if (success) {
      ElMessage.success('保存成功')
      router.push('/dishes')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

// 检查是否有可用的加工物料
const hasProcessedMaterials = computed(() => {
  return materialStore.materials.some(m => m.processed_name && m.processed_unit)
})

// 添加一个计算属性来处理物料列表
const materialOptions = computed(() => {
  console.log('Current materials:', materialStore.materials) // 添加日志
  // 只过滤出加工后的物料（有processed_name的物料）
  return materialStore.materials
    .filter(m => m.processed_name && m.processed_unit)
    .map(m => ({
      label: `${m.processed_name} (${m.processed_unit})`,
      value: m.id
    }))
})

// 添加删除方法
const removeMaterial = ($index: number) => {
  if (form.value.materials) {
    (form.value.materials as unknown as RecipeMaterialForm[]).splice($index, 1);
  }
}

onMounted(async () => {
  const dishId = Number(route.params.id)
  // 无论是否有菜品ID，都先加载物料列表
  await materialStore.fetchMaterials()
  console.log('Materials loaded:', materialStore.materials)
  
  if (dishId) {
    try {
      console.log('Loading recipe...')
      // 加载配方数据
      await dishStore.fetchRecipe(dishId)
      console.log('Recipe loaded:', dishStore.currentRecipe)
      
      if (dishStore.currentRecipe) {
        form.value = { ...dishStore.currentRecipe }
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      ElMessage.error('加载数据失败')
    }
  }
  
  // 如果没有加工物料，显示提示
  if (!hasProcessedMaterials.value) {
    ElMessage.warning('未找到加工物料，请先在物料管理中配置加工信息')
  }
})
</script>

<style scoped>
.materials-list {
  margin-top: 20px;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.material-warning {
  margin-top: 10px;
}
</style> 