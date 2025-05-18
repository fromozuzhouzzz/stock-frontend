<script setup lang="ts">
import ErrorBoundary from '@/components/ErrorBoundary.vue'
</script>

<template>
  <error-boundary>
    <router-view />
  </error-boundary>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

#app {
  height: 100%;
}
</style>
