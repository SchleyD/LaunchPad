import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Department } from '@/types'
import { mockUsers, mockDepartments } from '@/data/mockData'

// Roles that have management capabilities
const MANAGEMENT_ROLES = ['Admin', 'PM'] as const

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

  // Role-based permissions
  const isManager = computed(() => {
    if (!currentUser.value) return false
    return MANAGEMENT_ROLES.includes(currentUser.value.role as typeof MANAGEMENT_ROLES[number])
  })

  const canAccessPMReview = computed(() => isManager.value)
  
  const canManageUsers = computed(() => isManager.value)
  
  const canManageTemplates = computed(() => isManager.value)

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

  // User management functions (Admin/PM only)
  function createUser(userData: Omit<User, 'id'>): User | null {
    if (!canManageUsers.value) return null
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      ...userData
    }
    users.value.push(newUser)
    return newUser
  }

  function updateUser(userId: string, updates: Partial<Omit<User, 'id'>>): boolean {
    if (!canManageUsers.value) return false
    
    const userIndex = users.value.findIndex(u => u.id === userId)
    if (userIndex === -1) return false
    
    users.value[userIndex] = { ...users.value[userIndex], ...updates }
    return true
  }

  function deleteUser(userId: string): boolean {
    if (!canManageUsers.value) return false
    if (userId === currentUserId.value) return false // Can't delete yourself
    
    const userIndex = users.value.findIndex(u => u.id === userId)
    if (userIndex === -1) return false
    
    users.value.splice(userIndex, 1)
    return true
  }

  function assignUserToDepartment(userId: string, departmentId: string | undefined): boolean {
    if (!canManageUsers.value) return false
    
    const user = users.value.find(u => u.id === userId)
    if (!user) return false
    
    user.departmentId = departmentId
    return true
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
    isManager,
    canAccessPMReview,
    canManageUsers,
    canManageTemplates,
    
    // Actions
    login,
    logout,
    getUserById,
    getDepartmentById,
    getUsersByDepartment,
    getAllUsers,
    getAllDepartments,
    
    // User management (Admin/PM only)
    createUser,
    updateUser,
    deleteUser,
    assignUserToDepartment,
  }
})
