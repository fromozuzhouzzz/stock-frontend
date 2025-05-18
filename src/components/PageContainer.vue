<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">{{ title }}</h2>
      <div class="page-actions">
        <slot name="actions"></slot>
      </div>
    </div>
    <div class="page-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style scoped>
.page-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  color: var(--text-primary);
}

.page-actions {
  display: flex;
  gap: 12px;
}

.page-content {
  flex: 1;
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
}
</style> 