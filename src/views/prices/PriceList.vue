<template>
  <page-container title="调拨价格管理">
    <template #actions>
      <el-button type="primary" @click="viewHistory" v-permission="'price.adjust'">
        <el-icon><Document /></el-icon>价格审核
      </el-button>
    </template>

    <el-table
      v-loading="priceStore.loading"
      :data="priceStore.prices"
      border
      style="width: 100%"
    >
      <el-table-column prop="material_name" label="物料名称" />
      <el-table-column prop="material_unit" label="单位" width="100" align="center" />
      <el-table-column label="采购价格" width="150" align="center">
        <template #default="{ row }">
          <div class="price-cell">
            {{ row.purchase_price }}元
            <el-tooltip
              v-if="row.last_purchase_price && row.last_purchase_price !== row.purchase_price"
              :content="`上一次价格: ${row.last_purchase_price}元`"
              placement="top"
            >
              <el-icon class="price-change-icon" :class="getPriceChangeClass(row.purchase_price, row.last_purchase_price)">
                <CaretTop v-if="Number(row.purchase_price) > Number(row.last_purchase_price)" />
                <CaretBottom v-else />
              </el-icon>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="调拨价格" width="150" align="center">
        <template #default="{ row }">
          <div class="price-cell">
            {{ row.transfer_price }}元
            <el-tooltip
              v-if="row.last_transfer_price && row.last_transfer_price !== row.transfer_price"
              :content="`上一次价格: ${row.last_transfer_price}元`"
              placement="top"
            >
              <el-icon class="price-change-icon" :class="getPriceChangeClass(row.transfer_price, row.last_transfer_price)">
                <CaretTop v-if="Number(row.transfer_price) > Number(row.last_transfer_price)" />
                <CaretBottom v-else />
              </el-icon>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="effective_date" label="生效日期" width="120" align="center" />
      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            @click="handleAdjust(row)"
            v-permission="'price.adjust'"
          >
            调整
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="priceStore.currentPage"
        :page-size="10"
        :total="priceStore.total"
        @current-change="handlePageChange"
        layout="total, prev, pager, next"
      />
    </div>

    <!-- 价格调整对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '调整价格' : '修改价格'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="物料" prop="material_id">
          <el-select
            v-model="form.material_id"
            placeholder="请选择物料"
            style="width: 100%"
            @change="handleMaterialChange"
          >
            <el-option
              v-for="material in materialList"
              :key="material.id"
              :label="material.name"
              :value="material.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="调整类型" prop="price_type">
          <el-select
            v-model="form.price_type"
            placeholder="请选择调整类型"
            style="width: 100%"
            @change="handlePriceTypeChange"
          >
            <el-option label="采购价格" value="purchase" />
            <el-option label="调拨价格" value="transfer" />
          </el-select>
        </el-form-item>
        <el-form-item label="原价格" prop="old_price">
          <el-input
            v-model="form.old_price"
            type="number"
            placeholder="请输入原价格"
            :disabled="true"
            readonly
          >
            <template #append>元</template>
          </el-input>
        </el-form-item>
        <el-form-item label="新价格" prop="new_price">
          <el-input
            v-model="form.new_price"
            type="number"
            placeholder="请输入新价格"
          >
            <template #append>元</template>
          </el-input>
        </el-form-item>
        <el-form-item label="生效日期" prop="effective_date">
          <el-date-picker
            v-model="form.effective_date"
            type="date"
            placeholder="请选择生效日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="调整原因" prop="reason">
          <el-input
            v-model="form.reason"
            type="textarea"
            placeholder="请输入调整原因"
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Document, CaretTop, CaretBottom } from '@element-plus/icons-vue'
import { usePriceStore } from '@/stores/price'
import type { Material } from '@/types'
import request from '@/utils/request'

const router = useRouter()
const priceStore = usePriceStore()
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const materialList = ref<Material[]>([])
const formRef = ref<FormInstance>()

const form = ref({
  material_id: undefined as number | undefined,
  price_type: undefined as 'purchase' | 'transfer' | undefined,
  old_price: undefined as number | undefined,
  new_price: undefined as number | undefined,
  reason: '',
  effective_date: ''
})

