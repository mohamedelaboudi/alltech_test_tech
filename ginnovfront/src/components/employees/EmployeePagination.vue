<script setup>
import { useEmployeeStore } from '@/stores/employeeStore'
import BasePagination from '@/components/common/BasePagination.vue'

const employeeStore = useEmployeeStore()
</script>

<template>
  <BasePagination
    :current-page="employeeStore.currentPage"
    :total-pages="employeeStore.totalPages"
    :total-items="employeeStore.totalElements"
    :page-size="employeeStore.pageSize"
    @page-change="employeeStore.changeEmployeePage"
    @update:page-size="employeeStore.changeEmployeePageSize"
  />
</template>
