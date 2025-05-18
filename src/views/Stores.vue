<template>
  <page-container title="门店管理">
    <template #actions>
      <el-button type="primary" @click="handleAdd" v-permission="'store.create'">
        <el-icon><Plus /></el-icon>新增门店
      </el-button>
    </template>

    <el-table 
      :data="storeList" 
      v-loading="loading" 
      stripe
      class="glass-table"
    >
      <el-table-column 
        prop="id" 
        label="ID" 
        width="80"
      />
      <el-table-column 
        prop="name" 
        label="门店名称" 
        min-width="150"
        show-overflow-tooltip 
      />
      <el-table-column 
        prop="address" 
        label="门店地址" 
        min-width="200"
        show-overflow-tooltip 
      />
      <el-table-column 
        prop="created_at" 
        label="创建时间" 
        width="180"
      />
      <el-table-column 
        label="操作" 
        width="150" 
        fixed="right" 
        align="center" 
      >
        <template #default="{ row }">
          <el-button 
            type="primary" 
            size="small"
            @click="handleEdit(row)"
            class="edit-button"
            v-permission="'store.update'"
          >
            编辑
          </el-button>
          <el-button 
            type="danger" 
            size="small"
            @click="handleDelete(row)"
            class="delete-button"
            v-permission="'store.delete'"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增门店' : '编辑门店'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="门店名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入门店名称" />
        </el-form-item>
        
        <el-form-item label="门店地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入门店地址" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </page-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import type { Store } from '@/types'
import { getStoreList, createStore, updateStore, deleteStore } from '@/api/stores'
import PageContainer from '@/components/PageContainer.vue'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const storeList = ref<Store[]>([])
const currentId = ref<number | null>(null)

const form = ref({
  name: '',
  address: ''
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
  address: [{ required: true, message: '请输入门店地址', trigger: 'blur' }]
}

// 获取门店列表
const fetchStores = async () => {
  loading.value = true
  try {
    const response = await getStoreList()
    if (response && 'data' in response && Array.isArray(response.data)) {
      storeList.value = response.data
    }
  } catch (error) {
    console.error('获取门店列表失败:', error)
    ElMessage.error('获取门店列表失败')
  } finally {
    loading.value = false
  }
}

// 新增门店
const handleAdd = () => {
  dialogType.value = 'add'
  currentId.value = null
  form.value = {
    name: '',
    address: ''
  }
  dialogVisible.value = true
}

// 编辑门店
const handleEdit = (row: Store) => {
  dialogType.value = 'edit'
  currentId.value = row.id
  form.value = {
    name: row.name,
    address: row.address
  }
  dialogVisible.value = true
}

// 删除门店
const handleDelete = (row: Store) => {
  ElMessageBox.confirm(
    `确定要删除门店 "${row.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteStore(row.id)
      ElMessage.success('删除成功')
      fetchStores()
    } catch (error) {
      console.error('删除门店失败:', error)
      ElMessage.error('删除门店失败')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      if (dialogType.value === 'add') {
        await createStore(form.value)
        ElMessage.success('新增门店成功')
      } else {
        if (currentId.value) {
          await updateStore(currentId.value, form.value)
          ElMessage.success('编辑门店成功')
        }
      }
      dialogVisible.value = false
      fetchStores()
    } catch (error) {
      console.error('操作失败:', error)
      ElMessage.error('操作失败')
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  fetchStores()
})
</script>

<style scoped>
/* 使用与其他页面一致的表格样式 */
:deep(.glass-table) {
  background: #ffffff !important;
  width: 100% !important;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

:deep(.el-table__header) {
  width: 100% !important;
}

:deep(.el-table th) {
  background: #f5f7fa !important;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 600;
  color: #333333;
}

:deep(.el-table tr) {
  background: #ffffff !important;
  transition: background-color 0.3s;
}

:deep(.el-table tr:hover) {
  background: #f5f7fa !important;
}

:deep(.el-table td) {
  background: transparent !important;
  border-bottom: 1px solid #ebeef5;
}

/* 按钮样式 */
:deep(.edit-button) {
  margin-right: 8px;
  color: #ffffff !important;
  font-weight: normal;
  font-size: 13px;
  padding: 4px 12px;
  height: 24px;
  line-height: 16px;
  background-color: var(--primary-color) !important;
  border-radius: 4px;
  border: none;
}

:deep(.delete-button) {
  color: #ffffff !important;
  font-weight: normal;
  font-size: 13px;
  padding: 4px 12px;
  height: 24px;
  line-height: 16px;
  background-color: #f56c6c !important;
  border-radius: 4px;
  border: none;
}

:deep(.edit-button:hover) {
  opacity: 0.8;
}

:deep(.delete-button:hover) {
  opacity: 0.8;
}
</style> 