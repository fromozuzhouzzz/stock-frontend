<template>
  <page-container title="销售管理">
    <template #actions>
      <el-button 
        type="primary" 
        @click="handleAdd" 
        :loading="submitting"
        v-permission="'sales.create'"
      >
        <el-icon><Plus /></el-icon>添加记录
      </el-button>
      <el-button 
        type="success"
        @click="handleImportData"
        :loading="importing"
        v-permission="'sales.create'"
      >
        <el-icon><Upload /></el-icon>导入销售数据
      </el-button>
      <el-button 
        @click="handleExport" 
        :loading="loading"
        v-permission="'sales.export'"
      >
        <el-icon><Download /></el-icon>导出
      </el-button>
      <el-button 
        v-if="hasActiveFilters" 
        @click="resetFilter" 
        type="info" 
        plain
        size="small"
      >
        <el-icon><RefreshRight /></el-icon>重置筛选
      </el-button>
    </template>

    <el-card shadow="hover" class="content-card">
      <el-table 
        v-loading="loading"
        :data="paginatedSalesList" 
        stripe
        class="glass-table"
        @sort-change="handleSort"
      >
        <el-table-column 
          prop="store_name" 
          label="门店" 
          width="120"
          show-overflow-tooltip 
        >
          <!-- 门店筛选器 -->
          <template #header>
            <el-select 
              v-model="filters.store_id" 
              placeholder="门店" 
              clearable
              size="small"
              class="header-filter-select full-width"
              @change="handleFilter"
            >
              <el-option
                label="所有门店"
                :value="undefined"
              />
              <el-option
                v-for="item in storeList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column 
          prop="dish_name" 
          label="菜品" 
          width="140"
          show-overflow-tooltip
        >
          <template #header>
            <el-select 
              v-model="filters.dish_id" 
              placeholder="选择菜品" 
              clearable
              size="small"
              class="header-filter-select full-width"
              @change="handleFilter"
            >
              <el-option
                label="所有菜品"
                :value="undefined"
              />
              <el-option
                v-for="item in dishList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column 
          label="销售数量" 
          width="110" 
          sortable
          :sort-method="sortByQuantity"
          align="center"
        >
          <template #default="{ row }">
            {{ row.quantity }} {{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column 
          prop="sale_date" 
          label="销售日期" 
          width="110" 
          sortable
          align="center"
        />
        <el-table-column 
          prop="created_at" 
          label="记录时间" 
          width="150" 
          sortable
          align="center"
        />
        <el-table-column 
          label="操作" 
          width="120" 
          fixed="right" 
          align="center"
        >
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link
              @click="handleEdit(row)"
              v-permission="'sales.create'"
            >
              编辑
            </el-button>
            <el-button 
              type="danger" 
              link
              @click="handleDelete(row)"
              v-permission="'sales.create'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页器 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredSalesList.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加记录对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formTitle"
      width="500px"
      destroy-on-close
    >
      <el-form 
        ref="formRef"
        :model="form" 
        :rules="rules" 
        label-width="100px"
      >
        <el-form-item label="门店" prop="store_id">
          <el-select 
            v-model="form.store_id" 
            placeholder="请选择门店"
            style="width: 100%"
          >
            <el-option
              v-for="item in storeList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="菜品" prop="dish_id">
          <el-select 
            v-model="form.dish_id" 
            placeholder="请选择菜品"
            style="width: 100%"
          >
            <el-option
              v-for="item in dishList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="销售数量" prop="quantity">
          <el-input-number
            v-model="form.quantity"
            :min="0"
            :max="9999"
            controls-position="right"
          />
        </el-form-item>
        
        <el-form-item label="销售日期" prop="sale_date">
          <el-date-picker
            v-model="form.sale_date"
            type="date"
            placeholder="选择销售日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleSubmit"
          :loading="submitting"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 导入销售数据对话框 -->
    <sales-import-dialog 
      v-model="importDialogVisible"
      :store-list="storeList"
      @import-success="handleImportSuccess"
    />
  </page-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { useSalesStore } from '@/stores/sales'
import { getDishList } from '@/api/dishes'
import { getStoreList } from '@/api/stores'
import { exportSales } from '@/api/sales'
import type { SalesRecord, Dish, Store, SalesRecordForm } from '@/types'
import { salesValidators } from '@/utils/validators'
import PageContainer from '@/components/PageContainer.vue'
import { Plus, Download, RefreshRight, Upload } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import SalesImportDialog from '@/components/SalesImportDialog.vue'

const salesStore = useSalesStore()
const loading = ref(false)
const submitting = ref(false)
const importing = ref(false)
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const formRef = ref<FormInstance>()

const dishList = ref<Dish[]>([])
const storeList = ref<Store[]>([])

// 添加筛选状态变量
const filters = ref({
  store_id: undefined as number | undefined,
  dish_id: undefined as number | undefined
})

// 计算是否有活跃的筛选条件
const hasActiveFilters = computed(() => {
  return filters.value.store_id !== undefined || filters.value.dish_id !== undefined
})

const form = reactive<SalesRecordForm>({
  dish_id: undefined,
  store_id: undefined,
  sale_date: new Date(),
  quantity: 1,
  material_id: 1 // 默认值
})

// 添加分页相关的响应式变量
const currentPage = ref(1)
const pageSize = ref(10)

// 添加销售记录对话框
const formTitle = ref('添加销售记录')
const dialogLoading = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)

const openDialog = (mode: 'add' | 'edit' = 'add', record?: SalesRecord) => {
  if (mode === 'edit' && record) {
    // 编辑模式
    formTitle.value = '编辑销售记录'
    isEditMode.value = true
    editingId.value = record.id
    
    // 填充表单数据
    form.dish_id = record.dish_id
    form.store_id = record.store_id
    form.sale_date = new Date(record.sale_date)
    form.quantity = record.quantity
    form.material_id = 1 // 保持默认值
  } else {
    // 添加模式
    formTitle.value = '添加销售记录'
    isEditMode.value = false
    editingId.value = null
    
    // 重置表单
    form.dish_id = undefined
    form.store_id = undefined
    form.sale_date = new Date()
    form.quantity = 1
    form.material_id = 1
  }
  
  dialogVisible.value = true
}

// 修改 API 响应类型的处理
const loadDishes = async (): Promise<void> => {
  try {
    const response = await getDishList()
    if (response && 'data' in response && Array.isArray(response.data)) {
      dishList.value = response.data
    }
  } catch (error) {
    console.error('获取菜品列表失败:', error)
    throw error
  }
}

const loadStores = async (): Promise<void> => {
  try {
    const response = await getStoreList()
    if (response && 'data' in response && Array.isArray(response.data)) {
      storeList.value = response.data
    }
  } catch (error) {
    console.error('获取门店列表失败:', error)
    throw error
  }
}

// 表单验证规则
const rules = {
  store_id: [
    { required: true, message: '请选择门店', trigger: 'change' }
  ],
  dish_id: [
    { required: true, message: '请选择菜品', trigger: 'change' }
  ],
  quantity: [
    { required: true, message: '请输入销售数量', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '销售数量必须大于0', trigger: 'blur' }
  ],
  sale_date: [
    { required: true, message: '请选择销售日期', trigger: 'change' }
  ]
}

const salesList = computed(() => salesStore.salesList)

// 添加过滤后的销售记录列表计算属性
const filteredSalesList = computed(() => {
  let result = sortedSalesList.value || []
  
  // 应用店铺筛选
  if (filters.value.store_id) {
    result = result.filter(item => item.store_id === filters.value.store_id)
  }
  
  // 应用菜品筛选
  if (filters.value.dish_id) {
    result = result.filter(item => item.dish_id === filters.value.dish_id)
  }
  
  return result
})

// 修改Sales.vue中的过滤和排序逻辑，确保与后端API字段名匹配
const sortOptions = ref({
  prop: 'created_at' as keyof SalesRecord,
  order: 'descending'
})

// 根据排序选项对销售列表进行排序
const sortedSalesList = computed(() => {
  const { prop, order } = sortOptions.value
  if (!prop || !salesList.value.length) return salesList.value

  return [...salesList.value].sort((a, b) => {
    let aValue: any, bValue: any
    
    // 日期类型的排序
    if (prop === 'sale_date' || prop === 'created_at') {
      aValue = new Date(a[prop]).getTime()
      bValue = new Date(b[prop]).getTime()
    } 
    // 数值类型的排序
    else if (prop === 'quantity') {
      aValue = a.quantity
      bValue = b.quantity
    } 
    // 其他类型的排序
    else {
      aValue = a[prop as keyof SalesRecord]
      bValue = b[prop as keyof SalesRecord]
    }
    
    // 升序或降序
    return order === 'ascending' 
      ? (aValue > bValue ? 1 : -1) 
      : (aValue < bValue ? 1 : -1)
  })
})

// 添加排序方法
const sortByQuantity = (a: SalesRecord, b: SalesRecord) => {
  return a.quantity - b.quantity
}

// 获取数据
const fetchData = async (): Promise<void> => {
  loading.value = true
  try {
    await Promise.all([
      salesStore.fetchSales(),
      loadDishes(),
      loadStores()
    ])
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 添加筛选处理函数
const handleFilter = () => {
  console.log('筛选条件已更新:', filters.value)
}

// 添加重置筛选函数
const resetFilter = () => {
  filters.value = {
    dish_id: undefined,
    store_id: undefined
  }
}

const handleAdd = (): void => {
  openDialog('add')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        let success: boolean
        
        if (isEditMode.value && editingId.value !== null) {
          // 编辑模式
          success = await salesStore.updateSales(editingId.value, { ...form })
        } else {
          // 添加模式
          success = await salesStore.addSalesRecord({ ...form })
        }
        
        if (success) {
          dialogVisible.value = false
          // 重置表单
          form.dish_id = undefined
          form.store_id = undefined
          form.sale_date = new Date()
          form.quantity = 1
        }
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleExport = async () => {
  try {
    loading.value = true
    const response = await exportSales()
    
    // 创建下载链接
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const filename = `sales_${new Date().toISOString().split('T')[0]}.xlsx`
    
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }, 100)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 处理编辑按钮点击
const handleEdit = (row: SalesRecord) => {
  openDialog('edit', row)
}

// 处理删除按钮点击
const handleDelete = (row: SalesRecord) => {
  ElMessageBox.confirm(
    `确定要删除"${row.dish_name}"的销售记录吗？`, 
    '删除确认', 
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const success = await salesStore.deleteSales(row.id)
      if (success) {
        ElMessage({
          type: 'success',
          message: '删除成功'
        })
      }
    } catch (error) {
      console.error('Error deleting sales record:', error)
    }
  }).catch(() => {
    // 用户取消删除操作
    ElMessage({
      type: 'info',
      message: '已取消删除'
    })
  })
}

// 修改排序方法
const handleSort = (sort: { prop: string; order: string | null }) => {
  if (sort.order === null) {
    // 重置为默认排序
    sortOptions.value = {
      prop: 'created_at' as keyof SalesRecord,
      order: 'descending'
    }
  } else {
    sortOptions.value = {
      prop: sort.prop as keyof SalesRecord,
      order: sort.order
    }
  }
  // 排序后回到第一页
  currentPage.value = 1
}

// 导入销售数据相关方法
const handleImportData = () => {
  importDialogVisible.value = true
}

const handleImportSuccess = (importedCount: number) => {
  // 重新加载销售记录数据
  fetchData()
  ElMessage.success(`成功导入${importedCount}条销售记录`)
}

// 修改 total 的计算方式，直接从过滤后的列表长度计算
const total = computed(() => filteredSalesList.value.length)

// 添加分页后的销售记录列表计算属性
const paginatedSalesList = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredSalesList.value.slice(startIndex, endIndex)
})

