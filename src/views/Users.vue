<template>
  <page-container title="用户管理">
    <template #actions>
      <el-button type="primary" @click="handleAdd" v-permission="'user.create'">
        <el-icon><Plus /></el-icon>新增用户
      </el-button>
    </template>

    <el-table 
      :data="userList" 
      v-loading="loading" 
      stripe
      class="glass-table"
    >
      <el-table-column 
        prop="id" 
        label="ID" 
        width="60"
      />
      <el-table-column 
        prop="username" 
        label="用户名" 
        min-width="120"
        show-overflow-tooltip 
      />
      <el-table-column 
        label="角色" 
        width="100"
      >
        <template #default="{ row }">
          <el-tag v-if="row.role === 'admin'" type="danger">管理员</el-tag>
          <el-tag v-else-if="row.role === 'store_manager'" type="success">门店经理</el-tag>
          <el-tag v-else-if="row.role === 'purchaser'" type="warning">采购员</el-tag>
        </template>
      </el-table-column>
      <el-table-column 
        prop="store_name" 
        label="所属门店" 
        width="150"
        show-overflow-tooltip 
      >
        <template #default="{ row }">
          {{ row.store_name || '-' }}
        </template>
      </el-table-column>
      <el-table-column 
        prop="created_at" 
        label="创建时间" 
        width="180"
      />
      <el-table-column 
        label="操作" 
        width="240" 
        fixed="right" 
        align="center" 
      >
        <template #default="{ row }">
          <el-button 
            type="primary" 
            size="small"
            @click="handleEdit(row)"
            class="edit-button"
            v-permission="'user.update'"
          >
            编辑
          </el-button>
          <el-button 
            type="success" 
            size="small"
            @click="handleResetPassword(row)"
            class="reset-button"
            v-permission="'user.update'"
          >
            重置密码
          </el-button>
          <el-button 
            type="danger" 
            size="small"
            @click="handleDelete(row)"
            class="delete-button"
            v-permission="'user.delete'"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增用户' : '编辑用户'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="门店经理" value="store_manager" />
            <el-option label="采购员" value="purchaser" />
          </el-select>
        </el-form-item>
        
        <el-form-item 
          label="所属门店" 
          prop="store_id" 
          v-if="form.role === 'store_manager'"
        >
          <el-select v-model="form.store_id" placeholder="请选择门店">
            <el-option
              v-for="store in storeList"
              :key="store.id"
              :label="store.name"
              :value="store.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item 
          label="密码" 
          prop="password" 
          v-if="dialogType === 'add'"
        >
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password 
          />
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
    
    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetDialogVisible"
      title="重置密码"
      width="500px"
    >
      <el-form
        ref="resetFormRef"
        :model="resetForm"
        :rules="resetRules"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="password">
          <el-input 
            v-model="resetForm.password" 
            type="password" 
            placeholder="请输入新密码" 
            show-password 
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="resetForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入新密码" 
            show-password 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleResetSubmit" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </page-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { User, Store } from '@/types'
import { getStoreList } from '@/api/stores'
import { getUserList, createUser, updateUser, deleteUser, resetPassword, type UpdateUserData } from '@/api/users'
import PageContainer from '@/components/PageContainer.vue'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const resetDialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const resetFormRef = ref<FormInstance>()
const userList = ref<User[]>([])
const storeList = ref<Store[]>([])
const currentId = ref<number | null>(null)

// 表单数据
const form = ref({
  username: '',
  role: 'store_manager' as 'admin' | 'store_manager' | 'purchaser',
  store_id: undefined as number | undefined,
  password: ''
})

// 重置密码表单
const resetForm = ref({
  password: '',
  confirmPassword: ''
})

// 验证重置密码表单的密码确认
const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== resetForm.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  store_id: [{ required: true, message: '请选择门店', trigger: 'change' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 重置密码表单验证规则
const resetRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 监听角色变化，如果不是门店经理则清空门店选择
watch(() => form.value.role, (newRole) => {
  if (newRole !== 'store_manager') {
    form.value.store_id = undefined
  }
})

// 获取用户列表和门店列表
const fetchData = async () => {
  loading.value = true
  try {
    const [userRes, storeRes] = await Promise.all([
      getUserList(),
      getStoreList()
    ])
    
    if (userRes && 'data' in userRes && Array.isArray(userRes.data)) {
      userList.value = userRes.data
    }
    
    if (storeRes && 'data' in storeRes && Array.isArray(storeRes.data)) {
      storeList.value = storeRes.data
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 新增用户
const handleAdd = () => {
  dialogType.value = 'add'
  currentId.value = null
  form.value = {
    username: '',
    role: 'store_manager',
    store_id: undefined,
    password: ''
  }
  dialogVisible.value = true
}

// 编辑用户
const handleEdit = (row: User) => {
  dialogType.value = 'edit'
  currentId.value = row.id
  form.value = {
    username: row.username,
    role: row.role,
    store_id: row.store_id,
    password: '' // 编辑时不修改密码
  }
  dialogVisible.value = true
}

// 删除用户
const handleDelete = (row: User) => {
  ElMessageBox.confirm(
    `确定要删除用户 "${row.username}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteUser(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      console.error('删除用户失败:', error)
      ElMessage.error('删除用户失败')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 重置密码
const handleResetPassword = (row: User) => {
  currentId.value = row.id
  resetForm.value = {
    password: '',
    confirmPassword: ''
  }
  resetDialogVisible.value = true
}

// 提交重置密码
const handleResetSubmit = async () => {
  if (!resetFormRef.value) return
  
  await resetFormRef.value.validate(async (valid) => {
    if (!valid || !currentId.value) return
    
    submitting.value = true
    try {
      await resetPassword(currentId.value, resetForm.value.password)
      ElMessage.success('密码重置成功')
      resetDialogVisible.value = false
    } catch (error) {
      console.error('密码重置失败:', error)
      ElMessage.error('密码重置失败')
    } finally {
      submitting.value = false
    }
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
        await createUser(form.value)
        ElMessage.success('新增用户成功')
      } else {
        if (currentId.value) {
          // 编辑时移除空密码
          const updateData = { ...form.value } as UpdateUserData
          if (!updateData.password) {
            delete updateData.password
          }
          await updateUser(currentId.value, updateData)
          ElMessage.success('编辑用户成功')
        }
      }
      dialogVisible.value = false
      fetchData()
    } catch (error) {
      console.error('操作失败:', error)
      ElMessage.error('操作失败')
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  fetchData()
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

/* 角色标签样式 */
:deep(.el-tag) {
  border: none;
  padding: 4px 8px;
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

:deep(.reset-button) {
  margin-right: 8px;
  color: #ffffff !important;
  font-weight: normal;
  font-size: 13px;
  padding: 4px 12px;
  height: 24px;
  line-height: 16px;
  background-color: #67c23a !important;
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

:deep(.edit-button:hover),
:deep(.reset-button:hover),
:deep(.delete-button:hover) {
  opacity: 0.8;
}
</style> 