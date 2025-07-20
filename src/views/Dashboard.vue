<template>
  <page-container title="仪表盘">
    <el-row :gutter="20" class="mb-4">
      <el-col :span="16">
        <el-card shadow="hover" class="detail-card">
          <template #header>
            <div class="card-header">
              <span>库存预警</span>
              <div>
                <el-button type="success" @click="exportWarningItems" :disabled="warningItems.length === 0">导出</el-button>
                <el-button type="text" @click="refreshData">刷新</el-button>
              </div>
            </div>
          </template>
          <el-table 
            :data="warningItems" 
            stripe 
            class="glass-table"
            v-loading="loading"
          >
            <el-table-column 
              prop="material_name" 
              label="物料名称" 
              min-width="140"
              show-overflow-tooltip
            />
            <el-table-column 
              prop="store_name" 
              label="所属门店" 
              min-width="120"
              show-overflow-tooltip
            />
            <el-table-column
              prop="quantity"
              label="当前库存"
              width="140"
              align="right"
            >
              <template #default="{ row }">
                <div>
                  <span :class="{ 'warning-text': row.quantity < row.warning_threshold }">
                    总计: {{ row.quantity }} {{ row.unit }}
                  </span>
                  <!-- 如果有加工前后的详细信息，显示分解 -->
                  <div v-if="row.has_processed && (row.raw_quantity > 0 || row.processed_quantity > 0)"
                       class="text-xs text-gray-500 mt-1">
                    <div v-if="row.raw_quantity > 0">
                      原料: {{ row.raw_quantity }} {{ row.unit }}
                    </div>
                    <div v-if="row.processed_quantity > 0">
                      {{ row.processed_name || '加工品' }}: {{ row.processed_quantity }} {{ row.processed_unit || row.unit }}
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column 
              prop="warning_threshold" 
              label="预警阈值" 
              width="100"
              align="right"
            >
              <template #default="{ row }">
                {{ row.warning_threshold }} {{ row.unit }}
              </template>
            </el-table-column>
            <el-table-column 
              label="状态" 
              width="110" 
              align="center"
            >
              <template #default="{ row }">
                <el-tag type="danger" effect="light" v-if="row.quantity < row.warning_threshold">
                  库存不足
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card stats-summary-card">
          <!-- <template #header>
            <div class="card-header">
              <span>库存数据汇总</span>
            </div>
          </template> -->
          <el-table :data="summaryData" class="glass-table summary-table">
            <el-table-column prop="name" label="指标" align="center" width="120" />
            <el-table-column prop="value" label="数值" align="center">
              <template #default="{ row }">
                <span class="stat-value" :class="{ 'warning-value': row.isWarning }">
                  {{ row.value }} {{ row.unit }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover" class="detail-card">
          <template #header>
            <div class="card-header">
              <span>菜品销售统计</span>
              <el-button type="text" @click="fetchSalesStats">刷新</el-button>
            </div>
          </template>
          
          <el-tabs v-model="salesPeriod" @tab-change="handlePeriodChange" class="sales-tabs">
            <el-tab-pane label="按天统计" name="day"></el-tab-pane>
            <el-tab-pane label="按周统计" name="week"></el-tab-pane>
            <el-tab-pane label="按月统计" name="month"></el-tab-pane>
          </el-tabs>
          
          <el-table 
            :data="filteredSalesStats" 
            stripe 
            class="glass-table"
            v-loading="salesLoading"
            :empty-text="salesStats.length === 0 ? '暂无销售数据' : '加载中...'"
          >
            <el-table-column 
              prop="dish_name" 
              label="菜品名称" 
              min-width="100"
              show-overflow-tooltip
            >
              <!-- 自定义表头，添加菜品筛选下拉框 -->
              <template #header>
                <el-select 
                  v-model="dishFilter" 
                  placeholder="菜品名称" 
                  clearable
                  size="small"
                  class="header-filter-select full-width"
                  @change="handleDishFilter"
                >
                  <el-option
                    label="所有菜品"
                    :value="undefined"
                  />
                  <el-option
                    v-for="dish in uniqueDishes"
                    :key="dish.value"
                    :label="dish.text"
                    :value="dish.value"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column 
              prop="store_name" 
              label="所属门店" 
              min-width="100"
              show-overflow-tooltip
            >
              <!-- 自定义表头，添加门店筛选下拉框 -->
              <template #header>
                <el-select 
                  v-model="storeFilter" 
                  placeholder="所属门店" 
                  clearable
                  size="small"
                  class="header-filter-select full-width"
                  @change="handleStoreFilter"
                >
                  <el-option
                    label="所有门店"
                    :value="undefined"
                  />
                  <el-option
                    v-for="store in uniqueStores"
                    :key="store.value"
                    :label="store.text"
                    :value="store.value"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column 
              prop="total_quantity" 
              label="销售数量" 
              width="140"
              sortable
              align="center"
            >
              <template #default="{ row }">
                {{ row.total_quantity }} 份
              </template>
            </el-table-column>
            <el-table-column 
              v-if="salesPeriod === 'week'" 
              label="周环比" 
              width="120"
              align="center"
            >
              <template #default="{ row }">
                <el-tag :type="row.week_growth > 0 ? 'success' : 'danger'" effect="light">
                  {{ row.week_growth > 0 ? '+' : '' }}{{ row.week_growth }}%
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column 
              v-if="salesPeriod === 'month'" 
              label="月环比" 
              width="120"
              align="center"
            >
              <template #default="{ row }">
                <el-tag :type="row.month_growth > 0 ? 'success' : 'danger'" effect="light">
                  {{ row.month_growth > 0 ? '+' : '' }}{{ row.month_growth }}%
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </page-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getInventoryStats } from '@/api/inventory'
import { getSalesStats } from '@/api/sales'
import { getStoreList } from '@/api/stores'
import type { InventoryStats, WarningItem, Store } from '@/types'
import PageContainer from '@/components/PageContainer.vue'

