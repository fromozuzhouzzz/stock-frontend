<template>
  <div v-if="error" class="error-boundary">
    <el-alert
      :title="error.message"
      type="error"
      :description="error.stack"
      show-icon
      :closable="false"
    >
      <template #default>
        <el-button type="primary" @click="handleReset">
          重试
        </el-button>
      </template>
    </el-alert>
  </div>
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const error = ref<Error | null>(null)

onErrorCaptured((err: Error) => {
  error.value = err
  return false
})

function handleReset() {
  error.value = null
  window.location.reload()
}
</script>

<style scoped>
.error-boundary {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style> 