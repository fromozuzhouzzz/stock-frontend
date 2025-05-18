<template>
  <page-container title="菜品管理">
    <template #actions>
      <el-button type="primary" @click="handleAdd" v-permission="'dish.create'">
        <el-icon><Plus /></el-icon>新增菜品
      </el-button>
    </template>

    <el-table
      v-loading="dishStore.loading"
      :data="dishStore.dishes"
      border
      style="width: 100%"
    >
      <template #empty>
        <el-empty :description="dishStore.loading ? '加载中...' : '暂无数据'" />
      </template>
      <el-table-column prop="name" label="菜品名称" min-width="120" />
      <el-table-column prop="category" label="分类" width="120" align="center" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180" align="center">
        <template #default="{ row }">
          {{ new Date(row.created_at).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="handleRecipe(row)"
            v-permission="'dish.recipe'"
          >
            配方
          </el-button>
          <el-button
            link
            type="primary"
            @click="handleEdit(row)"
            v-permission="'dish.update'"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(row)"
            v-permission="'dish.delete'"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="dishStore.currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="dishStore.total"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>

    <el-dialog
      :title="form.id ? '编辑菜品' : '新增菜品'"
      v-model="dialogVisible"
      width="500px"
    >
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="form.status"
            :active-value="'active'"
            :inactive-value="'inactive'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </page-container>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useDishStore } from '@/stores/dish'
import type { Dish } from '@/types'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'

const router = useRouter()
const dishStore = useDishStore()

const dialogVisible = ref(false)
const form = ref<Partial<Dish>>({
  name: '',
  category: '',
  status: 'active'
})

const formRef = ref<FormInstance>()
const formRules = {
  name: [
    { required: true, message: '请输入菜品名称', trigger: 'blur' }
  ]
}

const pageSize = ref(10)

const handleAdd = () => {
  form.value = {
    name: '',
    category: '',
    status: 'active'
  }
  dialogVisible.value = true
  // 等待 DOM 更新后重置表单
  nextTick(() => {
    formRef.value?.resetFields()
  })
}

const handleEdit = (row: Dish) => {
  form.value = { ...row }
  dialogVisible.value = true
}

const handleRecipe = (row: Dish) => {
  router.push(`/dishes/${row.id}/recipe`)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (form.value.id) {
      // 更新菜品
      const success = await dishStore.updateDish(form.value.id, form.value)
      if (success) {
        dialogVisible.value = false
        ElMessage.success('修改成功')
      }
    } else {
      // 新增菜品
      const success = await dishStore.createDish(form.value)
      if (success) {
        dialogVisible.value = false
        ElMessage.success('添加成功')
      }
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  dishStore.fetchDishes(1, size) // 传递新的页面大小
}

const handlePageChange = (page: number) => {
  dishStore.fetchDishes(page, pageSize.value) // 传递当前页面大小
}

const handleDelete = async (row: Dish) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除菜品"${row.name}"吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const success = await dishStore.deleteDish(row.id)
    if (success) {
      ElMessage.success('删除成功')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 添加监听器，仅在开发环境下输出日志
watch(() => dishStore.dishes, (newDishes) => {
  if (import.meta.env.DEV) {
    console.log('Dishes changed:', newDishes)
  }
}, { deep: true })

// 确保组件挂载时加载数据
onMounted(() => {
  pageSize.value = dishStore.pageSize // 从store同步页面大小
  dishStore.fetchDishes(1, pageSize.value)
})
</script>

<style scoped>
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}

:deep(.el-pagination) {
  justify-content: flex-end;
  margin-right: 20px;
}

:deep(.el-pagination .el-select .el-input) {
  width: 110px;
}
</style> 