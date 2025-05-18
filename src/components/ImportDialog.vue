<template>
  <el-dialog
    v-model="visible"
    title="导入数据"
    width="500px"
  >
    <el-upload
      class="upload-demo"
      drag
      action="#"
      :auto-upload="false"
      :on-change="handleFileChange"
      accept=".xlsx,.xls,.csv"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        将文件拖到此处，或<em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          支持 .xlsx, .xls, .csv 格式文件
        </div>
      </template>
    </el-upload>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleImport" :loading="importing">
          开始导入
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'import-success', data: any[]): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const importing = ref(false)
const fileList = ref<File[]>([])

const handleFileChange = (file: any) => {
  fileList.value = [file.raw]
}

const handleImport = async () => {
  if (!fileList.value.length) {
    ElMessage.warning('请先选择文件')
    return
  }
  
  importing.value = true
  try {
    const file = fileList.value[0]
    const data = await readExcel(file)
    emit('import-success', data)
    visible.value = false
    ElMessage.success('导入成功')
  } catch (error) {
    console.error('Import failed:', error)
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
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
        const result = XLSX.utils.sheet_to_json(worksheet)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = reject
    reader.readAsBinaryString(file)
  })
}
</script> 