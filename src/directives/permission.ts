import type { Directive } from 'vue'
import { useUserStore } from '@/stores/user'
import { checkPermission, usePermission } from '@/hooks/usePermission'

export const permission: Directive = {
  mounted(el, binding) {
    const userStore = useUserStore()
    const hasPermission = checkPermission(userStore.currentUser, binding.value)
    
    if (!hasPermission) {
      el.parentNode?.removeChild(el)
    }
  }
}

export const vPermission: Directive = {
  mounted(el, binding) {
    const { hasPermission } = usePermission()
    if (!hasPermission(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  }
} 