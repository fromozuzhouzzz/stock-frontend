<template>
  <div class="purchase">
    <div class="page-header">
      <h3 class="page-title">采购管理</h3>
      <div class="actions">
        <el-button type="primary" @click="handleAdd" v-permission="'purchase.create'">
          创建采购订单
        </el-button>
      </div>
    </div>
    
    <el-table 
      :data="purchaseOrders" 
      v-loading="loading"
      stripe
      border
      style="width: 100%"
    >
      <el-table-column prop="material_name" label="物料名称" min-width="120" />
      <el-table-column label="采购数量" align="right" min-width="120">
        <template #default="{ row }">
          {{ row.quantity }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_by" label="创建人" min-width="120" />
      <el-table-column prop="created_at" label="创建时间" min-width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.created_at) }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建采购订单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="创建采购订单"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="物料" prop="material_id">
          <el-select v-model="form.material_id" placeholder="请选择物料">
            <el-option
              v-for="material in materials"
              :key="material.id"
              :label="material.name"
              :value="material.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="采购数量" prop="quantity">
          <el-input-number 
            v-model="form.quantity"
            :min="1"
            :precision="2"
            :step="1"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { usePurchaseStore } from '@/stores/purchase'
import { useMaterialStore } from '@/stores/materials'
import type { PurchaseOrderForm } from '@/types'

const purchaseStore = usePurchaseStore()
const materialStore = useMaterialStore()

const { purchaseOrders, loading } = purchaseStore
const { materials } = materialStore

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const form = ref<PurchaseOrderForm>({
  material_id: 0,
  quantity: 1
})

const rules = {
  material_id: [{ required: true, message: '请选择物料', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入采购数量', trigger: 'blur' }]
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已审核',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return ''
  return dateStr
}

function handleAdd() {
  dialogVisible.value = true
  form.value = {
    material_id: 0,
    quantity: 1
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const success = await purchaseStore.addPurchaseOrder(form.value)
        if (success) {
          dialogVisible.value = false
        }
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(async () => {
  await Promise.all([
    purchaseStore.fetchPurchaseOrders(),
    materialStore.fetchMaterials()
  ])
})
</script>

<style scoped>
.purchase {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 10px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-select) {
  width: 100%;
}
</style> 