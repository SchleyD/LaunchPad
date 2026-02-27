import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Department } from '@/types'
import { mockUsers, mockDepartments } from '@/data/mockData'

export const useAuthStore = defineStore('auth', () => {
  // State
  const currentUserId = ref<string | null>(localStorage.getItem('currentUserId'))
  const users = ref<User[]>(mockUsers)
  const departments = ref<Department[]>(mockDepartments)

  // Getters
  const currentUser = computed(() => {
    if (!currentUserId.value) return null
    return users.value.find(u => u.id === currentUserId.value) || null
  })

  const isAuthenticated = computed(() => currentUser.value !== null)

  const currentUserDepartment = computed(() => {
    if (!currentUser.value?.departmentId) return null
    return departments.value.find(d => d.id === currentUser.value?.departmentId) || null
  })

  // Actions
  function login(userId: string) {
    const user = users.value.find(u => u.id === userId)
    if (user) {
      currentUserId.value = userId
      localStorage.setItem('currentUserId', userId)
      return true
    }
    return false
  }

  function logout() {
    currentUserId.value = null
    localStorage.removeItem('currentUserId')
  }

  function getUserById(userId: string): User | undefined {
    return users.value.find(u => u.id === userId)
  }

  function getDepartmentById(departmentId: string): Department | undefined {
    return departments.value.find(d => d.id === departmentId)
  }

  function getUsersByDepartment(departmentId: string): User[] {
    return users.value.filter(u => u.departmentId === departmentId)
  }

  function getAllUsers(): User[] {
    return users.value
  }

  function getAllDepartments(): Department[] {
    return departments.value
  }

  return {
    // State
    currentUserId,
    users,
    departments,
    
    // Getters
    currentUser,
    isAuthenticated,
    currentUserDepartment,
    
    // Actions
    login,
    logout,
    getUserById,
    getDepartmentById,
    getUsersByDepartment,
    getAllUsers,
    getAllDepartments,
  }
})