// 添加分页事件处理函数
const handleSizeChange = (size: number) => {
  pageSize.value = size
  // 当页面大小变化时，回到第一页
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 添加 watch 监听筛选条件变化，重置到第一页
watch([filters], () => {
  currentPage.value = 1
}, { deep: true })

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.content-card {
  background: rgba(255, 255, 255, 0.8);
  border: none;
  height: 100%;
  width: 100%;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-card__body) {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 100%;
}

:deep(.glass-table) {
  flex: 1;
  width: 100% !important;
}

:deep(.el-table__inner-wrapper),
:deep(.el-table__body),
:deep(.el-table__header) {
  width: 100% !important;
}

:deep(.el-table__header-wrapper),
:deep(.el-table__body-wrapper) {
  width: 100% !important;
}

/* 表头筛选样式 */
.header-filter-select {
  width: 130px;
  margin-top: 4px;
}

.header-filter-select.full-width {
  width: 100%;
  margin: 0;
  padding: 0px;
}

/* 重设表格表头样式，适配筛选下拉框 */
:deep(.el-table th.el-table__cell) {
  padding: 6px 0;
  background: #f5f7fa;
}

:deep(.el-table th .cell) {
  padding: 0;
}

/* 下拉框样式优化 */
:deep(.header-filter-select .el-input__wrapper) {
  box-shadow: none;
  border-radius: 0;
  background-color: transparent;
  padding: 0 8px;
}

:deep(.header-filter-select .el-input__inner) {
  height: 36px;
  line-height: 36px;
  font-size: 13px;
  color: #333;
  font-weight: 600;
}

:deep(.header-filter-select .el-select__icon) {
  line-height: 36px;
}

/* 解决排序图标重叠问题 */
:deep(.el-table .caret-wrapper) {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  height: 14px;
  width: 24px;
  vertical-align: middle;
  cursor: pointer;
  overflow: initial;
  position: relative;
}

:deep(.el-table .sort-caret) {
  width: 0;
  height: 0;
  border: 5px solid transparent;
  position: absolute;
  left: 7px;
  display: none; /* 默认隐藏所有排序图标 */
}

:deep(.el-table .sort-caret.ascending) {
  border-bottom-color: #c0c4cc;
  top: 0px;
}

:deep(.el-table .sort-caret.descending) {
  border-top-color: #c0c4cc;
  bottom: 0px;
}

/* 仅在升序状态显示上三角 */
:deep(.el-table .ascending .sort-caret.ascending) {
  border-bottom-color: var(--primary-color);
  display: block;
}

/* 仅在降序状态显示下三角 */
:deep(.el-table .descending .sort-caret.descending) {
  border-top-color: var(--primary-color);
  display: block;
}

/* 鼠标悬停时显示未激活的三角形 */
:deep(.el-table th:hover .sort-caret.ascending:not(.el-table .ascending .sort-caret.ascending)) {
  display: block;
  border-bottom-color: #c0c4cc;
}

:deep(.el-table th:hover .sort-caret.descending:not(.el-table .descending .sort-caret.descending)) {
  display: block;
  border-top-color: #c0c4cc;
}

/* 修复排序相关样式 */
:deep(.el-table .el-table__column-filter-trigger) {
  margin-left: 5px;
}
</style> 