<template>
  <page-container title="库存管理">
    <template #actions>
      <el-button type="primary" @click="handleAdd" v-permission="'inventory.create'">
        <el-icon><Plus /></el-icon>入库
      </el-button>
      <el-button type="success" @click="handleTransfer" v-permission="'inventory.update'">
        <el-icon><Right /></el-icon>出库/调拨
      </el-button>
      <el-button @click="handleExport" v-permission="'inventory.export'">
        <el-icon><Download /></el-icon>导出
      </el-button>
      <!-- <el-button @click="handleSyncWarningThresholds" type="info" v-permission="'inventory.update'">
        同步预警阈值
      </el-button> -->
      <el-divider direction="vertical" />
      <div class="display-mode-switch">
        <span class="switch-label">批次合并: </span>
        <el-switch
          v-model="mergeMode"
          active-text="开启"
          inactive-text="关闭"
          inline-prompt
        />
      </div>
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

    <el-table 
      :data="paginatedInventoryList" 
      v-loading="loading" 
      stripe
      class="glass-table"
      :default-sort="{prop: 'expiry_date', order: 'ascending'}"
      @sort-change="handleSort"
    >
      <el-table-column 
        prop="material_category" 
        label="物料分类" 
        width="150"
        show-overflow-tooltip 
      >
        <!-- 物料分类筛选器 -->
        <template #header>
          <el-select 
            v-model="filters.category" 
            placeholder="物料分类" 
            clearable
            size="small"
            class="header-filter-select full-width"
            @change="handleFilter"
          >
            <el-option
              label="所有分类"
              :value="undefined"
            />
            <el-option
              v-for="item in categoryOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </template>
        <!-- 自定义显示物料分类 -->
        <template #default="{ row }">
          {{ getMaterialCategory(row.material_id) }}
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="material_name" 
        label="物料名称" 
        width="150"
        show-overflow-tooltip 
      >
        <!-- 简化物料名称筛选器 -->
        <template #header>
          <el-select 
            v-model="filters.material_id" 
            placeholder="物料名称" 
            clearable
            size="small"
            class="header-filter-select full-width"
            @change="handleFilter"
          >
            <el-option
              label="所有物料"
              :value="undefined"
            />
            <el-option
              v-for="item in materialList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </template>
        <!-- 添加自定义显示逻辑，处理加工物料 -->
        <template #default="{ row }">
          <span v-if="isProcessedMaterial(row)">
            {{ getProcessedMaterialName(row.material_id) }}
          </span>
          <span v-else>
            {{ row.material_name }}
          </span>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="store_name" 
        label="所属门店" 
        width="150"
        show-overflow-tooltip 
      >
        <!-- 简化门店筛选器 -->
        <template #header>
          <el-select 
            v-model="filters.store_id" 
            placeholder="所属门店" 
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
        label="库存数量" 
        width="110"
        sortable
        sort-by="quantity"
      >
        <template #default="{ row }">
          <div>
            {{ row.quantity }} {{ isProcessedMaterial(row) ? getProcessedMaterialUnit(row.material_id) : getMaterialUnit(row.material_id) }}
            <el-tag v-if="row.batchCount && row.batchCount > 1" size="small" type="info" class="ml-2">
              已合并
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <!-- <el-table-column 
        label="单价" 
        width="90"
        sortable
        :sort-method="sortByPrice"
      >
        <template #default="{ row }">
          {{ row.unit_price ? `¥${row.unit_price}` : '-' }}
        </template>
      </el-table-column>
      <el-table-column 
        prop="expiry_date" 
        label="到期时间" 
        width="115"
        sortable
      /> -->
      <el-table-column 
        label="状态" 
        width="110" 
        align="center"
        sortable
        :sort-method="sortByStatus"
      >
        <template #default="{ row }">
          <el-tooltip v-if="!mergeMode && row.totalGroupQuantity !== row.quantity" effect="dark" placement="top">
            <template #content>
              <span>该物料在此门店的总库存: {{ row.totalGroupQuantity }} {{ isProcessedMaterial(row) ? getProcessedMaterialUnit(row.material_id) : getMaterialUnit(row.material_id) }}</span>
            </template>
            <el-tag :type="getWarningStatus(row)" class="glass-tag">
              {{ getWarningStatus(row) === 'danger' ? '库存不足' : '正常' }}
            </el-tag>
          </el-tooltip>
          <el-tag v-else :type="getWarningStatus(row)" class="glass-tag">
            {{ getWarningStatus(row) === 'danger' ? '库存不足' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>
      <!-- <el-table-column 
        prop="batch_number" 
        label="批次号" 
        width="120"
        show-overflow-tooltip 
      >
        <template #default="{ row }">
          <el-tooltip v-if="row.batch_number === '多批次'" effect="dark" placement="top">
            <template #content>
              <span>该物料在该门店有{{ row.batchCount }}个批次，点击"批次详情"查看</span>
            </template>
            <el-tag type="info">{{ row.batch_number }} ({{ row.batchCount }})</el-tag>
          </el-tooltip>
          <span v-else>{{ row.batch_number || '-' }}</span>
        </template>
      </el-table-column> -->
      <el-table-column 
        label="操作" 
        width="220" 
        fixed="right" 
        align="center" 
        v-if="canEdit"
      >
        <template #default="{ row }">
          <el-button 
            v-if="mergeMode && row.batchCount && row.batchCount > 1"
            type="primary" 
            size="small"
            @click="handleViewBatchDetails(row)"
            class="edit-button"
          >
            批次详情
          </el-button>
          <el-button 
            v-else
            type="primary" 
            size="small"
            @click="handleEdit(row)"
            class="edit-button"
          >
            编辑
          </el-button>
          
          <el-button
            v-if="hasMaterialProcessingInfo(row.material_id) && !isProcessedMaterial(row)"
            type="success"
            size="small"
            @click="handleProcessing(row)"
          >
            加工
          </el-button>
        </template>
        <template #header>
          <div class="operation-header">操作</div>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 添加分页器 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="filteredInventoryList.length"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '入库' : '编辑库存'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="物料" prop="material_id">
          <el-select v-model="form.material_id" placeholder="请选择物料" @change="handleMaterialChange">
            <el-option
              v-for="item in materialList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="门店" prop="store_id">
          <el-select v-model="form.store_id" placeholder="请选择门店">
            <el-option
              v-for="item in storeList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="数量" prop="quantity">
          <el-input-number 
            v-model="form.quantity" 
            :min="0"
            :precision="2"
            :step="1"
          />
        </el-form-item>
        
        <el-form-item label="批次号" prop="batch_number">
          <div class="batch-number-container">
            <el-input v-model="form.batch_number" placeholder="请输入批次号" />
            <el-button type="primary" size="small" @click="generateBatchNumber">
              自动生成
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="单价" prop="unit_price">
          <el-input-number 
            v-model="form.unit_price"
            :min="0"
            :precision="2"
            :step="0.1"
            placeholder="请输入单价"
          />
        </el-form-item>
        
        <el-form-item label="生产日期" prop="production_date">
          <el-date-picker
            v-model="form.production_date"
            type="date"
            placeholder="请选择生产日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="到期时间" prop="expiry_date">
          <el-date-picker
            v-model="form.expiry_date"
            type="date"
            placeholder="请选择到期时间"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="预警阈值" prop="warning_threshold">
          <el-input-number
            v-model="form.warning_threshold"
            :min="0"
            :precision="2"
            :step="1"
            placeholder="请输入预警阈值"
            disabled
          />
          <div class="form-item-tip">预警阈值自动使用物料管理中设置的标准值</div>
        </el-form-item>

        <!-- 自动入库加工控件 -->
        <el-form-item v-if="canAutoProcess" label="自动入库加工">
          <el-switch
            v-model="form.auto_process"
            active-text="启用"
            inactive-text="禁用"
          />
          <div class="form-item-tip">
            启用后，物料入库到总库房时将自动执行加工流程，生成加工后的物料
          </div>
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

    <!-- 调拨对话框 -->
    <el-dialog
      v-model="transferDialogVisible"
      title="库存调拨"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="transferFormRef"
        :model="transferForm"
        :rules="transferRules"
        label-width="100px"
      >
        <el-form-item label="物料" prop="material_id">
          <el-select v-model="transferForm.material_id" placeholder="请选择物料" filterable>
            <el-option
              v-for="item in filteredMaterialOptions"
              :key="item.id"
              :label="item.isProcessed ? item.processed_name : item.name"
              :value="item.id"
            />
          </el-select>
          <div class="form-item-tip" v-if="transferForm.source_store_id && mainWarehouseId && transferForm.source_store_id === mainWarehouseId">
            <el-alert
              type="info"
              :closable="false"
              show-icon
            >
              总库房只能调拨加工后的物料，只显示批次号以"P"开头的物料
            </el-alert>
          </div>
        </el-form-item>
        
        <el-form-item label="源门店" prop="source_store_id">
          <el-select v-model="transferForm.source_store_id" placeholder="请选择源门店" @change="handleSourceChange">
            <el-option
              v-for="item in storeList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="目标门店" prop="target_store_id">
          <el-select v-model="transferForm.target_store_id" placeholder="请选择目标门店">
            <el-option
              v-for="item in targetStoreOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
            <!-- <el-option
              label="出库（无目标门店）"
              :value="-1"
            /> -->
          </el-select>
          <div class="form-item-tip">将按照FIFO原则自动处理批次扣减</div>
        </el-form-item>
        
        <el-form-item label="调拨数量" prop="quantity">
          <el-input-number 
            v-model="transferForm.quantity" 
            :min="0.00"
            :precision="2"
            :step="1"
          />
          <span class="ml-2" v-if="transferForm.material_id">
            {{ isTransferMaterialProcessed ? getProcessedMaterialUnit(transferForm.material_id) : getMaterialUnit(transferForm.material_id) }}
          </span>
        </el-form-item>
        
        <!-- <el-form-item label="批次号" prop="batch_number" v-if="transferForm.target_store_id !== -1">
          <el-input v-model="transferForm.batch_number" placeholder="请输入批次号" />
        </el-form-item> -->
        
        <el-form-item v-if="selectedMaterialInventory" label="当前库存" class="readonly-item">
          <span>
            {{ selectedMaterialInventory.quantity }} 
            {{ selectedMaterialInventory.isProcessed ? 
                getProcessedMaterialUnit(selectedMaterialInventory.material_id) : 
                getMaterialUnit(selectedMaterialInventory.material_id) }}
          </span>
          <el-tag 
            :type="selectedMaterialInventory.warning ? 'danger' : 'success'" 
            class="ml-2"
          >
            {{ selectedMaterialInventory.warning ? '库存不足' : '正常' }}
          </el-tag>
        </el-form-item>
        
        <el-form-item v-if="selectedMaterialInventory && selectedMaterialInventory.batch_number === '多批次'" label="批次信息" class="readonly-item">
          <div class="form-item-tip">
            <el-tag type="info">该物料在该门店有多个批次，系统将按FIFO原则自动从最早入库的批次开始处理</el-tag>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="transferDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleTransferSubmit" :loading="transferSubmitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批次详情对话框 -->
    <el-dialog
      v-model="batchDetailsVisible"
      :title="`批次详情 (共${batchDetails.length}个批次)`"
      width="800px"
    >
      <el-descriptions :title="`${selectedMaterial}在${selectedStore}的库存明细`" :column="1" border>
        <el-descriptions-item label="物料总数量">
          {{ selectedItemTotalQuantity }} {{ selectedItemUnit }}
          <el-tag :type="selectedItemWarning ? 'danger' : 'success'" class="ml-2">
            {{ selectedItemWarning ? '库存不足' : '正常' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预警阈值">
          {{ selectedItemThreshold }} {{ selectedItemUnit }}
        </el-descriptions-item>
      </el-descriptions>
      
      <el-table 
        :data="batchDetails" 
        stripe 
        style="width: 100%; margin-top: 15px;"
        :default-sort="{ prop: 'quantity', order: 'descending' }"
      >
        <el-table-column prop="batch_number" label="批次号" width="120">
          <template #default="{ row }">
            <el-tag v-if="isProcessedMaterial(row)" type="success" size="small" class="mr-1">加工</el-tag>
            {{ row.batch_number }}
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="100" sortable="custom">
          <template #default="{ row }">
            {{ row.quantity }} {{ isProcessedMaterial(row) ? getProcessedMaterialUnit(row.material_id) : getMaterialUnit(row.material_id) }}
          </template>
        </el-table-column>
        <el-table-column prop="unit_price" label="单价" width="100" sortable>
          <template #default="{ row }">
            {{ row.unit_price ? `¥${row.unit_price}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="production_date" label="生产日期" width="120" sortable />
        <el-table-column prop="expiry_date" label="到期时间" width="120" sortable />
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <template #footer>
        <el-button @click="batchDetailsVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 加工对话框 -->
    <el-dialog
      v-model="processingDialogVisible"
      title="物料加工"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="processingFormRef"
        :model="processingForm"
        :rules="processingRules"
        label-width="120px"
      >
        <el-form-item label="原始物料">
          {{ processingForm.material_name }} ({{ processingForm.unit }})
        </el-form-item>
        
        <el-form-item label="当前库存">
          <span :class="{ 'warning-text': isLowStock }">
            {{ currentStock }} {{ processingForm.unit }}
          </span>
        </el-form-item>

        <el-form-item label="加工后物料">
          {{ processingForm.processed_name }} ({{ processingForm.processed_unit }})
        </el-form-item>
        
        <el-form-item label="加工数量" required>
          <el-input-number 
            v-model="processingForm.quantity" 
            :min="0"
            :max="currentStock"
            :precision="2"
            :step="1"
          />
          {{ processingForm.unit }}
        </el-form-item>
        
        <el-form-item label="加工后数量">
          <span>{{ calculateProcessedQuantity }} {{ processingForm.processed_unit }}</span>
        </el-form-item>
        
        <el-form-item label="批次号">
          <span>{{ processingForm.batch_number }}</span>
        </el-form-item>
        
        <div class="form-item-tip">
          <el-alert
            type="info"
            :closable="false"
            show-icon
          >
            加工后将产生一个新的批次，批次号以"P"开头，表示该批次是通过加工得到的。
          </el-alert>
        </div>
      </el-form>
      
      <template #footer>
        <el-button @click="processingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProcessing" :loading="processingSubmitting">确认加工</el-button>
      </template>
    </el-dialog>
  </page-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Download, RefreshRight, Right } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import { useInventoryStore } from '@/stores/inventory'
import { getMaterialList } from '@/api/materials'
import { getStoreList } from '@/api/stores'
import type { Inventory, Material, Store } from '@/types'
import { useUserStore } from '@/stores/user'
import { checkPermission } from '@/utils/permission'
import PageContainer from '@/components/PageContainer.vue'
import { transferStock, checkoutStock, processMaterial } from '@/api/inventory'

const inventoryStore = useInventoryStore()
const userStore = useUserStore()
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()

const materialList = ref<Material[]>([])
const storeList = ref<Store[]>([])

// 物料分类选项
const categoryOptions = computed(() => {
  const categories = new Set<string>()
  materialList.value.forEach(material => {
    if (material.category) {
      categories.add(material.category)
    }
  })
  return Array.from(categories)
})

// 获取物料分类
const getMaterialCategory = (materialId: number) => {
  const material = materialList.value.find(m => m.id === materialId)
  return material?.category || '未分类'
}

// 筛选状态变量
const filters = ref({
  material_id: undefined as number | undefined,
  store_id: undefined as number | undefined,
  category: undefined as string | undefined
})

// 计算是否有活跃的筛选条件
const hasActiveFilters = computed(() => {
  return filters.value.material_id !== undefined || 
         filters.value.store_id !== undefined || 
         filters.value.category !== undefined
})

// 计算总库房ID
const mainWarehouseId = computed(() => {
  // 优先查找名称包含"总库房"、"总仓"、"仓库"等关键词的门店
  const mainWarehouse = storeList.value.find(
    store => ["总库房", "总仓", "仓库", "中央仓库", "main"].some(
      keyword => store.name.includes(keyword)
    )
  )
  
  // 如果找到了匹配名称的门店，返回其ID
  if (mainWarehouse) {
    return mainWarehouse.id
  }
  
  // 如果没有找到，默认返回ID为1的门店(通常ID为1的是总库房)
  return storeList.value.length > 0 ? storeList.value[0].id : undefined
})

const form = ref({
  id: undefined as number | undefined,
  material_id: undefined as number | undefined,
  store_id: undefined as number | undefined,
  quantity: 0,
  batch_number: '',
  unit_price: undefined as number | undefined,
  production_date: '',
  expiry_date: '',
  warning_threshold: undefined as number | undefined,
  auto_process: true // 默认启用自动入库加工
})

// 计算属性
const canEdit = computed(() => 
  checkPermission(userStore.currentUser, 'inventory.update')
)

// 原始库存列表
const inventoryList = computed(() => inventoryStore.inventoryList)

// 计算每个门店-物料组合的总库存和预警状态
const materialStoreTotals = computed(() => {
  const totals = new Map();
  
  // 首先计算每个物料-门店组合的总库存
  inventoryList.value.forEach(item => {
    // 判断是否为加工物料
    const isProcessed = isProcessedMaterial(item);
    
    // 创建包含加工状态的键
    const key = `${item.material_id}-${item.store_id}-${isProcessed ? 1 : 0}`;
    
    if (totals.has(key)) {
      const existing = totals.get(key);
      existing.totalQuantity += item.quantity;
    } else {
      // 获取物料信息，以确定正确的预警阈值
      const material = materialList.value.find(m => m.id === item.material_id);
      // 优先使用物料表中的预警阈值
      let warningThreshold = 0;
      if (isProcessed && material && material.processed_warning_threshold) {
        warningThreshold = material.processed_warning_threshold;
      } else if (!isProcessed && material && material.warning_threshold) {
        warningThreshold = material.warning_threshold;
      } else {
        warningThreshold = item.warning_threshold;
      }
      
      totals.set(key, {
        totalQuantity: item.quantity,
        warning_threshold: warningThreshold,
        isProcessed: isProcessed
      });
    }
  });
  
  // 计算每个组合的预警状态
  for (const [key, data] of totals.entries()) {
    data.warning = data.totalQuantity <= data.warning_threshold;
  }
  
  return totals;
});

// 修改原始库存列表，添加基于总库存的预警状态
const processedInventoryList = computed(() => {
  return inventoryList.value.map(item => {
    // 判断是否为加工物料
    const isProcessed = isProcessedMaterial(item);
    
    // 使用包含加工状态的键
    const key = `${item.material_id}-${item.store_id}-${isProcessed ? 1 : 0}`;
    const totalData = materialStoreTotals.value.get(key);
    
    // 创建新对象，避免修改原始数据
    return {
      ...item,
      // 覆盖原有的warning字段，使用基于总库存的预警状态
      warning: totalData ? totalData.warning : item.warning,
      // 添加组合的总库存数量，方便显示
      totalGroupQuantity: totalData ? totalData.totalQuantity : item.quantity
    };
  });
});

// 计算属性：合并同一门店同一物料的多个批次库存为一条记录
const mergedInventoryList = computed(() => {
  // 创建分组映射: {material_id}-{store_id}-{是否为加工物料} => 合并后的记录
  const groupedMap = new Map<string, Inventory & { batchCount?: number, isProcessed?: boolean }>()
  
  // 创建批次计数映射
  const batchCountMap = new Map<string, number>()
  
  // 遍历原始库存数据
  inventoryList.value.forEach(item => {
    // 判断是否为加工物料
    const isProcessed = isProcessedMaterial(item)
    
    // 创建分组键，加入是否为加工物料的标志
    const key = `${item.material_id}-${item.store_id}-${isProcessed ? 'processed' : 'raw'}`
    
    // 增加批次计数
    batchCountMap.set(key, (batchCountMap.get(key) || 0) + 1)
    
    if (groupedMap.has(key)) {
      // 如果已存在该物料和门店的组合，则累加数量
      const existing = groupedMap.get(key)!
      // 累加数量
      existing.quantity += item.quantity
      // 更新批次计数
      existing.batchCount = batchCountMap.get(key)
      // 标记是否为加工物料
      existing.isProcessed = Boolean(isProcessed)
      
      // 更新到期日期（取最早的那个日期）
      if (item.expiry_date && existing.expiry_date) {
        const existingDate = new Date(existing.expiry_date)
        const itemDate = new Date(item.expiry_date)
        if (itemDate < existingDate) {
          existing.expiry_date = item.expiry_date
        }
      } else if (item.expiry_date) {
        existing.expiry_date = item.expiry_date
      }
    } else {
      // 如果不存在，创建新的合并记录
      const processed = { 
        ...item,
        // 添加一个标记，表示这是合并后的记录
        batch_number: batchCountMap.get(key)! > 1 ? '多批次' : item.batch_number,
        // 添加批次计数
        batchCount: batchCountMap.get(key),
        // 标记是否为加工物料
        isProcessed: Boolean(isProcessed)
      }
      
      groupedMap.set(key, processed)
    }
  })
  
  // 获取合并后的数组
  const result = Array.from(groupedMap.values());
  
  // 更新预警状态
  result.forEach(item => {
    // 如果是加工物料，使用加工后的预警阈值
    if (item.isProcessed) {
      const material = materialList.value.find(m => m.id === item.material_id)
      if (material && material.processed_warning_threshold) {
        item.warning = item.quantity <= material.processed_warning_threshold
      }
    } else {
      // 基于合并后的数量更新预警状态
      item.warning = item.quantity <= item.warning_threshold;
    }
  });
  
  return result;
})

// 添加合并显示模式的开关状态
const mergeMode = ref(true)

// 修改过滤后的库存列表计算属性，根据合并模式选择数据源
const filteredInventoryList = computed(() => {
  // 根据模式选择基础数据源
  let result = mergeMode.value ? mergedInventoryList.value : processedInventoryList.value;

  // 按物料ID筛选
  if (filters.value.material_id !== undefined) {
    result = result.filter(item => item.material_id === filters.value.material_id);
  }

  // 按门店ID筛选
  if (filters.value.store_id !== undefined) {
    result = result.filter(item => item.store_id === filters.value.store_id);
  }
  
  // 按物料分类筛选
  if (filters.value.category !== undefined) {
    result = result.filter(item => {
      const material = materialList.value.find(m => m.id === item.material_id)
      return material?.category === filters.value.category
    })
  }

  return result;
})

// 表单验证规则
const rules = {
  material_id: [{ required: true, message: '请选择物料', trigger: 'change' }],
  store_id: [{ required: true, message: '请选择门店', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }]
}

// 处理筛选
const handleFilter = () => {
  // 筛选逻辑已经在计算属性中实现
  console.log('筛选条件已更新:', filters.value)
}

// 重置筛选条件
const resetFilter = () => {
  filters.value = {
    material_id: undefined,
    store_id: undefined,
    category: undefined
  }
}

// 单价排序方法
const sortByPrice = (a: Inventory, b: Inventory) => {
  const priceA = a.unit_price || 0
  const priceB = b.unit_price || 0
  return priceA - priceB
}

// 状态排序方法
const sortByStatus = (a: Inventory, b: Inventory) => {
  const statusA = a.warning ? 1 : 0
  const statusB = b.warning ? 1 : 0
  return statusA - statusB
}

// 添加表格排序事件处理
const handleSort = () => {
  // 排序后重置到第一页
  currentPage.value = 1
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const [materialRes, storeRes] = await Promise.all([
      getMaterialList(),
      getStoreList()
    ])
    
    // 使用类型断言确保类型安全
    if (materialRes && 'data' in materialRes && Array.isArray(materialRes.data)) {
      materialList.value = materialRes.data as Material[]
    }
    
    if (storeRes && 'data' in storeRes && Array.isArray(storeRes.data)) {
      storeList.value = storeRes.data as Store[]
    }
    
    await inventoryStore.fetchInventory()
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 生成批次号函数
const generateBatchNumber = () => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2) // 年份后两位
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  // 格式: B年月日时分秒
  form.value.batch_number = `B${year}${month}${day}${hours}${minutes}${seconds}`
}

// 修改handleAdd函数，在打开入库对话框时自动生成批次号
const handleAdd = () => {
  dialogType.value = 'add'
  form.value = {
    id: undefined,
    material_id: undefined,
    store_id: mainWarehouseId.value, // 默认为总库房
    quantity: 0,
    batch_number: '',
    unit_price: undefined,
    production_date: '',
    expiry_date: '',
    warning_threshold: undefined,
    auto_process: true // 默认启用自动入库加工
  }
  // 自动生成批次号
  generateBatchNumber()
  dialogVisible.value = true
}

// 编辑库存
const handleEdit = (row: Inventory) => {
  // 如果是多批次且是合并显示模式，先打开批次详情
  if (mergeMode.value && row.batchCount && row.batchCount > 1) {
    handleViewBatchDetails(row)
    ElMessage.info('该物料有多个批次，请在批次详情中选择要编辑的具体批次')
    return
  }
  
  dialogType.value = 'edit'
  
  // 查找最新的物料信息以获取当前的预警阈值
  const currentMaterial = materialList.value.find(m => m.id === row.material_id)
  
  // 根据是否为加工物料选择正确的预警阈值
  let currentWarningThreshold = row.warning_threshold;
  if (currentMaterial) {
    if (isProcessedMaterial(row) && currentMaterial.processed_warning_threshold) {
      currentWarningThreshold = currentMaterial.processed_warning_threshold;
    } else if (!isProcessedMaterial(row) && currentMaterial.warning_threshold) {
      currentWarningThreshold = currentMaterial.warning_threshold;
    }
  }
  
  form.value = {
    id: row.id,
    material_id: row.material_id,
    store_id: row.store_id,
    quantity: row.quantity,
    batch_number: row.batch_number || '',
    unit_price: row.unit_price,
    production_date: row.production_date || '',
    expiry_date: row.expiry_date || '',
    warning_threshold: currentWarningThreshold,
    auto_process: false // 编辑模式下默认不启用自动加工
  }
  
  // 如果批次详情对话框是打开的，先关闭它
  if (batchDetailsVisible.value) {
    batchDetailsVisible.value = false
  }
  dialogVisible.value = true
}

// 处理物料选择变化
const handleMaterialChange = (materialId: number) => {
  if (!materialId) return

  // 从物料列表中查找选中的物料
  const selectedMaterial = materialList.value.find(m => m.id === materialId)
  if (selectedMaterial) {
    // 设置预警阈值为物料管理中配置的值
    // 这里实现了自动获取物料预设的预警阈值，并且在界面上设为只读状态，
    // 确保入库操作使用物料标准预警阈值，保持系统一致性
    form.value.warning_threshold = selectedMaterial.warning_threshold
    console.log(`自动设置${selectedMaterial.name}的预警阈值为${selectedMaterial.warning_threshold}`)

    // 根据物料是否有加工信息来设置自动加工状态
    if (hasMaterialProcessingInfo(materialId)) {
      form.value.auto_process = true // 有加工信息时默认启用
      console.log(`物料${selectedMaterial.name}支持加工，已启用自动入库加工`)
    } else {
      form.value.auto_process = false // 无加工信息时禁用
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    // 确保必需字段存在
    if (form.value.material_id === undefined || form.value.store_id === undefined) {
      ElMessage.error('请选择物料和门店')
      return
    }
    
    submitting.value = true
    try {
      // 确保warning_threshold是正确的物料最新预警值
      if (form.value.material_id) {
        const selectedMaterial = materialList.value.find(m => m.id === form.value.material_id)
        if (selectedMaterial) {
          // 始终使用物料管理中的最新预警阈值
          form.value.warning_threshold = selectedMaterial.warning_threshold
          console.log(`提交前更新${selectedMaterial.name}的预警阈值为${selectedMaterial.warning_threshold}`)
        }
      }
      
      await inventoryStore.updateStock({
        ...form.value,
        id: form.value.id,
        material_id: form.value.material_id,
        store_id: form.value.store_id,
        type: dialogType.value
      })
      dialogVisible.value = false
      await fetchData() // 刷新数据
      ElMessage.success(dialogType.value === 'add' ? '入库成功' : '修改成功')
    } catch (error) {
      console.error('操作失败:', error)
      ElMessage.error('操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 导出数据
const handleExport = async () => {
  try {
    loading.value = true
    const response = await inventoryStore.exportInventory()
    
    // 创建下载链接
    if (response && typeof response === 'object' && 'data' in response && response.data instanceof Blob) {
      const blob = response.data
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      const filename = `inventory_${new Date().toISOString().split('T')[0]}.xlsx`
      
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
    } else {
      throw new Error('导出失败：未收到有效数据')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 调拨弹窗状态
const transferDialogVisible = ref(false)
const transferSubmitting = ref(false)
const transferFormRef = ref<FormInstance>()

// 调拨表单
const transferForm = ref({
  material_id: undefined as number | undefined,
  source_store_id: undefined as number | undefined,
  target_store_id: undefined as number | undefined,
  quantity: 0,
  batch_number: ''
})

// 调拨表单验证规则
const transferRules = {
  material_id: [{ required: true, message: '请选择物料', trigger: 'change' }],
  source_store_id: [{ required: true, message: '请选择源门店', trigger: 'change' }],
  target_store_id: [{ 
    required: true, 
    message: '请选择目标门店',
    trigger: 'change'
  }],
  quantity: [
    { required: true, message: '请输入数量', trigger: 'blur' },
    { 
      validator: (rule: any, value: number, callback: Function) => {
        if (!transferForm.value.material_id || !transferForm.value.source_store_id) {
          callback()
          return
        }
        
        // 判断是否是从总库房选择的加工物料
        const isFromMainWarehouse = transferForm.value.source_store_id === mainWarehouseId.value;
        const isProcessedMaterial = isFromMainWarehouse && filteredMaterialOptions.value.find(
          m => m.id === transferForm.value.material_id
        )?.isProcessed;
        
        // 使用与界面显示一致的库存数量计算方法
        let availableQuantity = 0;
        
        if (mergeMode.value) {
          // 从合并后的库存列表中查找
          const inventory = mergedInventoryList.value.find(
            item => item.material_id === transferForm.value.material_id && 
                   item.store_id === transferForm.value.source_store_id &&
                   (isFromMainWarehouse ? item.isProcessed : true)
          )
          if (!inventory) {
            callback(new Error('源门店没有该物料库存'))
            return
          }
          availableQuantity = inventory.quantity
        } else {
          // 查找所有符合条件的批次，计算总数量
          const matchedBatches = processedInventoryList.value.filter(
            item => item.material_id === transferForm.value.material_id && 
                   item.store_id === transferForm.value.source_store_id &&
                   (isFromMainWarehouse ? item.batch_number && item.batch_number.startsWith('P') : true)
          )
          
          if (matchedBatches.length === 0) {
            callback(new Error('源门店没有该物料库存'))
            return
          }
          
          // 计算总库存
          availableQuantity = matchedBatches.reduce((sum, item) => sum + item.quantity, 0)
        }
        
        if (value <= 0) {
          callback(new Error('数量必须大于0'))
          return
        }
        
        if (value > availableQuantity) {
          const material = materialList.value.find(m => m.id === transferForm.value.material_id);
          const unit = isProcessedMaterial ? (material?.processed_unit || '份') : (material?.unit || '');
          callback(new Error(`不能超过可用库存 ${availableQuantity} ${unit}`))
          return
        }
        
        callback()
      },
      trigger: 'change'
    }
  ]
}

// 计算目标门店选项，排除源门店
const targetStoreOptions = computed(() => {
  if (!transferForm.value.source_store_id) return storeList.value
  return storeList.value.filter(store => store.id !== transferForm.value.source_store_id)
})

// 计算选中物料的库存信息
const selectedMaterialInventory = computed(() => {
  if (!transferForm.value.material_id || !transferForm.value.source_store_id) return null
  
  // 判断是否是从总库房选择的加工物料
  const isFromMainWarehouse = transferForm.value.source_store_id === mainWarehouseId.value;
  const hasProcessedBatches = inventoryList.value.some(
    inv => inv.material_id === transferForm.value.material_id && 
          inv.store_id === transferForm.value.source_store_id && 
          inv.batch_number && 
          inv.batch_number.startsWith('P')
  );
  
  // 如果开启了批次合并，需要查找合并后的库存记录
  if (mergeMode.value) {
    // 查找符合条件的合并记录
    const record = mergedInventoryList.value.find(item => 
      item.material_id === transferForm.value.material_id && 
      item.store_id === transferForm.value.source_store_id &&
      (isFromMainWarehouse ? item.isProcessed : true)
    );
    
    if (record) {
      return {
        ...record,
        isProcessed: hasProcessedBatches && isFromMainWarehouse
      };
    }
    
    return null;
  } else {
    // 查找所有符合条件的批次，对于总库房只查找加工批次
    const matchedBatches = processedInventoryList.value.filter(
      item => item.material_id === transferForm.value.material_id && 
              item.store_id === transferForm.value.source_store_id &&
              (isFromMainWarehouse ? isProcessedMaterial(item) : true)
    );
    
    if (matchedBatches.length === 0) return null;
    
    // 创建一个虚拟的合并记录用于展示
    const totalQuantity = matchedBatches.reduce((sum, item) => sum + item.quantity, 0);
    return {
      ...matchedBatches[0],
      quantity: totalQuantity,
      batch_number: matchedBatches.length > 1 ? '多批次' : matchedBatches[0].batch_number,
      isProcessed: hasProcessedBatches && isFromMainWarehouse
    };
  }
});

// 源门店变更处理
const handleSourceChange = () => {
  // 如果源门店和目标门店相同，则清空目标门店
  if (transferForm.value.source_store_id === transferForm.value.target_store_id) {
    transferForm.value.target_store_id = undefined
  }
  
  // 重置物料选择，以便重新筛选物料列表
  transferForm.value.material_id = undefined
}

// 打开调拨对话框
const handleTransfer = () => {
  transferForm.value = {
    material_id: undefined,
    source_store_id: mainWarehouseId.value, // 默认设置为总库房
    target_store_id: undefined,
    quantity: 0,
    batch_number: ''
  }
  transferDialogVisible.value = true
}

// 提交调拨或出库请求
const handleTransferSubmit = async () => {
  if (!transferFormRef.value) return
  
  await transferFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    // 确保基本字段存在
    if (
      transferForm.value.material_id === undefined || 
      transferForm.value.source_store_id === undefined ||
      transferForm.value.target_store_id === undefined
    ) {
      ElMessage.error('请选择物料、源门店和目标门店')
      return
    }
    
    transferSubmitting.value = true
    try {
      // 检查是否是加工物料，需要传递P前缀的批次号
      const isFromMainWarehouse = transferForm.value.source_store_id === mainWarehouseId.value;
      const isProcessed = isFromMainWarehouse && filteredMaterialOptions.value.find(
        m => m.id === transferForm.value.material_id
      )?.isProcessed;
      
      // 为加工物料生成带P前缀的批次号
      const now = new Date();
      const batchNumber = isProcessed 
        ? `P${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
        : '';
        
      // 调拨数据
      const transferData = {
        material_id: transferForm.value.material_id,
        source_store_id: transferForm.value.source_store_id,
        target_store_id: transferForm.value.target_store_id,
        quantity: transferForm.value.quantity,
        batch_number: batchNumber // 加入批次号信息
      };
      
      // 根据目标门店ID判断是出库还是调拨
      if (transferForm.value.target_store_id === -1) {
        // 出库操作 - 使用FIFO逻辑
        await checkoutStock({
          material_id: transferForm.value.material_id,
          store_id: transferForm.value.source_store_id,
          quantity: transferForm.value.quantity
        })
        ElMessage.success('物料出库成功')
      } else {
        // 调拨操作
        await transferStock(transferData)
        ElMessage.success('物料调拨成功')
      }
      
      transferDialogVisible.value = false
      await fetchData() // 刷新数据
    } catch (error) {
      const operationType = transferForm.value.target_store_id === -1 ? '出库' : '调拨'
      console.error(`${operationType}失败:`, error)
      ElMessage.error(`${operationType}失败，请稍后重试`)
    } finally {
      transferSubmitting.value = false
    }
  })
}

// 批次详情对话框相关状态
const batchDetailsVisible = ref(false)
const batchDetails = ref<Inventory[]>([])
const selectedMaterial = ref('')
const selectedStore = ref('')
const selectedItemUnit = ref('')
const selectedItemTotalQuantity = ref(0)
const selectedItemThreshold = ref(0)
const selectedItemWarning = ref(false)

// 处理查看批次详情
const handleViewBatchDetails = (row: Inventory) => {
  // 查找该物料在该门店的所有批次
  const details = inventoryList.value.filter(
    item => item.material_id === row.material_id && item.store_id === row.store_id
  );
  
  // 对批次进行排序：
  // 1. 先按是否为加工物料排序（未加工的排在前面）
  // 2. 然后按数量从大到小排序
  batchDetails.value = details.sort((a, b) => {
    // 首先按是否为加工物料排序
    const aIsProcessed = isProcessedMaterial(a);
    const bIsProcessed = isProcessedMaterial(b);
    if (aIsProcessed !== bIsProcessed) {
      return aIsProcessed ? 1 : -1; // 未加工的排在前面
    }
    
    // 如果加工状态相同，则按数量从大到小排序
    return b.quantity - a.quantity;
  });
  
  // 判断是否为加工物料，显示正确的名称和单位
  const isProcessed = isProcessedMaterial(row);
  if (isProcessed) {
    selectedMaterial.value = getProcessedMaterialName(row.material_id);
    selectedItemUnit.value = getProcessedMaterialUnit(row.material_id);
  } else {
    selectedMaterial.value = row.material_name;
    selectedItemUnit.value = getMaterialUnit(row.material_id);
  }
  
  selectedStore.value = row.store_name;
  
  // 获取物料信息，确定正确的预警阈值
  const material = materialList.value.find(m => m.id === row.material_id);
  
  // 计算总数量
  const totalQuantity = details.reduce((sum, item) => sum + item.quantity, 0);
  selectedItemTotalQuantity.value = totalQuantity;
  
  // 确定预警阈值和预警状态
  let warningThreshold = row.warning_threshold;
  
  // 优先使用物料表中的预警阈值
  if (material) {
    if (isProcessed && material.processed_warning_threshold) {
      warningThreshold = material.processed_warning_threshold;
    } else if (!isProcessed && material.warning_threshold) {
      warningThreshold = material.warning_threshold;
    }
  }
  
  selectedItemThreshold.value = warningThreshold;
  selectedItemWarning.value = totalQuantity <= warningThreshold;
  
  batchDetailsVisible.value = true;
}

// 同步所有库存记录的预警阈值到物料管理中的最新值
const handleSyncWarningThresholds = async () => {
  try {
    loading.value = true
    const updates = []
    
    // 遍历所有库存记录
    for (const item of processedInventoryList.value) {
      // 查找对应的物料信息
      const material = materialList.value.find(m => m.id === item.material_id)
      if (material && material.warning_threshold !== item.warning_threshold) {
        // 创建更新请求
        updates.push(
          inventoryStore.updateStock({
            id: item.id,
            material_id: item.material_id,
            store_id: item.store_id,
            warning_threshold: material.warning_threshold,
            // 保持其他字段不变
            quantity: item.quantity,
            batch_number: item.batch_number || '',
            unit_price: item.unit_price,
            production_date: item.production_date || '',
            expiry_date: item.expiry_date || '',
            type: 'edit'
          })
        )
      }
    }
    
    if (updates.length > 0) {
      await Promise.all(updates)
      ElMessage.success(`已同步${updates.length}条库存记录的预警阈值`)
    } else {
      ElMessage.info('所有库存记录的预警阈值已是最新')
    }
    
    await fetchData() // 刷新数据
  } catch (error) {
    console.error('同步预警阈值失败:', error)
    ElMessage.error('同步预警阈值失败')
  } finally {
    loading.value = false
  }
}

// 加工对话框相关变量
const processingDialogVisible = ref(false)
const processingSubmitting = ref(false)
const processingFormRef = ref<FormInstance>()

const processingForm = ref({
  id: undefined as number | undefined,
  material_id: undefined as number | undefined,
  material_name: '',
  store_id: undefined as number | undefined,
  store_name: '',
  quantity: 0,
  max_quantity: 0,
  unit: '',
  batch_number: '',
  processed_name: '',
  processed_unit: '',
  conversion_ratio: 0
})

// 验证规则
const processingRules = {
  quantity: [
    { required: true, message: '请输入加工数量', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '数量必须大于0', trigger: 'blur' }
  ]
}

// 计算加工后的数量
const calculateProcessedQuantity = computed(() => {
  return (processingForm.value.quantity * processingForm.value.conversion_ratio).toFixed(2)
})

// 判断物料是否有加工关系
const hasMaterialProcessingInfo = (materialId: number) => {
  const material = materialList.value.find(m => m.id === materialId)
  return material && material.processed_name && material.conversion_ratio
}

// 计算当前选择的物料是否支持自动加工
const canAutoProcess = computed(() => {
  return form.value.material_id ? hasMaterialProcessingInfo(form.value.material_id) : false
})

// 打开加工对话框
const handleProcessing = (row: Inventory) => {
  // 查找物料完整信息
  const material = materialList.value.find(m => m.id === row.material_id)
  if (!material) {
    ElMessage.error('找不到物料信息')
    return
  }
  
  // 计算该物料在该门店的总库存
  const totalQuantity = inventoryList.value
    .filter(item => 
      item.material_id === row.material_id && 
      item.store_id === row.store_id &&
      !isProcessedMaterial(item) // 只统计未加工的物料
    )
    .reduce((sum, item) => sum + item.quantity, 0)
  
  processingForm.value = {
    id: row.id,
    material_id: row.material_id,
    material_name: row.material_name,
    store_id: row.store_id,
    store_name: row.store_name,
    quantity: 0,
    max_quantity: totalQuantity, // 使用计算出的总数量
    unit: getMaterialUnit(row.material_id),
    batch_number: row.batch_number || '',
    processed_name: material.processed_name || '',
    processed_unit: material.processed_unit || '',
    conversion_ratio: material.conversion_ratio || 0
  }
  
  processingDialogVisible.value = true
}

// 提交加工
const submitProcessing = async () => {
  if (!processingFormRef.value) return
  
  try {
    await processingFormRef.value.validate()
    
    // 检查加工数量是否超过库存
    if (processingForm.value.quantity > processingForm.value.max_quantity) {
      ElMessage.error(`加工数量不能超过当前库存(${processingForm.value.max_quantity}${processingForm.value.unit})`)
      return
    }
    
    processingSubmitting.value = true
    
    // 确保material_id非空
    if (!processingForm.value.material_id) {
      ElMessage.error('物料ID不能为空')
      return
    }
    
    // 调用加工API
    const data = {
      material_id: processingForm.value.material_id,
      store_id: processingForm.value.store_id || 0,  // 确保store_id不为undefined
      quantity: processingForm.value.quantity
      // 不再传递 inventory_id，让后端自动处理多批次情况
    }
    
    await processMaterial(data)
    ElMessage.success('物料加工成功')
    
    // 刷新库存列表
    await inventoryStore.fetchInventory()
    
    // 关闭对话框
    processingDialogVisible.value = false
  } catch (error: any) {
    console.error('物料加工失败:', error)
    // 显示更详细的错误信息
    const errorMessage = error.response?.data?.message || '物料加工失败'
    ElMessage.error(errorMessage)
  } finally {
    processingSubmitting.value = false
  }
}

// 在script部分添加判断加工物料的方法
// 判断是否为加工物料（通过批次号前缀判断）
const isProcessedMaterial = (row: Inventory) => {
  return row.batch_number && row.batch_number.startsWith('P')
}

// 获取加工后的物料名称
const getProcessedMaterialName = (materialId: number) => {
  const material = materialList.value.find(m => m.id === materialId)
  return material && material.processed_name ? material.processed_name : '加工物料'
}

// 获取加工后的物料单位
const getProcessedMaterialUnit = (materialId: number) => {
  const material = materialList.value.find(m => m.id === materialId)
  return material && material.processed_unit ? material.processed_unit : '份'
}

// 在script部分添加判断警告状态的方法
// 获取库存预警状态
const getWarningStatus = (row: Inventory) => {
  // 如果是加工物料，使用加工后的预警阈值来判断
  if (isProcessedMaterial(row)) {
    const material = materialList.value.find(m => m.id === row.material_id);
    if (!material || !material.processed_warning_threshold) {
      return row.warning ? 'danger' : 'success';
    }
    
    // 优先使用物料表中的加工后预警阈值
    const warningThreshold = material.processed_warning_threshold;
    return row.quantity <= warningThreshold ? 'danger' : 'success';
  }
  
  // 对于未加工物料，优先使用物料表中的预警阈值
  const material = materialList.value.find(m => m.id === row.material_id);
  if (material && material.warning_threshold) {
    return row.quantity <= material.warning_threshold ? 'danger' : 'success';
  }
  
  // 如果物料表中没有预警阈值，回退到使用库存记录中的预警状态
  return row.warning ? 'danger' : 'success';
}

// 计算物料下拉选项，如果源门店是总库房则只显示加工后的物料
const filteredMaterialOptions = computed(() => {
  // 创建选项列表，添加isProcessed标记
  const options = materialList.value.map(material => {
    // 查找该物料是否有加工后的批次存在于库存中
    const hasProcessedInventory = inventoryList.value.some(
      inv => inv.material_id === material.id && 
            inv.batch_number && 
            inv.batch_number.startsWith('P') &&
            inv.store_id === transferForm.value.source_store_id
    );
    
    return {
      ...material,
      isProcessed: hasProcessedInventory
    };
  });
  
  // 如果源门店是总库房，只显示有加工批次的物料
  if (transferForm.value.source_store_id === mainWarehouseId.value) {
    return options.filter(material => material.isProcessed);
  }
  
  // 否则显示所有物料
  return options;
});

// 判断当前选择的调拨物料是否是加工物料
const isTransferMaterialProcessed = computed(() => {
  if (!transferForm.value.material_id || !transferForm.value.source_store_id) return false;
  
  const isFromMainWarehouse = transferForm.value.source_store_id === mainWarehouseId.value;
  return isFromMainWarehouse && filteredMaterialOptions.value.find(
    m => m.id === transferForm.value.material_id
  )?.isProcessed || false;
});

// 获取物料单位
const getMaterialUnit = (materialId: number) => {
  const material = materialList.value.find(m => m.id === materialId);
  return material ? material.unit : '';
};

// 添加分页器相关状态
const currentPage = ref(1)
const pageSize = ref(10)

// 计算分页后的库存列表
const paginatedInventoryList = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredInventoryList.value.slice(startIndex, endIndex)
})

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  // 当页面大小变化时，回到第一页
  currentPage.value = 1
}

