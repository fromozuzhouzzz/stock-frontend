<template>
  <page-container title="系统使用教程">
    <div class="tutorial-container">
      <el-tabs type="border-card">
        <el-tab-pane label="系统概述">
          <div class="section">
            <h3>小汪有料进销存管理系统</h3>
            <p>本系统是一个专业的餐饮行业进销存管理系统，帮助您高效管理物料、库存、加工和销售全流程。</p>

            <div class="overview-cards">
              <el-card class="overview-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><Setting /></el-icon>
                    <span>系统设置</span>
                  </div>
                </template>
                <p>配置门店、账号、物料和菜品等基础信息</p>
              </el-card>

              <el-card class="overview-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><Box /></el-icon>
                    <span>库存管理</span>
                  </div>
                </template>
                <p>管理物料入库、加工、调拨和出库</p>
              </el-card>

              <el-card class="overview-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><ShoppingCart /></el-icon>
                    <span>销售管理</span>
                  </div>
                </template>
                <p>记录销售数据，自动扣减库存</p>
              </el-card>

              <el-card class="overview-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><DataLine /></el-icon>
                    <span>数据分析</span>
                  </div>
                </template>
                <p>查看销售统计和库存预警</p>
              </el-card>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="使用流程">
          <div class="section">
            <h3>系统使用流程图</h3>
            <div class="flow-chart-container">
              <v-chart ref="chartRef" class="flow-chart" :option="flowChartOption" autoresize />
            </div>

            <div class="flow-steps">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h4>基础设置</h4>
                  <p>在开始使用系统前，需要先完成以下基础设置：</p>
                  <ul>
                    <li>创建门店信息</li>
                    <li>添加用户账号并分配权限</li>
                    <li>添加物料信息（包括原料和加工后物料）</li>
                    <li>创建菜品并设置配方</li>
                  </ul>
                </div>
              </div>

              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h4>物料入库</h4>
                  <p>通过库存管理模块，将采购的物料入库到总库房：</p>
                  <ul>
                    <li>选择物料和门店（总库房）</li>
                    <li>填写入库数量、批次号、单价等信息</li>
                    <li>提交入库单</li>
                  </ul>
                </div>
              </div>

              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h4>物料加工</h4>
                  <p>将原料加工成可用于销售的成品：</p>
                  <ul>
                    <li>在库存管理中选择需要加工的原料</li>
                    <li>输入加工数量</li>
                    <li>系统会根据转换比例自动计算加工后的成品数量</li>
                    <li>加工后的物料会存入同一门店的库存中</li>
                  </ul>
                  <p class="note">注意：只有加工后的物料才能用于销售或调拨到门店</p>
                </div>
              </div>

              <div class="step">
                <div class="step-number">4</div>
                <div class="step-content">
                  <h4>物料调拨</h4>
                  <p>将加工后的物料从总库房调拨到各门店：</p>
                  <ul>
                    <li>选择源门店（总库房）和目标门店</li>
                    <li>选择需要调拨的物料（必须是加工后的物料）</li>
                    <li>填写调拨数量</li>
                    <li>提交调拨单</li>
                  </ul>
                </div>
              </div>

              <div class="step">
                <div class="step-number">5</div>
                <div class="step-content">
                  <h4>销售管理</h4>
                  <p>记录门店的销售数据：</p>
                  <ul>
                    <li>选择门店和销售的菜品</li>
                    <li>填写销售数量和日期</li>
                    <li>系统会根据菜品配方自动扣减相应的加工后物料库存</li>
                  </ul>
                </div>
              </div>

              <div class="step">
                <div class="step-number">6</div>
                <div class="step-content">
                  <h4>数据分析</h4>
                  <p>在仪表盘查看系统数据：</p>
                  <ul>
                    <li>查看库存预警信息</li>
                    <li>查看销售统计数据（按天/周/月）</li>
                    <li>导出预警数据和销售报表</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="功能详解">
          <el-collapse accordion>
            <el-collapse-item title="门店管理" name="1">
              <div class="feature-detail">
                <h4>门店管理</h4>
                <p>在系统设置中，您可以添加、编辑和管理所有门店信息。</p>
                <p>路径：系统设置 > 门店管理</p>
                <div class="feature-steps">
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>添加新门店：点击"新增门店"按钮，填写门店名称和地址信息</div>
                  </div>
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>编辑门店：点击门店列表中的"编辑"按钮修改门店信息</div>
                  </div>
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>删除门店：点击门店列表中的"删除"按钮（注意：已有库存的门店无法删除）</div>
                  </div>
                </div>
                <p class="note">注意：系统中必须至少有一个门店作为总库房，用于物料入库和加工</p>
              </div>
            </el-collapse-item>

            <el-collapse-item title="用户管理" name="2">
              <div class="feature-detail">
                <h4>用户管理</h4>
                <p>管理系统用户账号和权限。</p>
                <p>路径：系统设置 > 用户管理</p>
                <div class="feature-steps">
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>添加用户：点击"新增用户"按钮，填写用户信息和分配权限</div>
                  </div>
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>编辑用户：修改用户信息或调整权限</div>
                  </div>
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>重置密码：为用户重置登录密码</div>
                  </div>
                </div>
                <p class="note">用户角色说明：</p>
                <ul>
                  <li>管理员：拥有所有权限</li>
                  <li>门店经理：只能管理指定门店的库存和销售</li>
                  <li>采购员：负责物料入库和调拨</li>
                </ul>
              </div>
            </el-collapse-item>

            <el-collapse-item title="物料管理" name="3">
              <div class="feature-detail">
                <h4>物料管理</h4>
                <p>添加和管理系统中的物料信息。</p>
                <p>路径：系统设置 > 物料管理</p>
                <div class="feature-steps">
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>添加物料：点击"新增物料"按钮，填写物料基本信息</div>
                  </div>
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>设置加工信息：填写加工后物料名称、单位、转换比例和预警阈值</div>
                  </div>
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>管理物料分类：点击"管理分类"按钮添加或编辑物料分类</div>
                  </div>
                </div>
                <p class="note">重要提示：必须为需要加工的物料设置加工信息，包括加工后名称、单位和转换比例</p>
              </div>
            </el-collapse-item>

            <el-collapse-item title="菜品管理" name="4">
              <div class="feature-detail">
                <h4>菜品管理</h4>
                <p>创建菜品并设置配方。</p>
                <p>路径：系统设置 > 菜品管理</p>
                <div class="feature-steps">
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>添加菜品：点击"新增菜品"按钮，填写菜品名称、价格等信息</div>
                  </div>
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>设置配方：点击"配方"按钮，添加菜品所需的加工后物料及用量</div>
                  </div>
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>设置损耗率：为每种物料设置损耗率，系统会在销售时自动计算实际消耗量</div>
                  </div>
                </div>
                <p class="note">注意：菜品配方中只能使用加工后的物料，请确保先在物料管理中设置好加工信息</p>
              </div>
            </el-collapse-item>

            <el-collapse-item title="库存管理" name="5">
              <div class="feature-detail">
                <h4>库存管理</h4>
                <p>管理物料的入库、加工、调拨和出库。</p>
                <p>路径：库存管理</p>
                <div class="feature-steps">
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>物料入库：点击"入库"按钮，选择物料和门店，填写入库信息</div>
                  </div>
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>物料加工：选择原料，点击"加工"按钮，输入加工数量</div>
                  </div>
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>物料调拨：选择源门店和目标门店，选择物料，填写调拨数量</div>
                  </div>
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>物料出库：选择源门店，将目标门店设为"出库"，填写出库数量</div>
                  </div>
                </div>
                <p class="note">重要流程：原料入库 → 加工成成品 → 调拨到门店 → 用于销售</p>
              </div>
            </el-collapse-item>

            <el-collapse-item title="销售管理" name="6">
              <div class="feature-detail">
                <h4>销售管理</h4>
                <p>记录销售数据并自动扣减库存。</p>
                <p>路径：销售管理</p>
                <div class="feature-steps">
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>添加销售记录：选择门店、菜品和销售日期，填写销售数量</div>
                  </div>
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>查看销售历史：浏览历史销售记录，可按门店和日期筛选</div>
                  </div>
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>导出销售数据：将销售数据导出为Excel文件</div>
                  </div>
                </div>
                <p class="note">注意：系统会根据菜品配方自动扣减门店中的加工后物料库存</p>
              </div>
            </el-collapse-item>

            <el-collapse-item title="仪表盘" name="7">
              <div class="feature-detail">
                <h4>仪表盘</h4>
                <p>查看系统数据统计和预警信息。</p>
                <p>路径：仪表盘</p>
                <div class="feature-steps">
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>库存预警：查看低于预警阈值的物料列表</div>
                  </div>
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>销售统计：查看按天/周/月的销售数据统计</div>
                  </div>
                  <div class="feature-step">
                    <div class="step-dot"></div>
                    <div>数据导出：导出预警数据和销售统计</div>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-tab-pane>
      </el-tabs>
    </div>
  </page-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Setting, Box, ShoppingCart, DataLine } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { GraphChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent
} from 'echarts/components'

