<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const authStore = useAuthStore()

// Mobile sidebar state
const isSidebarOpen = ref(false)

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

function closeSidebar() {
  isSidebarOpen.value = false
}

// Close sidebar on route change (mobile)
watch(() => route.path, () => {
  closeSidebar()
})

// Initialize auth store (loads users/departments from Supabase)
onMounted(() => {
  authStore.initialize()
})

// Show layout on all pages except login
// Auth check is handled by router guards
const showLayout = computed(() => {
  return route.name !== 'login'
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <template v-if="showLayout">
      <AppHeader @toggle-sidebar="toggleSidebar" :is-sidebar-open="isSidebarOpen" />
      <div class="flex flex-1 relative">
        <!-- Mobile overlay -->
        <div 
          v-if="isSidebarOpen" 
          class="fixed inset-0 bg-black/50 z-40 lg:hidden"
          @click="closeSidebar"
        ></div>
        
        <AppSidebar :is-open="isSidebarOpen" @close="closeSidebar" />
        <main class="flex-1 p-4 lg:p-6 overflow-auto">
          <router-view />
        </main>
      </div>
    </template>
    <template v-else>
      <router-view />
    </template>
  </div>
</template>
