<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { User, Department } from '@/types'

const authStore = useAuthStore()

// Tab state
const activeTab = ref<'users' | 'departments'>('users')

// User Modal state
const showModal = ref(false)
const isEditing = ref(false)
const editingUser = ref<User | null>(null)

// Department Modal state
const showDeptModal = ref(false)
const isEditingDept = ref(false)
const editingDept = ref<Department | null>(null)

// User Form state
const formData = ref({
  name: '',
  initials: '',
  role: 'Technician' as 'PM' | 'Technician' | 'Admin',
  departmentId: undefined as string | undefined
})

// Department Form state
const deptFormData = ref({
  name: '',
  description: '',
  lead: undefined as string | undefined
})

// Computed
const allUsers = computed(() => authStore.getAllUsers())
const allDepartments = computed(() => authStore.getAllDepartments())

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'Admin':
      return 'bg-amber-100 text-amber-700'
    case 'PM':
      return 'bg-primary-100 text-primary-700'
    default:
      return 'bg-emerald-100 text-emerald-700'
  }
}

function openCreateModal() {
  isEditing.value = false
  editingUser.value = null
  formData.value = {
    name: '',
    initials: '',
    role: 'Technician',
    departmentId: undefined
  }
  showModal.value = true
}

function openEditModal(user: User) {
  isEditing.value = true
  editingUser.value = user
  formData.value = {
    name: user.name,
    initials: user.initials,
    role: user.role,
    departmentId: user.departmentId
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingUser.value = null
}

function saveUser() {
  if (isEditing.value && editingUser.value) {
    authStore.updateUser(editingUser.value.id, {
      name: formData.value.name,
      initials: formData.value.initials,
      role: formData.value.role,
      departmentId: formData.value.departmentId
    })
  } else {
    authStore.createUser({
      name: formData.value.name,
      initials: formData.value.initials,
      role: formData.value.role,
      departmentId: formData.value.departmentId
    })
  }
  closeModal()
}

function confirmDelete(user: User) {
  if (user.id === authStore.currentUser?.id) {
    alert('You cannot delete your own account.')
    return
  }
  if (confirm(`Are you sure you want to delete ${user.name}?`)) {
    authStore.deleteUser(user.id)
  }
}

// Generate initials from name
function generateInitials() {
  const parts = formData.value.name.trim().split(' ')
  if (parts.length >= 2) {
    formData.value.initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  } else if (parts.length === 1 && parts[0].length >= 2) {
    formData.value.initials = parts[0].substring(0, 2).toUpperCase()
  }
}

// Department management functions
function openCreateDeptModal() {
  isEditingDept.value = false
  editingDept.value = null
  deptFormData.value = {
    name: '',
    description: '',
    lead: undefined
  }
  showDeptModal.value = true
}

function openEditDeptModal(dept: Department) {
  isEditingDept.value = true
  editingDept.value = dept
  deptFormData.value = {
    name: dept.name,
    description: dept.description || '',
    lead: dept.lead
  }
  showDeptModal.value = true
}

function closeDeptModal() {
  showDeptModal.value = false
  editingDept.value = null
}

function saveDepartment() {
  if (isEditingDept.value && editingDept.value) {
    authStore.updateDepartment(editingDept.value.id, {
      name: deptFormData.value.name,
      description: deptFormData.value.description || undefined,
      lead: deptFormData.value.lead
    })
  } else {
    authStore.createDepartment({
      name: deptFormData.value.name,
      description: deptFormData.value.description || undefined,
      lead: deptFormData.value.lead
    })
  }
  closeDeptModal()
}

function confirmDeleteDept(dept: Department) {
  const usersInDept = allUsers.value.filter(u => u.departmentId === dept.id).length
  const message = usersInDept > 0 
    ? `Are you sure you want to delete "${dept.name}"? ${usersInDept} user(s) will be unassigned from this department.`
    : `Are you sure you want to delete "${dept.name}"?`
  
  if (confirm(message)) {
    authStore.deleteDepartment(dept.id)
  }
}

function getUserName(userId: string | undefined): string {
  if (!userId) return 'None'
  const user = authStore.getUserById(userId)
  return user?.name || 'Unknown'
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-surface-900">Team Management</h1>
        <p class="text-sm text-surface-500 mt-1">Manage team members and departments</p>
      </div>
      <button 
        v-if="activeTab === 'users'"
        @click="openCreateModal"
        class="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add User
      </button>
      <button 
        v-else
        @click="openCreateDeptModal"
        class="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Department
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 bg-surface-100 p-1 rounded-lg w-fit">
      <button 
        @click="activeTab = 'users'"
        :class="[
          'px-4 py-2 text-sm font-medium rounded-md transition-colors',
          activeTab === 'users' 
            ? 'bg-white text-surface-900 shadow-sm' 
            : 'text-surface-600 hover:text-surface-900'
        ]"
      >
        Users
      </button>
      <button 
        @click="activeTab = 'departments'"
        :class="[
          'px-4 py-2 text-sm font-medium rounded-md transition-colors',
          activeTab === 'departments' 
            ? 'bg-white text-surface-900 shadow-sm' 
            : 'text-surface-600 hover:text-surface-900'
        ]"
      >
        Departments
      </button>
    </div>

    <!-- Users Tab -->
    <div v-if="activeTab === 'users'" class="space-y-6">
      <!-- Unassigned Users -->
      <div v-if="allUsers.filter(u => !u.departmentId).length > 0" class="bg-white rounded-xl border border-surface-200">
        <div class="px-4 py-3 border-b border-surface-100">
          <h2 class="font-medium text-surface-900">Unassigned</h2>
        </div>
        <div class="divide-y divide-surface-100">
          <div 
            v-for="user in allUsers.filter(u => !u.departmentId)" 
            :key="user.id"
            class="px-4 py-3 flex items-center justify-between hover:bg-surface-50"
          >
            <div class="flex items-center gap-3">
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                :class="getRoleBadgeClass(user.role)"
              >
                {{ user.initials }}
              </div>
              <div>
                <div class="font-medium text-surface-900">{{ user.name }}</div>
                <span 
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="getRoleBadgeClass(user.role)"
                >
                  {{ user.role }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button 
                @click="openEditModal(user)"
                class="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button 
                @click="confirmDelete(user)"
                class="p-2 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                :disabled="user.id === authStore.currentUser?.id"
                :class="{ 'opacity-50 cursor-not-allowed': user.id === authStore.currentUser?.id }"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Users by Department -->
      <div 
        v-for="dept in allDepartments" 
        :key="dept.id"
        class="bg-white rounded-xl border border-surface-200"
      >
        <div class="px-4 py-3 border-b border-surface-100 flex items-center justify-between">
          <div>
            <h2 class="font-medium text-surface-900">{{ dept.name }}</h2>
            <p v-if="dept.description" class="text-xs text-surface-500">{{ dept.description }}</p>
          </div>
          <span class="text-xs text-surface-400">
            {{ allUsers.filter(u => u.departmentId === dept.id).length }} members
          </span>
        </div>
        <div class="divide-y divide-surface-100">
          <div 
            v-for="user in allUsers.filter(u => u.departmentId === dept.id)" 
            :key="user.id"
            class="px-4 py-3 flex items-center justify-between hover:bg-surface-50"
          >
            <div class="flex items-center gap-3">
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                :class="getRoleBadgeClass(user.role)"
              >
                {{ user.initials }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-medium text-surface-900">{{ user.name }}</span>
                  <span v-if="dept.lead === user.id" class="text-xs px-1.5 py-0.5 bg-surface-100 text-surface-600 rounded">
                    Lead
                  </span>
                </div>
                <span 
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="getRoleBadgeClass(user.role)"
                >
                  {{ user.role }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button 
                @click="openEditModal(user)"
                class="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button 
                @click="confirmDelete(user)"
                class="p-2 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                :disabled="user.id === authStore.currentUser?.id"
                :class="{ 'opacity-50 cursor-not-allowed': user.id === authStore.currentUser?.id }"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          <div 
            v-if="allUsers.filter(u => u.departmentId === dept.id).length === 0"
            class="px-4 py-6 text-center text-sm text-surface-400"
          >
            No members in this department
          </div>
        </div>
      </div>
    </div>

    <!-- Departments Tab -->
    <div v-else class="space-y-4">
      <div 
        v-for="dept in allDepartments" 
        :key="dept.id"
        class="bg-white rounded-xl border border-surface-200 p-4"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="font-semibold text-surface-900">{{ dept.name }}</h3>
            <p v-if="dept.description" class="text-sm text-surface-500 mt-1">{{ dept.description }}</p>
            <div class="flex items-center gap-4 mt-3 text-sm">
              <span class="text-surface-600">
                <span class="font-medium">{{ allUsers.filter(u => u.departmentId === dept.id).length }}</span> members
              </span>
              <span v-if="dept.lead" class="text-surface-600">
                Lead: <span class="font-medium">{{ getUserName(dept.lead) }}</span>
              </span>
              <span v-else class="text-surface-400">No lead assigned</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button 
              @click="openEditDeptModal(dept)"
              class="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button 
              @click="confirmDeleteDept(dept)"
              class="p-2 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div 
        v-if="allDepartments.length === 0"
        class="bg-white rounded-xl border border-surface-200 p-8 text-center"
      >
        <svg class="w-12 h-12 text-surface-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 class="font-medium text-surface-900 mb-1">No departments yet</h3>
        <p class="text-sm text-surface-500 mb-4">Create departments to organize your team members</p>
        <button 
          @click="openCreateDeptModal"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Department
        </button>
      </div>
    </div>

    <!-- Create/Edit User Modal -->
    <div 
      v-if="showModal" 
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl">
        <div class="px-6 py-4 border-b border-surface-200">
          <h3 class="text-lg font-semibold text-surface-900">
            {{ isEditing ? 'Edit User' : 'Add New User' }}
          </h3>
        </div>
        
        <div class="p-6 space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Full Name</label>
            <input 
              v-model="formData.name"
              @blur="generateInitials"
              type="text" 
              class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="John Doe"
            />
          </div>

          <!-- Initials -->
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Initials</label>
            <input 
              v-model="formData.initials"
              type="text" 
              maxlength="3"
              class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase"
              placeholder="JD"
            />
            <p class="text-xs text-surface-500 mt-1">Auto-generated from name, but you can customize</p>
          </div>

          <!-- Role -->
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Role</label>
            <select 
              v-model="formData.role"
              class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="Technician">Technician</option>
              <option value="PM">Project Manager (PM)</option>
              <option value="Admin">Admin</option>
            </select>
            <p class="text-xs text-surface-500 mt-1">
              Admin and PM roles can access PM Review and manage users
            </p>
          </div>

          <!-- Department -->
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Department</label>
            <select 
              v-model="formData.departmentId"
              class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option :value="undefined">No Department</option>
              <option v-for="dept in allDepartments" :key="dept.id" :value="dept.id">
                {{ dept.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-surface-200 flex justify-end gap-3">
          <button 
            @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="saveUser"
            :disabled="!formData.name || !formData.initials"
            class="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isEditing ? 'Save Changes' : 'Add User' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Department Modal -->
    <div 
      v-if="showDeptModal" 
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeDeptModal"
    >
      <div class="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl">
        <div class="px-6 py-4 border-b border-surface-200">
          <h3 class="text-lg font-semibold text-surface-900">
            {{ isEditingDept ? 'Edit Department' : 'Add New Department' }}
          </h3>
        </div>
        
        <div class="p-6 space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Department Name</label>
            <input 
              v-model="deptFormData.name"
              type="text" 
              class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Engineering, Sales, Support"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Description</label>
            <textarea 
              v-model="deptFormData.description"
              rows="3"
              class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Brief description of the department's responsibilities"
            ></textarea>
          </div>

          <!-- Department Lead -->
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Department Lead</label>
            <select 
              v-model="deptFormData.lead"
              class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option :value="undefined">No Lead</option>
              <option v-for="user in allUsers" :key="user.id" :value="user.id">
                {{ user.name }} ({{ user.role }})
              </option>
            </select>
            <p class="text-xs text-surface-500 mt-1">Optional: Assign a team member as department lead</p>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-surface-200 flex justify-end gap-3">
          <button 
            @click="closeDeptModal"
            class="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="saveDepartment"
            :disabled="!deptFormData.name"
            class="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isEditingDept ? 'Save Changes' : 'Add Department' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
