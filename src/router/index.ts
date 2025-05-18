import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { checkPermission } from '@/hooks/usePermission'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue')
    },
    {
      path: '/',
      component: () => import('@/layouts/DefaultLayout.vue'),
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue')
        },
        {
          path: 'inventory',
          name: 'Inventory',
          component: () => import('@/views/Inventory.vue')
        },
        {
          path: 'materials',
          name: 'Materials',
          component: () => import('@/views/Materials.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'sales',
          name: 'Sales',
          component: () => import('@/views/Sales.vue')
        },
        {
          path: 'prices',
          name: 'Prices',
          component: () => import('@/views/prices/PriceList.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'prices/history',
          name: 'PriceHistory',
          component: () => import('@/views/prices/PriceHistory.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'dishes',
          name: 'Dishes',
          component: () => import('@/views/dishes/DishList.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'dishes/:id/recipe',
          name: 'DishRecipe',
          component: () => import('@/views/dishes/RecipeForm.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'stores',
          name: 'Stores',
          component: () => import('@/views/Stores.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('@/views/Users.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'tutorial',
          name: 'Tutorial',
          component: () => import('@/views/Tutorial.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.path !== '/login' && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.matched.some(record => record.meta.requiresAdmin)) {
    // 检查是否有系统设置权限
    if (userStore.currentUser && checkPermission(userStore.currentUser, 'settings.view')) {
      next()
    } else {
      // 无权限，重定向到首页
      next('/')
    }
  } else {
    next()
  }
})

export default router