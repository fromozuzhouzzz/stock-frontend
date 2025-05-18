<template>
  <page-container title="价格调整历史">
    <template #actions>
      <el-button @click="$router.push('/prices')">
        <el-icon><Back /></el-icon>返回
      </el-button>
    </template>

    <el-table
      v-loading="priceStore.loading"
      :data="priceStore.history"
      border
      style="width: 100%"
    >
      <el-table-column prop="material_name" label="物料名称" />
      <el-table-column prop="material_unit" label="单位" width="80" align="center" />
      <el-table-column label="调整类型" width="100" align="center">
        <template #default="{ row }">
          {{ row.price_type === 'purchase' ? '采购价' : '调拨价' }}
        </template>
      </el-table-column>
      <el-table-column label="原价格" width="100" align="right">
        <template #default="{ row }">
          {{ row.old_price }}元
        </template>
      </el-table-column>
      <el-table-column label="新价格" width="100" align="right">
        <template #default="{ row }">
          {{ row.new_price }}元
        </template>
      </el-table-column>
      <el-table-column prop="reason" label="调整原因" show-overflow-tooltip />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :type="getStatusType(row.status)"
            size="small"
          >
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="effective_date" label="生效日期" width="100" align="center" />
      <el-table-column prop="created_at" label="申请时间" width="160" align="center" />
      <el-table-column label="操作" width="120" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'pending' && hasPermission('price.approve')"
            type="primary"
            link
            @click="handleApprove(row)"
          >
            审核
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

    <!-- 审核对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="价格调整审核"
      width="400px"
    >
      <div class="approval-info">
        <p>物料：{{ currentRow?.material_name }}</p>
        <p>调整类型：{{ currentRow?.price_type === 'purchase' ? '采购价' : '调拨价' }}</p>
        <p>原价格：{{ currentRow?.old_price }}元</p>
        <p>新价格：{{ currentRow?.new_price }}元</p>
        <p>调整原因：{{ currentRow?.reason }}</p>
        <p>生效日期：{{ currentRow?.effective_date }}</p>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleApproveAction('reject')">拒绝</el-button>
        <el-button type="primary" @click="handleApproveAction('approve')">通过</el-button>
      </template>
    </el-dialog>
  </page-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Back } from '@element-plus/icons-vue'
import { usePriceStore } from '@/stores/price'
import { usePermission } from '@/hooks/usePermission'
import type { PriceAdjustment } from '@/types'

const route = useRoute()
const priceStore = usePriceStore()
const { hasPermission } = usePermission()
const dialogVisible = ref(false)
const currentRow = ref<PriceAdjustment>()

// 获取状态类型
const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return texts[status] || status
}

// 处理页面变化
const handlePageChange = (page: number) => {
  priceStore.fetchHistory(page)
}

// 打开审核对话框
const handleApprove = (row: PriceAdjustment) => {
  currentRow.value = row
  dialogVisible.value = true
}

// 处理审核操作
const handleApproveAction = async (action: 'approve' | 'reject') => {
  if (!currentRow.value) return
  
  const success = await priceStore.approveAdjustment(
    currentRow.value.id, 
    action === 'approve' ? 'approved' : 'rejected'
  )
  if (success) {
    dialogVisible.value = false
    priceStore.fetchHistory()
  }
}

onMounted(() => {
  const materialId = route.query.material_id
  // TODO: 如果有 materialId，可以添加过滤功能
  priceStore.fetchHistory()
})
</script>

<style scoped>
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.approval-info {
  padding: 0 20px;
}

.approval-info p {
  margin: 10px 0;
  line-height: 1.5;
}
</style> 