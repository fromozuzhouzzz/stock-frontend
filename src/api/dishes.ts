import request from '@/utils/request'
import type { Dish, DishRecipe } from '@/types'

export function getDishList() {
  return request.get<{ data: Dish[]; total: number; page: number; per_page: number }>('/api/dishes/')
}

export function getDishById(id: number) {
  return request.get<Dish>(`/api/dishes/${id}/`)
}

export function createDish(data: Partial<Dish>) {
  return request.post<{ id: number; message: string }>('/api/dishes/', data)
}

export function updateDish(id: number, data: Partial<Dish>) {
  return request.put<{ message: string }>(`/api/dishes/${id}/`, data)
}

export function deleteDish(id: number) {
  return request.delete<{ message: string }>(`/api/dishes/${id}/`)
}

export function getDishRecipe(id: number) {
  return request.get<DishRecipe>(`/api/dishes/${id}/recipes/`)
}

export function saveDishRecipe(id: number, data: Partial<DishRecipe>) {
  return request.post<{ message: string; recipe_id: number }>(`/api/dishes/${id}/recipes/`, data)
} 