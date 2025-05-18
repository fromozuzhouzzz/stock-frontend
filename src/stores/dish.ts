import { defineStore } from 'pinia'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import type { Dish, DishRecipe } from '@/types'

// 定义API响应接口
interface DishListResponse {
  data: Dish[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

interface DishState {
  loading: boolean
  dishes: Dish[]
  currentRecipe: DishRecipe | null
  total: number
  currentPage: number
  pageSize: number
}

export const useDishStore = defineStore('dish', {
  state: (): DishState => ({
    loading: false,
    dishes: [],
    currentRecipe: null,
    total: 0,
    currentPage: 1,
    pageSize: 10
  }),

  actions: {
    async fetchDishes(page = 1, pageSize?: number) {
      this.loading = true
      try {
        console.log('Fetching dishes, page:', page, 'pageSize:', pageSize)
        const response = await request.get('/api/dishes/', {
          params: { 
            page, 
            per_page: pageSize || this.pageSize 
          }
        }) as DishListResponse
        
        console.log('API Response:', response)
        
        if (response && typeof response === 'object') {
          if ('data' in response && Array.isArray(response.data)) {
            this.dishes = response.data
            this.total = response.total || 0
            this.currentPage = page
            if (pageSize) {
              this.pageSize = pageSize
            }
          } else {
            throw new Error('Invalid response format')
          }
        } else {
          throw new Error('Invalid response format')
        }
        
        console.log('Updated store state:', {
          dishes: this.dishes,
          total: this.total,
          currentPage: this.currentPage,
          pageSize: this.pageSize
        })
      } catch (error) {
        console.error('获取菜品列表失败:', error)
        ElMessage.error('获取菜品列表失败')
        this.dishes = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },

    async createDish(data: Partial<Dish>) {
      try {
        const res = await request.post('/api/dishes/', data)
        const responseData = res.data || res
        if (responseData && responseData.id) {
          await this.fetchDishes(this.currentPage)
          return responseData.id
        }
        return false
      } catch (error) {
        console.error('创建菜品失败:', error)
        ElMessage.error('创建菜品失败')
        return false
      }
    },

    async updateDish(id: number, data: Partial<Dish>) {
      try {
        await request.put(`/api/dishes/${id}/`, data)
        ElMessage.success('菜品更新成功')
        return true
      } catch (error) {
        console.error('更新菜品失败:', error)
        return false
      }
    },

    async fetchRecipe(dishId: number) {
      this.loading = true
      try {
        const res = await request.get(`/api/dishes/${dishId}/recipes/`)
        const recipeData = res.data || res
        
        if (recipeData && typeof recipeData === 'object' && 
            'dish_id' in recipeData && 'materials' in recipeData) {
          this.currentRecipe = recipeData as DishRecipe
        } else {
          console.error('获取的配方数据格式不正确:', recipeData)
          this.currentRecipe = null
        }
      } catch (error) {
        console.error('获取配方失败:', error)
        ElMessage.error('获取配方失败')
        this.currentRecipe = null
      } finally {
        this.loading = false
      }
    },

    async saveRecipe(dishId: number, data: Partial<DishRecipe>) {
      try {
        console.log('Saving recipe:', data)
        await request.post(`/api/dishes/${dishId}/recipes/`, data)
        console.log('Recipe saved successfully')
        return true
      } catch (error) {
        console.error('保存配方失败:', error)
        ElMessage.error('保存配方失败')
        return false
      }
    },

    async deleteDish(id: number) {
      try {
        await request.delete(`/api/dishes/${id}/`)
        await this.fetchDishes(this.currentPage)
        return true
      } catch (error) {
        console.error('删除菜品失败:', error)
        ElMessage.error('删除菜品失败')
        return false
      }
    }
  }
}) 