const rules = {
  material_id: [{ required: true, message: '请选择物料', trigger: 'change' }],
  price_type: [{ required: true, message: '请选择调整类型', trigger: 'change' }],
  new_price: [{ required: true, message: '请输入新价格', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }],
  effective_date: [{ required: true, message: '请选择生效日期', trigger: 'change' }]
}

// 加载物料列表
const loadMaterials = async () => {
  try {
    const res = await request.get('/api/materials/')
    materialList.value = res.data
  } catch (error) {
    console.error('获取物料列表失败:', error)
  }
}

// 处理页面变化
const handlePageChange = (page: number) => {
  priceStore.fetchPrices(page)
}

// 打开新增对话框
const handleAdd = () => {
  dialogType.value = 'add'
  form.value = {
    material_id: undefined,
    price_type: undefined,
    old_price: undefined,
    new_price: undefined,
    reason: '',
    effective_date: new Date().toISOString().split('T')[0]
  }
  dialogVisible.value = true
}

// 打开调整对话框
const handleAdjust = (row: any) => {
  dialogType.value = 'edit'
  form.value = {
    material_id: row.material_id,
    price_type: 'purchase',  // 默认选择采购价格
    old_price: Number(row.purchase_price),  // 设置当前采购价格为原价格
    new_price: undefined,
    reason: '',
    effective_date: new Date().toISOString().split('T')[0]
  }
  dialogVisible.value = true
}

// 查看历史记录
const viewHistory = () => {
  router.push('/prices/history')
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      // 格式化日期为 YYYY-MM-DD 格式
      const formattedDate = form.value.effective_date 
        ? new Date(form.value.effective_date).toISOString().split('T')[0]
        : ''

      const success = await priceStore.submitAdjustment({
        ...form.value,
        material_id: form.value.material_id!,
        price_type: form.value.price_type!,
        old_price: form.value.old_price!,
        new_price: form.value.new_price!,
        effective_date: formattedDate
      })
      
      if (success) {
        dialogVisible.value = false
        priceStore.fetchPrices()
      }
    }
  })
}

// 处理物料选择变化
const handleMaterialChange = () => {
  if (dialogType.value === 'add') {
    // 新增时才清空价格相关字段
    form.value.price_type = undefined
    form.value.old_price = undefined
    form.value.new_price = undefined
  } else {
    // 修改时自动设置价格
    const selectedMaterial = priceStore.prices.find(p => p.material_id === form.value.material_id)
    if (selectedMaterial && form.value.price_type) {
      form.value.old_price = form.value.price_type === 'purchase'
        ? Number(selectedMaterial.purchase_price)
        : Number(selectedMaterial.transfer_price)
    }
  }
}

// 处理价格类型变化
const handlePriceTypeChange = () => {
  const selectedMaterial = priceStore.prices.find(p => p.material_id === form.value.material_id)
  if (selectedMaterial && form.value.price_type) {
    // 根据选择的价格类型设置原价格
    form.value.old_price = form.value.price_type === 'purchase' 
      ? Number(selectedMaterial.purchase_price)
      : Number(selectedMaterial.transfer_price)
    // 清空新价格，让用户重新输入
    form.value.new_price = undefined
  }
}

// 获取价格变动样式
const getPriceChangeClass = (newPrice: string, oldPrice: string) => {
  const diff = Number(newPrice) - Number(oldPrice)
  return {
    'price-increase': diff > 0,
    'price-decrease': diff < 0
  }
}

onMounted(async () => {
  await Promise.all([
    priceStore.fetchPrices(),
    loadMaterials()
  ])
})
</script>

<style scoped>
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.price-cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  padding-left: 30px;  /* 添加左侧内边距 */
}

.price-change-icon {
  font-size: 14px;
  margin-left: 4px;
}

.price-increase {
  color: #f56c6c;  /* 涨价显示红色 */
}

.price-decrease {
  color: #67c23a;  /* 降价显示绿色 */
}
</style> 