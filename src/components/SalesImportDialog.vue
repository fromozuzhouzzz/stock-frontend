<template>
  <el-dialog
    v-model="visible"
    title="导入销售数据"
    width="550px"
    destroy-on-close
  >
    <el-form :model="form" label-width="120px" :rules="rules" ref="formRef">
      <el-form-item label="销售门店" prop="store_id">
        <el-select 
          v-model="form.store_id" 
          placeholder="请选择销售门店" 
          style="width: 100%"
        >
          <el-option
            v-for="store in storeList"
            :key="store.id"
            :label="store.name"
            :value="store.id"
          />
        </el-select>
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
      
      <el-form-item label="扣减库存" prop="should_deduct_inventory">
        <el-switch v-model="form.should_deduct_inventory" />
        <div class="form-tip">
          开启后，导入的销售数据将按照菜品配方扣减库存，库存不足的菜品将无法导入
        </div>
      </el-form-item>
      
      <el-form-item label="销售数据文件" prop="file">
        <el-upload
          class="upload-demo"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          accept=".xlsx,.xls"
          :limit="1"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持.xlsx、.xls格式，包含"菜品名称"和"销售数量"列的Excel文件
            </div>
          </template>
        </el-upload>
      </el-form-item>
      
      <el-form-item v-if="previewData.length" label="预览数据">
        <el-table :data="previewData.slice(0, 5)" style="width: 100%" border size="small">
          <el-table-column prop="dishName" label="菜品名称" width="180" />
          <el-table-column prop="quantity" label="销售数量" width="100" />
        </el-table>
        <div v-if="previewData.length > 5" class="preview-more">
          共 {{ previewData.length }} 条数据，显示前 5 条
        </div>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleImport" 
          :loading="importing"
          :disabled="!form.file || !form.store_id || !form.sale_date"
        >
          导入
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import type { Store } from '@/types'
import { importSalesData } from '@/api/sales'

const props = defineProps<{
  modelValue: boolean
  storeList: Store[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'import-success', count: number): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref<FormInstance>()
const importing = ref(false)
const form = reactive({
  store_id: undefined as number | undefined,
  sale_date: new Date().toISOString().split('T')[0], // 默认为当天
  file: null as File | null,
  should_deduct_inventory: true // 默认开启库存扣减
})

// 预览数据
interface PreviewItem {
  dishName: string
  quantity: number
}

const previewData = ref<PreviewItem[]>([])
const fileData = ref<any[]>([])

const rules = {
  store_id: [
    { required: true, message: '请选择销售门店', trigger: 'change' }
  ],
  sale_date: [
    { required: true, message: '请选择销售日期', trigger: 'change' }
  ],
  file: [
    { required: true, message: '请上传Excel文件', trigger: 'change' }
  ]
}

const handleFileChange = (file: any) => {
  // 确保只有一个文件
  form.file = file.raw
  
  // 如果有文件，进行预览
  if (form.file) {
    previewExcelData(form.file)
  } else {
    previewData.value = []
    fileData.value = []
  }
}

const previewExcelData = async (file: File) => {
  try {
    const data = await readExcel(file)
    fileData.value = data
    
    // 处理预览数据
    const preview: PreviewItem[] = []
    for (const item of data) {
      // 检查是否包含必要的列
      const dishName = item['菜品名称'] || item['品名'] || item['名称']
      const quantity = item['销售数量'] || item['数量'] || item['销量']
      
      // 过滤掉"合计"、"总计"等统计行
      const nameStr = String(dishName || '').trim()
      if (nameStr === '合计' || nameStr === '总计' || nameStr === '小计') {
        continue
      }
      
      if (dishName && quantity !== undefined) {
        preview.push({
          dishName: String(dishName),
          quantity: Number(quantity)
        })
      }
    }
    
    previewData.value = preview
    
    if (preview.length === 0) {
      ElMessage.warning('无法从Excel文件中找到有效的菜品销售数据，请确保Excel包含"菜品名称"和"销售数量"列（无论在哪一行）')
    } else {
      ElMessage.success(`成功识别${preview.length}条销售数据`)
    }
  } catch (error) {
    console.error('预览数据失败:', error)
    ElMessage.error('预览数据失败，请检查文件格式')
    previewData.value = []
    fileData.value = []
  }
}

interface ExcelRow extends Array<any> {
  length: number;
  [index: number]: any;
}

const readExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // 使用类型断言，确保TypeScript能够正确识别数组类型
        const rawData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as ExcelRow[]
        
        // 寻找包含表头的行（包含"菜品名称"和"销售数量"的行）
        let headerRowIndex = -1
        let nameColumnIndex = -1
        let quantityColumnIndex = -1
        
        // 遍历前10行寻找表头（通常表头不会太靠后）
        for (let i = 0; i < Math.min(10, rawData.length); i++) {
          const row = rawData[i]
          for (let j = 0; j < row.length; j++) {
            const cell = String(row[j] || '').trim()
            if (cell === '菜品名称' || cell === '品名' || cell === '名称') {
              nameColumnIndex = j
            }
            if (cell === '销售数量' || cell === '数量' || cell === '销量') {
              quantityColumnIndex = j
            }
          }
          
          // 如果在此行找到了两个必要的列，标记为表头行
          if (nameColumnIndex !== -1 && quantityColumnIndex !== -1) {
            headerRowIndex = i
            break
          }
          // 重置索引，继续查找下一行
          nameColumnIndex = -1
          quantityColumnIndex = -1
        }
        
        // 如果找到了表头行
        if (headerRowIndex !== -1 && nameColumnIndex !== -1 && quantityColumnIndex !== -1) {
          // 组装结果数据
          const result = []
          // 从表头的下一行开始处理数据
          for (let i = headerRowIndex + 1; i < rawData.length; i++) {
            const row = rawData[i]
            // 确保数据行长度足够
            if (row.length > Math.max(nameColumnIndex, quantityColumnIndex)) {
              const dishName = row[nameColumnIndex]
              const quantity = row[quantityColumnIndex]
              
              // 跳过空行或没有必要数据的行
              if (dishName && quantity) {
                // 跳过"合计"行
                const nameStr = String(dishName || '').trim()
                if (nameStr === '合计' || nameStr === '总计' || nameStr === '小计') {
                  continue
                }
                
                result.push({
                  '菜品名称': dishName,
                  '销售数量': quantity
                })
              }
            }
          }
          resolve(result)
        } else {
          // 使用默认方式解析，防止其他格式的Excel文件无法导入
          const defaultResult = XLSX.utils.sheet_to_json(worksheet)
          resolve(defaultResult)
        }
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = reject
    reader.readAsBinaryString(file)
  })
}

