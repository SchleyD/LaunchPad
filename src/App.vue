<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const authStore = useAuthStore()

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
      <AppHeader />
      <div class="flex flex-1">
        <AppSidebar />
        <main class="flex-1 p-6 overflow-auto">
          <router-view />
        </main>
      </div>
    </template>
    <template v-else>
      <router-view />
    </template>
  </div>
</template>