// 处理分页当前页变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 监听筛选条件和合并模式变化，重置到第一页
watch([filters, mergeMode], () => {
  currentPage.value = 1
}, { deep: true })

// 添加计算属性
const currentStock = computed(() => {
  if (!processingForm.value.material_id || !processingForm.value.store_id) return 0;
  
  // 计算该物料在该门店的总库存（未加工的）
  return inventoryList.value
    .filter(item => 
      item.material_id === processingForm.value.material_id && 
      item.store_id === processingForm.value.store_id &&
      !isProcessedMaterial(item) // 只统计未加工的物料
    )
    .reduce((sum, item) => sum + item.quantity, 0);
})

const isLowStock = computed(() => {
  if (!processingForm.value.material_id) return false;
  
  // 获取物料信息以检查预警阈值
  const material = materialList.value.find(m => m.id === processingForm.value.material_id);
  if (!material || !material.warning_threshold) return false;
  
  return currentStock.value <= material.warning_threshold;
})

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
/* 重新设计表格样式，采用扁平化设计 */
:deep(.glass-table) {
  background: #ffffff !important;
  width: 100% !important;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

:deep(.el-table__inner-wrapper) {
  width: 100% !important;
}

:deep(.el-table__body) {
  width: 100% !important;
}

:deep(.el-table__header) {
  width: 100% !important;
}

:deep(.el-table__header-wrapper),
:deep(.el-table__body-wrapper) {
  width: 100% !important;
}

/* 调整单元格样式 */
:deep(.el-table__cell) {
  padding: 12px 8px !important;
}

:deep(.el-table__header .cell),
:deep(.el-table__body .cell) {
  white-space: nowrap;
  padding-left: 12px !important;
  padding-right: 12px !important;
}

/* 表头样式 */
:deep(.el-table th) {
  background: #f5f7fa !important;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 600;
  color: #333333;
}

/* 表格行样式 */
:deep(.el-table tr) {
  background: #ffffff !important;
  transition: background-color 0.3s;
}

:deep(.el-table tr:hover) {
  background: #f5f7fa !important;
}

/* 表格单元格样式 */
:deep(.el-table td) {
  background: transparent !important;
  border-bottom: 1px solid #ebeef5;
}

/* 状态标签样式 */
:deep(.el-tag) {
  border: none;
  padding: 4px 8px;
}

:deep(.el-tag--success) {
  background: #e1f3d8;
  color: #67c23a;
}

:deep(.el-tag--danger) {
  background: #fde2e2;
  color: #f56c6c;
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-dialog__header) {
  padding: 20px;
  margin: 0;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
}

/* 表单样式 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input),
:deep(.el-select),
:deep(.el-date-picker) {
  width: 100%;
}

/* 按钮样式 */
:deep(.el-button) {
  border-radius: 4px;
  padding: 8px 16px;
}

:deep(.el-button--primary) {
  background: #409eff;
  border-color: #409eff;
}

:deep(.el-button--primary:hover) {
  background: #66b1ff;
  border-color: #66b1ff;
}

:deep(.el-button--default) {
  border-color: #dcdfe6;
  color: #606266;
}

:deep(.el-button--default:hover) {
  border-color: #c6e2ff;
  color: #409eff;
  background: #ecf5ff;
}

/* 添加编辑按钮样式 */
:deep(.edit-button) {
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

:deep(.edit-button:hover) {
  background-color: var(--hover-primary) !important;
  color: #ffffff !important;
  border: none;
}

:deep(.edit-button:active) {
  background-color: var(--active-primary) !important;
  color: #ffffff !important;
  border: none;
}

.filter-container {
  margin-bottom: 20px;
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 15px;
}

.filter-form :deep(.el-select) {
  width: 180px;
}

/* 表头筛选样式 */
.column-header-with-filter {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px 0;
}

.column-header-with-filter span {
  font-weight: 600;
  margin-bottom: 8px;
}

.header-filter-select {
  width: 130px;
  margin-top: 4px;
}

.header-filter-select.full-width {
  width: 100%;
  margin: 0;
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

/* 操作列表头 */
.operation-header {
  text-align: center;
  font-weight: 600;
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

/* 表单提示信息样式 */
.form-item-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  padding-top: 4px;
}

.ml-2 {
  margin-left: 8px;
}

.mr-1 {
  margin-right: 4px;
}

.display-mode-switch {
  display: inline-flex;
  align-items: center;
  margin: 0 10px;
}

.switch-label {
  margin-right: 8px;
  font-size: 14px;
  color: #606266;
}

.el-divider--vertical {
  margin: 0 12px;
  height: 1.5em;
}

/* 批次号容器样式 */
.batch-number-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-number-container .el-input {
  flex: 1;
}

/* 添加分页器样式 */
.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.warning-text {
  color: #F56C6C;
}
</style> 