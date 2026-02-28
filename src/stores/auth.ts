import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Department } from '@/types'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { mockUsers, mockDepartments } from '@/data/mockData'

// Roles that have management capabilities
const MANAGEMENT_ROLES = ['Admin', 'PM'] as const

export const useAuthStore = defineStore('auth', () => {
  // State
  const currentUserId = ref<string | null>(localStorage.getItem('currentUserId'))
  const users = ref<User[]>([])
  const departments = ref<Department[]>([])
  const isLoading = ref(false)
  const isInitialized = ref(false)

  // Initialize data from Supabase or fallback to mock
  async function initialize() {
    if (isInitialized.value) return
    isLoading.value = true
    
    console.log('[v0] Initializing auth store, Supabase configured:', isSupabaseConfigured)
    
    try {
      if (isSupabaseConfigured && supabase) {
        console.log('[v0] Fetching data from Supabase...')
        // Fetch departments
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('*')
          .order('name')
        
        if (deptError) throw deptError
        
        departments.value = (deptData || []).map(d => ({
          id: d.id,
          name: d.name,
          description: d.description,
          lead: d.lead_user_id
        }))

        // Fetch users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .order('name')
        
        if (userError) throw userError
        
        users.value = (userData || []).map(u => ({
          id: u.id,
          name: u.name,
          initials: u.initials,
          role: u.role as 'PM' | 'Technician' | 'Admin',
          departmentId: u.department_id
        }))
        
        console.log('[v0] Loaded from Supabase - Users:', users.value.length, 'Departments:', departments.value.length)
      } else {
        // Fallback to mock data
        console.log('[v0] Supabase not configured, using mock data')
        users.value = mockUsers
        departments.value = mockDepartments
      }
    } catch (error) {
      console.error('[v0] Failed to initialize from Supabase, falling back to mock data:', error)
      users.value = mockUsers
      departments.value = mockDepartments
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

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
  async function createUser(userData: Omit<User, 'id'>): Promise<User | null> {
    if (!canManageUsers.value) return null
    
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('users')
          .insert({
            name: userData.name,
            initials: userData.initials,
            role: userData.role,
            department_id: userData.departmentId || null
          })
          .select()
          .single()
        
        if (error) throw error
        
        const newUser: User = {
          id: data.id,
          name: data.name,
          initials: data.initials,
          role: data.role,
          departmentId: data.department_id
        }
        users.value.push(newUser)
        return newUser
      } else {
        const newUser: User = {
          id: `user-${Date.now()}`,
          ...userData
        }
        users.value.push(newUser)
        return newUser
      }
    } catch (error) {
      console.error('[v0] Failed to create user:', error)
      return null
    }
  }

  async function updateUser(userId: string, updates: Partial<Omit<User, 'id'>>): Promise<boolean> {
    if (!canManageUsers.value) return false
    
    try {
      if (isSupabaseConfigured && supabase) {
        const dbUpdates: Record<string, unknown> = {}
        if (updates.name !== undefined) dbUpdates.name = updates.name
        if (updates.initials !== undefined) dbUpdates.initials = updates.initials
        if (updates.role !== undefined) dbUpdates.role = updates.role
        if (updates.departmentId !== undefined) dbUpdates.department_id = updates.departmentId || null
        
        const { error } = await supabase
          .from('users')
          .update(dbUpdates)
          .eq('id', userId)
        
        if (error) throw error
      }
      
      const userIndex = users.value.findIndex(u => u.id === userId)
      if (userIndex === -1) return false
      
      users.value[userIndex] = { ...users.value[userIndex], ...updates }
      return true
    } catch (error) {
      console.error('[v0] Failed to update user:', error)
      return false
    }
  }

  async function deleteUser(userId: string): Promise<boolean> {
    if (!canManageUsers.value) return false
    if (userId === currentUserId.value) return false
    
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId)
        
        if (error) throw error
      }
      
      const userIndex = users.value.findIndex(u => u.id === userId)
      if (userIndex === -1) return false
      
      users.value.splice(userIndex, 1)
      return true
    } catch (error) {
      console.error('[v0] Failed to delete user:', error)
      return false
    }
  }

  async function assignUserToDepartment(userId: string, departmentId: string | undefined): Promise<boolean> {
    return updateUser(userId, { departmentId })
  }

  // Department management functions (Admin/PM only)
  async function createDepartment(deptData: Omit<Department, 'id'>): Promise<Department | null> {
    if (!canManageUsers.value) return null
    
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('departments')
          .insert({
            name: deptData.name,
            description: deptData.description || null,
            lead_user_id: deptData.lead || null
          })
          .select()
          .single()
        
        if (error) throw error
        
        const newDept: Department = {
          id: data.id,
          name: data.name,
          description: data.description,
          lead: data.lead_user_id
        }
        departments.value.push(newDept)
        return newDept
      } else {
        const newDept: Department = {
          id: `dept-${Date.now()}`,
          ...deptData
        }
        departments.value.push(newDept)
        return newDept
      }
    } catch (error) {
      console.error('[v0] Failed to create department:', error)
      return null
    }
  }

  async function updateDepartment(deptId: string, updates: Partial<Omit<Department, 'id'>>): Promise<boolean> {
    if (!canManageUsers.value) return false
    
    try {
      if (isSupabaseConfigured && supabase) {
        const dbUpdates: Record<string, unknown> = {}
        if (updates.name !== undefined) dbUpdates.name = updates.name
        if (updates.description !== undefined) dbUpdates.description = updates.description || null
        if (updates.lead !== undefined) dbUpdates.lead_user_id = updates.lead || null
        
        const { error } = await supabase
          .from('departments')
          .update(dbUpdates)
          .eq('id', deptId)
        
        if (error) throw error
      }
      
      const deptIndex = departments.value.findIndex(d => d.id === deptId)
      if (deptIndex === -1) return false
      
      departments.value[deptIndex] = { ...departments.value[deptIndex], ...updates }
      return true
    } catch (error) {
      console.error('[v0] Failed to update department:', error)
      return false
    }
  }

  async function deleteDepartment(deptId: string): Promise<boolean> {
    if (!canManageUsers.value) return false
    
    try {
      if (isSupabaseConfigured && supabase) {
        // First unassign users from this department
        const { error: updateError } = await supabase
          .from('users')
          .update({ department_id: null })
          .eq('department_id', deptId)
        
        if (updateError) throw updateError
        
        // Then delete the department
        const { error } = await supabase
          .from('departments')
          .delete()
          .eq('id', deptId)
        
        if (error) throw error
      }
      
      // Update local state
      users.value.forEach(user => {
        if (user.departmentId === deptId) {
          user.departmentId = undefined
        }
      })
      
      const deptIndex = departments.value.findIndex(d => d.id === deptId)
      if (deptIndex === -1) return false
      
      departments.value.splice(deptIndex, 1)
      return true
    } catch (error) {
      console.error('[v0] Failed to delete department:', error)
      return false
    }
  }

  return {
    // State
    currentUserId,
    users,
    departments,
    isLoading,
    isInitialized,
    
    // Getters
    currentUser,
    isAuthenticated,
    currentUserDepartment,
    isManager,
    canAccessPMReview,
    canManageUsers,
    canManageTemplates,
    
    // Actions
    initialize,
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
    
    // Department management (Admin/PM only)
    createDepartment,
    updateDepartment,
    deleteDepartment,
  }
})
