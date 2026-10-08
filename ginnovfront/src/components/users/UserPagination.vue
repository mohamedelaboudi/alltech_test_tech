<script setup>
import { useUserStore } from '@/stores/userStore'
import BasePagination from '@/components/common/BasePagination.vue'

const userStore = useUserStore()
</script>

<template>
  <BasePagination
    :current-page="userStore.currentPage"
    :total-pages="userStore.totalPages"
    :total-items="userStore.totalElements"
    :page-size="userStore.pageSize"
    @page-change="userStore.changeUserPage"
    @update:page-size="userStore.changeUserPageSize"
  />
</template>
