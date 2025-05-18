<template>
  <page-container title="物料管理">
    <template #actions>
      <el-input
        v-model="searchQuery"
        placeholder="搜索物料名称"
        clearable
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <!-- <el-select 
        v-model="categoryFilter" 
        placeholder="物料分类" 
        clearable 
        class="category-filter"
      >
        <el-option label="全部分类" :value="''"></el-option>
        <el-option 
          v-for="category in allCategoryOptions" 
          :key="category" 
          :label="category" 
          :value="category"
        ></el-option>
      </el-select> -->
      <el-button 
        type="info" 
        @click="handleEditCategories"
        v-if="canUpdate"
      >
        <el-icon><Edit /></el-icon>管理分类
      </el-button>
      <el-button 
        type="primary" 
        @click="handleAdd"
        v-if="canCreate"
      >
        <el-icon><Plus /></el-icon>新增物料
      </el-button>
      <el-button 
        type="danger" 
        @click="handleBatchDelete"
        :disabled="multipleSelection.length === 0"
        v-if="canDelete"
      >
        <el-icon><Delete /></el-icon>批量删除
      </el-button>
    </template>

    <el-table 
      :data="filteredMaterials" 
      v-loading="loading"
      stripe
      class="glass-table"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="name" label="物料名称" min-width="100" show-overflow-tooltip />
      <el-table-column prop="category" label="物料分类" min-width="120" align="center">
        <template #header>
          <el-select 
            v-model="categoryFilter" 
            placeholder="物料分类" 
            clearable 
            size="small"
            class="header-filter-select full-width"
            @change="handleFilter"
          >
            <el-option label="全部分类" :value="''"></el-option>
            <el-option 
              v-for="category in allCategoryOptions" 
              :key="category" 
              :label="category" 
              :value="category"
            ></el-option>
          </el-select>
        </template>
        <template #default="{ row }">
          <el-tag>{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="unit" label="单位" min-width="80" align="center" />
      <el-table-column label="预警阈值" min-width="100" align="center">
        <template #default="{ row }">
          {{ row.warning_threshold }} {{ row.unit }}
        </template>
      </el-table-column>
      <el-table-column prop="processed_name" label="加工后名称" min-width="100" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.processed_name || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="processed_unit" label="加工后单位" min-width="100" align="center">
        <template #default="{ row }">
          {{ row.processed_unit || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="加工后预警阈值" min-width="120" align="center">
        <template #default="{ row }">
          {{ row.processed_warning_threshold ? `${row.processed_warning_threshold} ${row.processed_unit || ''}` : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="换算比例" min-width="120" align="center">
        <template #default="{ row }">
          <template v-if="row.conversion_ratio">
            1 {{ row.unit }} = {{ row.conversion_ratio }} {{ row.processed_unit || '份' }}
          </template>
          <template v-else>-</template>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="120" align="center" fixed="right" v-if="canUpdate || canDelete">
        <template #default="{ row }">
          <el-button 
            link 
            type="primary" 
            @click="handleEdit(row)"
            v-if="canUpdate"
          >
            编辑
          </el-button>
          <el-button 
            link 
            type="danger" 
            @click="handleDelete(row)"
            v-if="canDelete"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增物料' : '编辑物料'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="form" :rules="activeFormRules" ref="formRef" label-width="130px">
        <el-form-item label="物料名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入物料名称" />
        </el-form-item>
        
        <el-form-item label="物料分类" prop="category">
          <div v-if="isAddingNewCategory">
            <el-input 
              v-model="newCategoryInput" 
              placeholder="请输入新分类名称"
              class="mb-2 full-width"
            />
            <div class="category-buttons">
              <el-button type="primary" @click="confirmNewCategory">确定</el-button>
              <el-button @click="cancelNewCategory">取消</el-button>
            </div>
          </div>
          <el-select v-else v-model="form.category" placeholder="请选择物料分类" class="full-width">
            <el-option
              v-for="category in allCategoryOptions"
              :key="category"
              :label="category"
              :value="category"
            ></el-option>
            <el-option
              key="add-new"
              label="+ 添加新分类"
              value="add-new"
            ></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        
        <el-form-item label="预警阈值" prop="warning_threshold">
          <el-input-number 
            v-model="form.warning_threshold"
            :precision="2"
            :step="0.1"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>

        <el-divider content-position="center">加工信息（必填）</el-divider>
        
        <el-form-item label="加工后名称" prop="processed_name">
          <el-input v-model="form.processed_name" placeholder="请输入加工后物料名称（与原物料名不同）" />
        </el-form-item>
        
        <el-form-item label="加工后单位" prop="processed_unit">
          <el-input v-model="form.processed_unit" placeholder="请输入加工后物料单位" />
        </el-form-item>
        
        <el-form-item label="加工后预警阈值" prop="processed_warning_threshold">
          <el-input-number 
            v-model="form.processed_warning_threshold"
            :precision="2"
            :step="0.1"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="换算比例" prop="conversion_ratio">
          <div class="conversion-ratio-container">
            <div class="conversion-ratio-text">1 {{ form.unit || '单位' }} =</div>
            <el-input-number 
              v-model="form.conversion_ratio"
              :precision="4"
              :step="0.1"
              :min="0"
              style="width: 100%"
            />
            <div class="conversion-ratio-text">{{ form.processed_unit || '份' }}</div>
          </div>
          <div class="form-item-tip">例：1斤牛肉 = 20串牛肉串，则换算比例为20</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 分类管理对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      title="物料分类管理"
      width="600px"
      destroy-on-close
    >
      <div class="category-management">
        <div class="category-list">
          <!-- <div class="category-list-header">
            <h3>已有分类</h3>
            <el-button type="primary" size="small" @click="handleAddCategory">
              <el-icon><Plus /></el-icon>添加新分类
            </el-button>
          </div> -->
          <el-table :data="categoryOptions" stripe border style="width: 100%">
            <el-table-column prop="" label="分类名称" min-width="180">
              <template #default="{ row }">
                {{ row }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleEditCategory(row)">
                  编辑
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="categoryDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 分类编辑对话框 -->
    <el-dialog
      v-model="categoryEditDialogVisible"
      :title="categoryForm.originalCategory ? '编辑分类' : '添加分类'"
      width="400px"
      @closed="handleCategoryDialogClosed"
      append-to-body
    >
      <el-form 
        :model="categoryForm" 
        :rules="categoryFormRules" 
        ref="categoryFormRef" 
        label-width="100px"
      >
        <el-form-item 
          :label="categoryForm.originalCategory ? '原分类名称' : ''" 
          v-if="categoryForm.originalCategory"
        >
          <el-input 
            v-model="categoryForm.originalCategory" 
            disabled
          />
        </el-form-item>
        
        <el-form-item 
          :label="categoryForm.originalCategory ? '新分类名称' : '分类名称'" 
          prop="newCategory"
        >
          <el-input 
            v-model="categoryForm.newCategory" 
            placeholder="请输入分类名称"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="categoryEditDialogVisible = false">
          取消
        </el-button>
        <el-button 
          type="primary" 
          @click="handleCategorySubmit" 
          :loading="submittingCategory"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 分页器 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </page-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, ElDivider } from 'element-plus'
import { Search, Plus, Delete, Edit } from '@element-plus/icons-vue'
import { useMaterialStore } from '@/stores/materials'
import type { Material } from '@/types'
import type { FormInstance } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { checkPermission } from '@/utils/permission'
import PageContainer from '@/components/PageContainer.vue'
import { getMaterialCategories, updateMaterialCategory, addMaterialCategory } from '@/api/materials'

// Store
const materialStore = useMaterialStore()
const userStore = useUserStore()

// 响应式数据
const searchQuery = ref('')
const categoryFilter = ref('')
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const submitting = ref(false)

// 添加新分类相关变量
const isAddingNewCategory = ref(false)
const newCategoryInput = ref('')

// 修改物料分类选项 - 使用响应式数组
const categoryOptions = ref<string[]>([])

// 从后端获取物料分类
const fetchCategories = async () => {
  try {
    const response = await getMaterialCategories()
    console.log('Categories response:', response)
    
    // 清空现有分类
    categoryOptions.value = []
    
    if (response && response.data) {
      // 处理响应数据
      if (Array.isArray(response.data)) {
        // 直接赋值数组，而不是追加
        categoryOptions.value = response.data.filter(category => category) 
      } else if (typeof response.data === 'object') {
        // 处理对象格式的响应
        const categories = Array.isArray(response.data.data) 
          ? response.data.data 
          : Object.values(response.data)
        
        categoryOptions.value = categories.filter((category: any) => 
          category && typeof category === 'string'
        )
      }
      
      // 不再强制添加"其他"分类
      // if (!categoryOptions.value.includes('其他')) {
      //   categoryOptions.value.push('其他')
      // }
    }
  } catch (error) {
    console.error('获取物料分类失败:', error)
    // 错误时使用最小默认分类集 - 不再默认添加分类
    categoryOptions.value = []
    ElMessage.warning('获取物料分类失败，请重试')
  }
}

// 添加分类编辑相关的响应式变量
const categoryDialogVisible = ref(false)
const categoryEditDialogVisible = ref(false)
const categoryForm = ref({
  originalCategory: '',
  newCategory: ''
})
const categoryFormRef = ref<FormInstance>()
const submittingCategory = ref(false)
const categoryFormRules = {
  newCategory: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { max: 20, message: '长度不能超过20个字符', trigger: 'blur' }
  ]
}

// 合并预设分类和自定义分类
const allCategoryOptions = computed(() => {
  return categoryOptions.value
})

const form = ref({
  id: undefined as number | undefined,
  name: '',
  unit: '',
  category: '',
  warning_threshold: 0,
  processed_name: '',
  processed_unit: '',
  processed_warning_threshold: 0,
  conversion_ratio: 0
})

// 监听物料分类选择变化
watch(() => form.value.category, (newVal) => {
  if (newVal === 'add-new') {
    // 用户选择了"添加新分类"选项
    isAddingNewCategory.value = true
    form.value.category = ''
  }
})

// 计算属性
const loading = computed(() => materialStore.loading)
const canCreate = computed(() => checkPermission(userStore.currentUser, 'material.create'))
const canUpdate = computed(() => checkPermission(userStore.currentUser, 'material.update'))
const canDelete = computed(() => checkPermission(userStore.currentUser, 'material.delete'))

const fetchData = async () => {
  try {
    await materialStore.fetchMaterials()
    // 更新分页总数
    pagination.value.total = materialStore.materials.length
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  }
}

const filteredMaterials = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  const category = categoryFilter.value
  
  // 根据搜索条件和分类过滤
  const allMaterials = materialStore.materials.filter(m => {
    const matchesQuery = !query || m.name.toLowerCase().includes(query)
    // 处理未选择分类或分类为空的情况
    const matchesCategory = !category || m.category === category
    return matchesQuery && matchesCategory
  })

  // 更新总数
  pagination.value.total = allMaterials.length

  // 计算分页
  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize

  return allMaterials.slice(start, end)
})

// 批量操作相关
const multipleSelection = ref<Material[]>([])

const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入物料名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择物料分类', trigger: 'change' }
  ],
  unit: [
    { required: true, message: '请输入单位', trigger: 'blur' },
    { min: 1, max: 10, message: '长度在 1 到 10 个字符', trigger: 'blur' }
  ],
  warning_threshold: [
    { required: true, message: '请输入预警阈值', trigger: 'blur' },
    { 
      validator: (rule: any, value: number) => {
        if (value < 0) {
          return Promise.reject('预警阈值不能小于0')
        }
        if (!/^\d+(\.\d{0,2})?$/.test(value.toString())) {
          return Promise.reject('最多支持两位小数')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  processed_name: [
    { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
  ],
  processed_unit: [
    { max: 10, message: '长度不能超过10个字符', trigger: 'blur' }
  ],
  processed_warning_threshold: [
    { 
      validator: (rule: any, value: number) => {
        if (!value && value !== 0) return Promise.resolve()
        if (value < 0) {
          return Promise.reject('预警阈值不能小于0')
        }
        if (!/^\d+(\.\d{0,2})?$/.test(value.toString())) {
          return Promise.reject('最多支持两位小数')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  conversion_ratio: [
    { 
      validator: (rule: any, value: number) => {
        if (!value && value !== 0) return Promise.resolve()
        if (value < 0) {
          return Promise.reject('换算比例不能小于0')
        }
        if (!/^\d+(\.\d{0,4})?$/.test(value.toString())) {
          return Promise.reject('最多支持四位小数')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ]
}

// 动态计算实际使用的表单验证规则，当添加新分类时临时移除category字段验证
const activeFormRules = computed(() => {
  if (isAddingNewCategory.value) {
    // 创建一个新的验证规则对象，不包含category字段
    const rules = { ...formRules };
    // 使用可选类型断言解决TypeScript错误
    const rulesCopy = rules as {[key: string]: any};
    delete rulesCopy.category;
    return rulesCopy;
  }
  return formRules;
})

// 方法
const handleAdd = () => {
  dialogType.value = 'add'
  form.value = {
    id: undefined,
    name: '',
    unit: '',
    category: '',
    warning_threshold: 0,
    processed_name: '',
    processed_unit: '',
    processed_warning_threshold: 0,
    conversion_ratio: 0
  }
  dialogVisible.value = true
}

const handleEdit = (row: Material) => {
  dialogType.value = 'edit'
  form.value = {
    id: row.id,
    name: row.name,
    unit: row.unit,
    category: row.category || '',
    warning_threshold: row.warning_threshold,
    processed_name: row.processed_name || '',
    processed_unit: row.processed_unit || '',
    processed_warning_threshold: row.processed_warning_threshold || 0,
    conversion_ratio: row.conversion_ratio || 0
  }
  dialogVisible.value = true
}

const handleDelete = (row: Material) => {
  ElMessageBox.confirm(
    `确定要删除物料"${row.name}"吗？删除后相关的库存记录也会被删除。`,
    '警告',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    try {
      await materialStore.deleteMaterialById(row.id)
      ElMessage.success('删除成功')
      await materialStore.fetchMaterials()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  // 如果正在添加新分类，先处理添加分类操作
  if (isAddingNewCategory.value) {
    const categoryAdded = await confirmNewCategory()
    
    // 如果分类添加失败，停止表单提交
    if (!categoryAdded || isAddingNewCategory.value || !form.value.category) {
      return
    }
  }
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (dialogType.value === 'add') {
          const { id, ...materialData } = form.value
          await materialStore.addMaterial(materialData)
          ElMessage.success('添加成功')
        } else {
          await materialStore.updateMaterialById(form.value.id!, form.value)
          ElMessage.success('修改成功')
        }
        dialogVisible.value = false
        await materialStore.fetchMaterials()
      } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('保存失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleSelectionChange = (selection: Material[]) => {
  multipleSelection.value = selection
}

const handleBatchDelete = () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请选择要删除的物料')
    return
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${multipleSelection.value.length} 个物料吗？删除后相关的库存记录也会被删除。`,
    '警告',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    try {
      await Promise.all(
        multipleSelection.value.map(item => materialStore.deleteMaterialById(item.id))
      )
      ElMessage.success('批量删除成功')
      await materialStore.fetchMaterials()
      multipleSelection.value = []
    } catch (error) {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  })
}

const handleSortChange = ({ prop, order }: { prop: string, order: string }) => {
  // 实现排序逻辑
}

const handlePageChange = (page: number) => {
  pagination.value.currentPage = page
  fetchData()
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  fetchData()
}

// 处理编辑分类对话框
const handleEditCategories = async () => {
  // 打开对话框前先重新获取最新分类列表
  await fetchCategories()
  categoryDialogVisible.value = true
}

// 处理添加新分类
const handleAddCategory = () => {
  categoryForm.value = {
    originalCategory: '',
    newCategory: ''
  }
  categoryEditDialogVisible.value = true
}

// 处理编辑现有分类
const handleEditCategory = (category: string) => {
  categoryForm.value = {
    originalCategory: category,
    newCategory: category
  }
  categoryEditDialogVisible.value = true
}

// 处理分类对话框关闭
const handleCategoryDialogClosed = () => {
  categoryForm.value = {
    originalCategory: '',
    newCategory: ''
  }
}

// 提交分类表单
const handleCategorySubmit = async () => {
  if (!categoryFormRef.value) return
  
  await categoryFormRef.value.validate(async (valid) => {
    if (valid) {
      submittingCategory.value = true
      try {
        const { originalCategory, newCategory } = categoryForm.value
        
        // 检查分类名称是否已存在
        if (!originalCategory && categoryOptions.value.includes(newCategory)) {
          ElMessage.warning(`分类 "${newCategory}" 已存在`)
          submittingCategory.value = false
          return
        }
        
        // 如果是编辑现有分类
        if (originalCategory) {
          // 不允许编辑为已存在的分类名
          if (originalCategory !== newCategory && categoryOptions.value.includes(newCategory)) {
            ElMessage.warning(`分类 "${newCategory}" 已存在`)
            submittingCategory.value = false
            return
          }
          
          // 向后端发送更新分类请求
          const response = await updateMaterialCategory(originalCategory, newCategory)
          
          if (response && response.data && response.data.message) {
            ElMessage.success(`分类修改成功，更新了${response.data.updated_count}个物料`)
          } else {
            ElMessage.success('分类修改成功')
          }
        } else {
          // 添加新分类
          const response = await addMaterialCategory(newCategory)
          
          if (response && response.data) {
            if (response.data.status === 'existed') {
              ElMessage.warning(`分类 "${newCategory}" 已存在`)
              submittingCategory.value = false
              return
            } else if (response.data.status === 'success') {
              ElMessage.success('分类添加成功')
              // 如果后端返回了新分类，直接添加到分类列表
              if (response.data.category && !categoryOptions.value.includes(response.data.category)) {
                // 添加新分类
                categoryOptions.value.push(response.data.category)
              }
            }
          }
        }
        
        // 刷新分类列表
        await fetchCategories() 
        
        // 关闭对话框
        categoryEditDialogVisible.value = false
        
        // 刷新物料列表
        await materialStore.fetchMaterials()
      } catch (error) {
        console.error('保存分类失败:', error)
        ElMessage.error('保存分类失败')
      } finally {
        submittingCategory.value = false
      }
    }
  })
}

// 处理添加新分类
const confirmNewCategory = async () => {
  if (!newCategoryInput.value.trim()) {
    ElMessage.warning('分类名称不能为空')
    return false
  }
  
  const categoryName = newCategoryInput.value.trim()
  
  // 检查分类是否已存在
  if (categoryOptions.value.includes(categoryName)) {
    ElMessage.warning(`分类 "${categoryName}" 已存在`)
    form.value.category = categoryName // 自动选中已存在的分类
    isAddingNewCategory.value = false
    return true
  }
  
  try {
    console.log(`尝试添加新分类: ${categoryName}`);
    
    // 添加新分类
    const response = await addMaterialCategory(categoryName);
    console.log('添加分类API响应:', response);
    
    // 检查简单的成功情况 - 即使后端格式不一致也能处理
    if (response) {
      // 添加到本地分类列表
      if (!categoryOptions.value.includes(categoryName)) {
        categoryOptions.value.push(categoryName);
        console.log('已添加到本地分类列表');
      }
      
      // 设置到表单中
      form.value.category = categoryName;
      console.log(`表单分类已设置为: ${categoryName}`);
      
      // 成功提示
      ElMessage.success('分类添加成功');
      
      // 关闭新分类输入界面
      isAddingNewCategory.value = false;
      newCategoryInput.value = '';
      
      // 确保下拉列表和管理界面列表都被刷新
      await fetchCategories();
      return true;
    } else {
      console.error('响应异常:', response);
      ElMessage.error('添加分类失败: 未收到服务器响应确认');
      return false;
    }
  } catch (error: any) {
    console.error('添加分类失败, 详细错误:', error);
    
    // 提供更详细的错误信息
    if (error.response) {
      console.error('错误响应状态:', error.response.status);
      console.error('错误响应数据:', error.response.data);
      ElMessage.error(`添加分类失败: 服务器错误 (${error.response.status})`);
    } else if (error.request) {
      console.error('未收到响应的请求:', error.request);
      ElMessage.error('添加分类失败: 服务器无响应，请检查网络连接');
    } else {
      console.error('错误详情:', error.message);
      ElMessage.error(`添加分类失败: ${error.message}`);
    }
    return false;
  }
}

// 取消添加新分类
const cancelNewCategory = () => {
  isAddingNewCategory.value = false
  newCategoryInput.value = ''
  form.value.category = ''
}

// 生命周期钩子
onMounted(async () => {
  try {
    // 首先获取分类列表
    await fetchCategories()
  } catch (error) {
    console.error('获取分类失败:', error)
  }
  
  try {
    // 获取物料列表
    await materialStore.fetchMaterials()
  } catch (error) {
    console.error('获取物料列表失败:', error)
    ElMessage.error('获取物料列表失败')
  }
})

// 处理表格列头筛选
const handleFilter = () => {
  // 重置分页到第一页
  pagination.value.currentPage = 1
}
</script>

<style scoped>
.search-input {
  width: 200px;
  margin-right: 10px;
}

.category-filter {
  width: 150px;
  margin-right: 10px;
}

.header-filter-select {
  width: 100%;
}

.full-width {
  width: 100%;
}

.mb-2 {
  margin-bottom: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.conversion-ratio-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.conversion-ratio-text {
  white-space: nowrap;
}

.form-item-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 分类管理样式 */
.category-management {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.ml-2 {
  margin-left: 8px;
}

/* 重新设计表格样式，采用扁平化设计 */
:deep(.glass-table) {
  background: #ffffff !important;
  width: 100% !important;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

:deep(.el-table) {
  width: 100% !important;
  margin: 0 !important;
}

:deep(.el-table__inner-wrapper) {
  width: 100% !important;
}

/* 确保表格内容区域填充满可用空间 */
:deep(.el-table__body) {
  width: 100% !important;
}

:deep(.el-table__header) {
  width: 100% !important;
}

/* 优化选择框样式 */
:deep(.el-table-column--selection .el-checkbox) {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  margin-right: 0;
}

/* 确保选择框在单元格中居中 */
:deep(.el-table-column--selection .cell) {
  padding: 0;
  display: flex;
  justify-content: center;
  height: 40px;
  align-items: center;
}

/* 增强选择框的可见度 */
:deep(.el-checkbox__inner) {
  border-width: 2px;
  width: 16px;
  height: 16px;
  background-color: white;
  border-color: #909399;
}

/* 选中状态的样式优化 */
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409EFF;
  border-color: #409EFF;
}

/* 鼠标悬停状态 */
:deep(.el-checkbox__inner:hover) {
  border-color: #409EFF;
}

.category-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
</style> 