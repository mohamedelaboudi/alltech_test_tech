<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from './layouts/DefaultLayout.vue'
import ErrorModal from './components/common/ErrorModal.vue'
import ToastNotification from './components/common/ToastNotification.vue'
import SessionExpirationModal from './components/common/SessionExpirationModal.vue'

const route = useRoute()
const isBlankLayout = computed(() => route.meta?.layout === 'blank')
</script>

<template>
  <router-view v-if="isBlankLayout" />
  <DefaultLayout v-else />
  <ErrorModal />
  <ToastNotification />
  <SessionExpirationModal />
</template>
