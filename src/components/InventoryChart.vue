<template>
  <div class="chart-container">
    <v-chart class="chart" :option="option" autoresize />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { Inventory } from '@/types'

const props = defineProps<{
  data: Inventory[]
}>()

const option = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: props.data.map(item => item.store_name),
    axisLabel: {
      rotate: 45
    }
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '库存数量',
      type: 'bar',
      data: props.data.map(item => ({
        value: item.quantity,
        itemStyle: {
          color: item.warning ? '#F56C6C' : '#67C23A'
        }
      })),
      label: {
        show: true,
        position: 'top'
      }
    }
  ]
}))
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 400px;
}

.chart {
  width: 100%;
  height: 100%;
}
</style> 