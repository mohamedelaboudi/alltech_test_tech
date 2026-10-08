<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const pageTitle = computed(() => {
  if (route.path.startsWith('/employees')) {
    return 'Employees Management'
  }
  if (route.path.startsWith('/users')) {
    return 'Users Management'
  }
  return 'AllTech Portal'
})

const userInitials = computed(() => {
  if (!authStore.userEmail) return 'U'
  return authStore.userEmail.charAt(0).toUpperCase()
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="navbar">
    <!-- Page Title / Breadcrumb -->
    <div class="navbar-left">
      <h2 class="title">{{ pageTitle }}</h2>
    </div>

    <!-- Right Side Profile & Actions -->
    <div class="navbar-right">
      <div v-if="authStore.isAuthenticated" class="user-profile">
        <div class="avatar">
          <span>{{ userInitials }}</span>
        </div>
        <div class="user-info">
          <span class="user-name">{{ authStore.userEmail }}</span>
          <span class="user-role">{{ authStore.userType }}</span>
        </div>
        
        <!-- Logout Button -->
        <button
          type="button"
          class="logout-btn"
          title="Sign out of account"
          @click="handleLogout"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span class="logout-text">Logout</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  height: 70px;
  position: fixed;
  top: 0;
  left: 240px;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-light);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.title {
  font-size: 19px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.01em;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-main);
}

.user-role {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--primary);
  letter-spacing: 0.04em;
}

.logout-btn {
  margin-left: 8px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.logout-btn:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #ef4444;
}

.logout-text {
  font-size: 12px;
}
</style>