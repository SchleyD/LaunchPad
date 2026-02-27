<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const authStore = useAuthStore()

// Don't show header/sidebar on login page
const showLayout = computed(() => {
  return route.name !== 'login' && authStore.isAuthenticated
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
