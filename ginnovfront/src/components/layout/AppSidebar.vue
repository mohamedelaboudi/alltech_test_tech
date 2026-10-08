<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isActive = (path) => {
  return route.path.startsWith(path)
}

const goTo = (path) => {
  router.push(path)
}

const handleLogoClick = () => {
  router.push('/users')
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="sidebar">
    <div class="logo-area" @click="handleLogoClick">
      <div class="logo-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </div>
      <div class="logo-text">
        <h2>AllTech</h2>
        <span class="logo-badge">Console</span>
      </div>
    </div>

    <div class="nav-section-title">MANAGEMENT</div>

    <nav class="navigation">
      <!-- User Management (SUPER_ADMIN ONLY) -->
      <button
        class="nav-item"
        :class="{ active: isActive('/users') }"
        @click="goTo('/users')"
      >
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </span>
        <span class="nav-label">Users Management</span>
        <span v-if="authStore.isSuperAdmin" class="role-chip">Admin</span>
      </button>

      <!-- Employee Management (Accessible to all authenticated users) -->
      <button
        class="nav-item"
        :class="{ active: isActive('/employees') }"
        @click="goTo('/employees')"
      >
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </span>
        <span class="nav-label">Employees</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <div class="user-chip">
        <span class="status-indicator"></span>
        <span class="user-chip-email" :title="authStore.userEmail">{{ authStore.userEmail || 'Active Session' }}</span>
      </div>
      <button
        type="button"
        class="sidebar-logout-icon"
        title="Sign Out"
        @click="handleLogout"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 240px;
  height: 100vh;
  background: #0f172a;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.logo-area {
  height: 70px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);
}

.logo-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text h2 {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.logo-badge {
  font-size: 10px;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  font-weight: 600;
}

.nav-section-title {
  padding: 24px 22px 10px 22px;
  font-size: 11px;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: #64748b;
}

.navigation {
  flex: 1;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #f8fafc;
}

.nav-item.active {
  background: #2563eb;
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-label {
  flex: 1;
}

.role-chip {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.sidebar-footer {
  padding: 16px 20px;
  color: #64748b;
  font-size: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  max-width: 150px;
}

.user-chip-email {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #94a3b8;
  font-size: 12px;
}

.status-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #10b981;
  flex-shrink: 0;
}

.sidebar-logout-icon {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.sidebar-logout-icon:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
</style>
