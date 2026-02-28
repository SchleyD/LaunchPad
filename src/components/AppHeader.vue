<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineProps<{
  isSidebarOpen?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const router = useRouter()
const authStore = useAuthStore()

const showUserMenu = ref(false)

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function switchUser() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="h-14 bg-white border-b border-surface-200 flex items-center px-4 shrink-0">
    <!-- Mobile menu button -->
    <button 
      @click="emit('toggle-sidebar')"
      class="lg:hidden mr-3 p-2 -ml-2 rounded-lg hover:bg-surface-100 transition-colors"
      aria-label="Toggle menu"
    >
      <svg class="w-5 h-5 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
    
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
        <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <span class="text-lg font-semibold text-surface-900">Launchpad</span>
    </div>
    
    <div class="ml-auto flex items-center gap-4">
      <!-- Current User Dropdown -->
      <div class="relative" v-if="authStore.currentUser">
        <button 
          @click="showUserMenu = !showUserMenu"
          class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
        >
          <div 
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
            :class="[
              authStore.currentUser.role === 'PM' ? 'bg-primary-100 text-primary-700' :
              authStore.currentUser.role === 'Admin' ? 'bg-amber-100 text-amber-700' :
              'bg-emerald-100 text-emerald-700'
            ]"
          >
            {{ authStore.currentUser.initials }}
          </div>
          <div class="text-left hidden sm:block">
            <div class="text-sm font-medium text-surface-700">{{ authStore.currentUser.name }}</div>
            <div class="text-xs text-surface-500">{{ authStore.currentUserDepartment?.name || authStore.currentUser.role }}</div>
          </div>
          <svg class="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <div 
          v-if="showUserMenu" 
          class="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg border border-surface-200 shadow-lg py-1 z-50"
          @mouseleave="showUserMenu = false"
        >
          <div class="px-3 py-2 border-b border-surface-100">
            <div class="text-sm font-medium text-surface-900">{{ authStore.currentUser.name }}</div>
            <div class="text-xs text-surface-500">{{ authStore.currentUser.role }} - {{ authStore.currentUserDepartment?.name }}</div>
          </div>
          <button 
            @click="switchUser" 
            class="w-full px-3 py-2 text-left text-sm text-surface-700 hover:bg-surface-50 flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Switch User
          </button>
          <button 
            @click="handleLogout" 
            class="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
