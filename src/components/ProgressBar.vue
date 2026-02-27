<script setup lang="ts">
interface Props {
  value: number
  showLabel?: boolean
}

withDefaults(defineProps<Props>(), {
  showLabel: false
})
</script>

<template>
  <div class="progress-bar">
    <div 
      class="progress-bar-fill"
      :style="{ width: `${Math.min(100, Math.max(0, value))}%` }"
    />
  </div>
</template>
