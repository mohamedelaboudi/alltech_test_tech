<script setup>
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppNavbar from '@/components/layout/AppNavbar.vue'
</script>

<template>
  <div class="layout">
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
  min-height: 100vh;
  background-color: var(--bg-page);
  display: flex;
}

.main {
  margin-left: 240px;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content {
  padding-top: 70px;
  padding-left: 32px;
  padding-right: 32px;
  padding-bottom: 40px;
  flex: 1;
  max-width: 1400px;
  width: 100%;
}
</style>