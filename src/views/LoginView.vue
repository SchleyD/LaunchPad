<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

// Ensure auth store is initialized when login page loads
onMounted(() => {
  authStore.initialize()
})

function handleLogin(userId: string) {
  authStore.login(userId)
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-surface-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-surface-900">Welcome to Launchpad</h1>
        <p class="text-surface-500 mt-2">Select your account to continue</p>
      </div>

      <!-- User Selection Card -->
      <div class="card p-6">
        <h2 class="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-4">
          Select User
        </h2>
        
        <!-- Loading State -->
        <div v-if="authStore.isLoading" class="py-8 text-center">
          <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm text-surface-500">Loading users...</p>
        </div>
        
        <div v-else class="space-y-3">
          <button
            v-for="user in authStore.users"
            :key="user.id"
            @click="handleLogin(user.id)"
            class="w-full flex items-center gap-4 p-4 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors group"
          >
            <!-- Avatar -->
            <div 
              class="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-colors"
              :class="[
                user.role === 'PM' ? 'bg-primary-100 text-primary-700 group-hover:bg-primary-200' :
                user.role === 'Admin' ? 'bg-amber-100 text-amber-700 group-hover:bg-amber-200' :
                'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200'
              ]"
            >
              {{ user.initials }}
            </div>
            
            <!-- User Info -->
            <div class="flex-1 text-left">
              <div class="font-medium text-surface-900">{{ user.name }}</div>
              <div class="flex items-center gap-2 mt-0.5">
                <span 
                  class="badge"
                  :class="[
                    user.role === 'PM' ? 'badge-primary' :
                    user.role === 'Admin' ? 'badge-warning' :
                    'badge-success'
                  ]"
                >
                  {{ user.role }}
                </span>
                <span 
                  v-if="user.departmentId" 
                  class="text-xs text-surface-500"
                >
                  {{ authStore.getDepartmentById(user.departmentId)?.name }}
                </span>
              </div>
            </div>

            <!-- Arrow -->
            <svg class="w-5 h-5 text-surface-400 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Footer Note -->
      <p class="text-center text-xs text-surface-400 mt-6">
        Development mode - no password required
      </p>
    </div>
  </div>
</template>
