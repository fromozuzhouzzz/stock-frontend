<template>
  <div class="analysis">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>物料库存分布</span>
            </div>
          </template>
          <v-chart class="chart" :option="stockDistOption" autoresize />
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>预警物料趋势</span>
              <el-select v-model="timeRange" size="small">
                <el-option label="最近7天" value="7" />
                <el-option label="最近30天" value="30" />
                <el-option label="最近90天" value="90" />
              </el-select>
            </div>
          </template>
          <v-chart class="chart" :option="warningTrendOption" autoresize />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Inventory } from '@/types'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart, LineChart } from 'echarts/charts'

use([PieChart, LineChart])

const props = defineProps<{
  inventoryData: Inventory[]
}>()

const timeRange = ref('7')

// 库存分布图表配置
const stockDistOption = computed(() => {
  const normalCount = props.inventoryData.filter(item => !item.warning).length
  const warningCount = props.inventoryData.filter(item => item.warning).length
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '20',
            fontWeight: 'bold'
          }
        },
        data: [
          { value: normalCount, name: '正常', itemStyle: { color: '#67C23A' } },
          { value: warningCount, name: '预警', itemStyle: { color: '#F56C6C' } }
        ]
      }
    ]
  }
})

// 预警趋势图表配置
const warningTrendOption = computed(() => {
  // 这里模拟数据，实际应该从后端获取
  const days = Array.from({ length: Number(timeRange.value) }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toLocaleDateString()
  }).reverse()
  
  const data = days.map(() => Math.floor(Math.random() * 5))
  
  return {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: days,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '预警物料数'
    },
    series: [
      {
        data,
        type: 'line',
        smooth: true,
        name: '预警数量',
        itemStyle: {
          color: '#F56C6C'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245,108,108,0.3)' },
              { offset: 1, color: 'rgba(245,108,108,0.1)' }
            ]
          }
        }
      }
    ]
  }
})
</script>

<style scoped>
.analysis {
  margin-bottom: 20px;
}

.chart {
  height: 300px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 