const handleImport = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid && form.store_id && form.sale_date) {
      if (previewData.value.length === 0) {
        ElMessage.warning('没有可导入的数据')
        return
      }
      
      importing.value = true
      try {
        // 准备导入数据
        const importData = {
          store_id: form.store_id,
          sale_date: form.sale_date,
          sales_items: previewData.value.map(item => ({
            dish_name: item.dishName,
            quantity: item.quantity
          })),
          should_deduct_inventory: form.should_deduct_inventory // 添加是否扣减库存选项
        }
        
        // 发送请求
        console.log('发送导入请求数据:', importData)
        try {
          const response = await importSalesData(importData)
          console.log('导入请求响应:', response)
          
          // 修改: 正确处理响应数据类型
          // 由于request.ts拦截器可能处理不一致，所以做兼容处理
          const responseData = 'data' in response ? response.data : response
          
          // 确保响应数据正确
          if (responseData && responseData.success) {
            const deductMsg = form.should_deduct_inventory ? '并扣减相应库存' : '';
            ElMessage.success(`导入成功，共导入${responseData.imported_count}条销售记录${deductMsg}`)
            emit('import-success', responseData.imported_count)
            visible.value = false
            resetForm()
          } else {
            console.error('导入失败，响应不符合预期:', responseData)
            ElMessage.error(responseData?.message || '导入失败')
          }
        } catch (apiError: any) {
          // 处理API错误
          console.error('API调用错误:', apiError)
          
          // 特殊情况处理：如果是500错误但实际上导入成功
          if (apiError.response?.status === 500) {
            // 尝试通过错误信息判断是否实际导入成功
            if (apiError.response?.data?.message && apiError.response.data.message.includes('成功导入')) {
              const deductMsg = form.should_deduct_inventory ? '并扣减相应库存' : '';
              // 从错误消息中提取成功导入的数量
              const importedCount = parseInt(apiError.response.data.message.match(/成功导入(\d+)条/)?.[1] || '0');
              ElMessage.success(`导入成功，共导入${importedCount}条销售记录${deductMsg}`)
              emit('import-success', importedCount)
              visible.value = false
              resetForm()
              return;
            }
          }
          
          const errorMsg = apiError.response?.data?.message || '导入失败，请稍后重试'
          ElMessage.error(errorMsg)
        }
      } catch (error: any) {
        console.error('导入处理异常:', error)
        console.error('错误详情:', error.response?.data)
        ElMessage.error('导入处理异常，请稍后重试')
      } finally {
        importing.value = false
      }
    }
  })
}

const cancel = () => {
  visible.value = false
  resetForm()
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  
  form.file = null
  previewData.value = []
  fileData.value = []
}
</script>

<style scoped>
.upload-demo {
  width: 100%;
}

.preview-more {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
  text-align: right;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.4;
}
</style> 