// 注册需要的组件
use([
  GraphChart,
  TitleComponent,
  TooltipComponent,
  GridComponent
])

// 图表实例引用
const chartRef = ref()

// 组件挂载后初始化图表
onMounted(() => {
  // 给图表一点时间渲染
  setTimeout(() => {
    if (chartRef.value) {
      chartRef.value.resize()
    }
  }, 300)
})

// 流程图配置
const flowChartOption = {
  tooltip: {
    trigger: 'item',
    formatter: '{b}'
  },
  grid: {
    top: 10,
    bottom: 10
  },
  series: [
    {
      type: 'graph',
      layout: 'none',
      symbolSize: 60,
      roam: false,
      label: {
        show: true,
        position: 'inside',
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold'
      },
      edgeSymbol: ['none', 'arrow'],
      edgeSymbolSize: [0, 10],
      edgeLabel: {
        fontSize: 12
      },
      data: [
        {
          name: '基础设置',
          x: 300,
          y: 100,
          itemStyle: {
            color: '#91cc75'
          }
        },
        {
          name: '物料入库',
          x: 300,
          y: 180,
          itemStyle: {
            color: '#5470c6'
          }
        },
        {
          name: '物料加工',
          x: 300,
          y: 260,
          itemStyle: {
            color: '#5470c6'
          }
        },
        {
          name: '物料调拨',
          x: 300,
          y: 340,
          itemStyle: {
            color: '#5470c6'
          }
        },
        {
          name: '销售管理',
          x: 300,
          y: 420,
          itemStyle: {
            color: '#ee6666'
          }
        },
        {
          name: '数据分析',
          x: 300,
          y: 500,
          itemStyle: {
            color: '#73c0de'
          }
        }
      ],
      links: [
        {
          source: '基础设置',
          target: '物料入库',
          lineStyle: {
            width: 2
          }
        },
        {
          source: '物料入库',
          target: '物料加工',
          lineStyle: {
            width: 2
          }
        },
        {
          source: '物料加工',
          target: '物料调拨',
          lineStyle: {
            width: 2
          }
        },
        {
          source: '物料调拨',
          target: '销售管理',
          lineStyle: {
            width: 2
          }
        },
        {
          source: '销售管理',
          target: '数据分析',
          lineStyle: {
            width: 2
          }
        }
      ],
      lineStyle: {
        opacity: 0.9,
        width: 2,
        curveness: 0
      }
    }
  ]
}
</script>

<style scoped>
.tutorial-container {
  width: 100%;
}

.section {
  margin-bottom: 30px;
}

.section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.overview-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

.overview-card {
  width: calc(25% - 15px);
  min-width: 200px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flow-chart-container {
  width: 100%;
  height: 450px;
  margin: 20px 0;
  border: 1px solid #eee;
  border-radius: 4px;
}

.flow-chart {
  width: 100%;
  height: 100%;
}

.flow-steps {
  margin-top: 30px;
}

.step {
  display: flex;
  margin-bottom: 30px;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  margin-right: 20px;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: var(--el-color-primary);
}

.note {
  background-color: #f8f8f8;
  padding: 10px;
  border-left: 4px solid var(--el-color-warning);
  margin: 15px 0;
  font-size: 14px;
}

.feature-detail {
  padding: 10px;
}

.feature-detail h4 {
  margin-top: 0;
  color: var(--el-color-primary);
}

.feature-steps {
  margin: 15px 0;
}

.feature-step {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
}

.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
  margin-right: 10px;
  margin-top: 5px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .overview-card {
    width: 100%;
  }

  .step {
    flex-direction: column;
  }

  .step-number {
    margin-bottom: 10px;
  }
}
</style>