// 库存统计数据
const loading = ref(false)
const stats = ref({
  totalMaterials: 0,
  warningCount: 0,
  totalQuantity: 0
})
const warningItems = ref<WarningItem[]>([])

// 汇总数据表格
const summaryData = computed(() => [
  { 
    name: '物料总数', 
    value: stats.value.totalMaterials, 
    unit: '种',
    isWarning: false 
  },
  { 
    name: '预警物料', 
    value: stats.value.warningCount, 
    unit: '种',
    isWarning: stats.value.warningCount > 0 
  },
  { 
    name: '库存总量', 
    value: stats.value.totalQuantity, 
    unit: '件', 
    isWarning: false 
  }
])

// 销售统计数据
const salesLoading = ref(false)
const salesStats = ref<any[]>([])
const salesPeriod = ref<'day' | 'week' | 'month'>('day')
const storeList = ref<Store[]>([])
const mainStoreId = ref<number | null>(null) // 总库房ID
const storeFilter = ref<string | undefined>(undefined)
const dishFilter = ref<string | undefined>(undefined)

// 获取菜品筛选选项
const getDishFilters = computed(() => {
  const dishes = new Set(salesStats.value.map(item => item.dish_name))
  return Array.from(dishes).map(dish => ({
    text: dish,
    value: dish
  }))
})

// 获取门店筛选选项
const getStoreFilters = computed(() => {
  const stores = new Set(salesStats.value.map(item => item.store_name))
  return Array.from(stores).map(store => ({
    text: store,
    value: store
  }))
})

// 菜品名称筛选方法
const filterDishName = (value: string, row: any) => {
  return row.dish_name === value
}

// 门店名称筛选方法
const filterStoreName = (value: string, row: any) => {
  return row.store_name === value
}

// 处理标签页切换
function handlePeriodChange(tab: string) {
  fetchSalesStats()
}

async function refreshData() {
  loading.value = true
  try {
    console.log('开始获取库存统计数据')
    const response = await getInventoryStats()
    console.log('API响应:', response)
    
    if (!response) {
      throw new Error('API响应为空')
    }
    
    const data = response as unknown as InventoryStats
    
    stats.value = {
      totalMaterials: data.total_materials || 0,
      warningCount: data.warning_count || 0,
      totalQuantity: data.total_quantity || 0
    }
    warningItems.value = data.warning_items || []
    console.log('统计数据更新成功:', stats.value)
    console.log('预警物料:', warningItems.value)
  } catch (error: any) {
    console.error('获取统计数据失败，详细错误:', error)
    if (error.response) {
      console.error('错误响应数据:', error.response.data)
      console.error('错误状态码:', error.response.status)
    } else if (error.request) {
      console.error('未收到响应，请求详情:', error.request)
    }
    ElMessage.error(`获取统计数据失败: ${error.message || '未知错误'}`)
  } finally {
    loading.value = false
  }
}

