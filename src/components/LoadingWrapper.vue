<template>
  <div class="loading-wrapper">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>
    <div v-else-if="error" class="error-container">
      <el-alert
        :title="error"
        type="error"
        show-icon
        :closable="false"
      >
        <template #default>
          <el-button type="primary" size="small" @click="handleRetry">
            重试
          </el-button>
        </template>
      </el-alert>
    </div>
    <slot v-else></slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  (e: 'retry'): void
}>()

function handleRetry() {
  emit('retry')
}
</script>

<style scoped>
.loading-wrapper {
  position: relative;
  min-height: 100px;
}

.loading-container,
.error-container {
  padding: 20px;
}
</style> 