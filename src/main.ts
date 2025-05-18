import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { vPermission } from '@/directives/permission'
import PageContainer from '@/components/PageContainer.vue'

// 导入 ECharts 相关内容
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
])

const app = createApp(App)

// 全局注册 ECharts 组件
app.component('v-chart', VChart)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.component('PageContainer', PageContainer)
app.directive('permission', vPermission)

app.mount('#app')
