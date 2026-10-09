<script setup>
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import { useSidebar } from '@/composables/useSidebar'

const { isOpen } = useSidebar()
</script>

<template>
  <div class="layout" :class="{ 'sidebar-closed': !isOpen }">
    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main area -->
    <div class="main">
      <AppNavbar />

      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  --sidebar-offset: 240px;
  --navbar-top: 0px;
  --content-pad-top: 70px;
  min-height: 100vh;
  background-color: var(--bg-page);
  display: block;
  padding-left: var(--sidebar-offset);
  transition: padding-left 0.3s ease;
}

.layout.sidebar-closed {
  --sidebar-offset: 0px;
}

.main {
  min-width: 0;
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content {
  padding-top: var(--content-pad-top);
  padding-left: 32px;
  padding-right: 32px;
  padding-bottom: 40px;
  flex: 1;
  width: 100%;
  max-width: none;
  min-width: 0;
  box-sizing: border-box;
  transition: padding-top 0.3s ease;
}
</style>