// 获取销售统计数据
async function fetchSalesStats() {
  salesLoading.value = true
  try {
    console.log('开始获取销售统计数据...')
    
    const response = await getSalesStats({
      period: salesPeriod.value,
      exclude_main_store: true // 排除总库房
    })
    
    console.log('销售统计原始响应:', response)
    
    // 检查响应格式
    if (!response) {
      throw new Error('服务器返回空响应')
    }
    
    // 检查是否是错误响应
    if (typeof response === 'object' && 'message' in response && !Array.isArray(response)) {
      throw new Error(response.message as string)
    }
    
    // 确保响应是数组
    if (!Array.isArray(response) && response.data && Array.isArray(response.data)) {
      salesStats.value = response.data.sort((a, b) => b.total_quantity - a.total_quantity)
    } else if (Array.isArray(response)) {
      // 按销售数量从大到小排序
      salesStats.value = response.sort((a, b) => b.total_quantity - a.total_quantity)
    } else {
      throw new Error('服务器返回数据格式异常')
    }
    
    console.log('销售统计数据加载成功:', salesStats.value)
  } catch (error: any) {
    console.error('获取销售统计数据失败:', error)
    if (error.response) {
      console.error('错误响应数据:', error.response.data)
      console.error('错误状态码:', error.response.status)
    }
    ElMessage.error(`获取销售统计失败: ${error.message || '未知错误'}`)
    salesStats.value = []
  } finally {
    salesLoading.value = false
  }
}

// 获取门店列表，找出总库房
async function fetchStores() {
  try {
    const response = await getStoreList()
    if (response && 'data' in response && Array.isArray(response.data)) {
      storeList.value = response.data
      // 假设名为"总库房"的门店是ID最小的那个
      const mainStore = storeList.value.find(store => store.name.includes('总库房'))
      if (mainStore) {
        mainStoreId.value = mainStore.id
      }
    }
  } catch (error) {
    console.error('获取门店列表失败:', error)
  }
}

// 门店筛选
const filteredSalesStats = computed(() => {
  let result = [...salesStats.value]
  
  // 应用门店筛选
  if (storeFilter.value) {
    result = result.filter(item => item.store_name === storeFilter.value)
  }
  
  // 应用菜品筛选
  if (dishFilter.value) {
    result = result.filter(item => item.dish_name === dishFilter.value)
  }
  
  return result
})

// 获取唯一门店列表
const uniqueStores = computed(() => {
  const stores = new Set(salesStats.value.map(item => item.store_name))
  return Array.from(stores).map(store => ({
    text: store,
    value: store
  }))
})

// 处理门店筛选
function handleStoreFilter() {
  // 这里不需要额外处理，因为我们使用计算属性filteredSalesStats
}

// 获取唯一菜品列表
const uniqueDishes = computed(() => {
  const dishes = new Set(salesStats.value.map(item => item.dish_name))
  return Array.from(dishes).map(dish => ({
    text: dish,
    value: dish
  }))
})

// 处理菜品筛选
function handleDishFilter() {
  // 这里不需要额外处理，因为我们使用计算属性filteredSalesStats
}

// 导出预警物料数据为CSV
function exportWarningItems() {
  if (warningItems.value.length === 0) {
    ElMessage.warning('没有预警物料数据可导出')
    return
  }

  try {
    // 准备CSV标题行
    const headers = ['物料名称', '所属门店', '当前库存', '预警阈值', '状态']
    
    // 准备CSV数据行
    const rows = warningItems.value.map(item => [
      item.material_name,
      item.store_name,
      `${item.quantity} ${item.unit}`,
      `${item.warning_threshold} ${item.unit}`,
      item.quantity < item.warning_threshold ? '库存不足' : ''
    ])
    
    // 合并标题和数据行
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    // 创建Blob对象
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
    
    // 创建下载链接
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    
    // 设置文件名，使用当前日期
    const date = new Date()
    const fileName = `库存预警_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}.csv`
    link.download = fileName
    
    // 触发下载
    link.click()
    URL.revokeObjectURL(link.href)
    
    ElMessage.success('导出成功')
  } catch (error: any) {
    console.error('导出预警物料数据失败:', error)
    ElMessage.error(`导出失败: ${error.message || '未知错误'}`)
  }
}

onMounted(() => {
  refreshData()
  fetchStores()
  fetchSalesStats()
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 24px;
}

.stat-value {
  font-weight: 600;
  color: #409EFF;
}

.warning-value {
  color: #F56C6C;
}

.warning-text {
  color: #F56C6C;
  font-weight: 500;
}

.filter-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.sales-tabs {
  margin-bottom: 15px;
}

:deep(.el-tabs__header) {
  margin-bottom: 15px;
}

:deep(.stat-card) {
  background: rgba(255, 255, 255, 0.8);
  border: none;
  transition: all 0.3s;
  height: 100%;
}

.stats-summary-card {
  height: 100%;
}

.summary-table :deep(td) {
  padding: 12px;
  font-size: 14px;
}

:deep(.stat-card:hover) {
  transform: translateY(-2px);
}

:deep(.detail-card) {
  background: rgba(255, 255, 255, 0.8);
  border: none;
}

:deep(.card-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.statistic) {
  text-align: center;
  padding: 20px 0;
}

.header-filter-select {
  width: 100%;
}

.full-width {
  width: 100%;
}

:deep(.el-select .el-input__wrapper) {
  padding: 0 6px;
}

:deep(.el-table .cell) {
  padding: 0 6px;
}
</style> 