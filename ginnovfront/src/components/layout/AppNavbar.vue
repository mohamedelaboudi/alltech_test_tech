<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import NotificationPanel from '@/components/notifications/NotificationPanel.vue'
import { useSidebar } from '@/composables/useSidebar'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar()

const bellContainerRef = ref(null)

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

const unreadBadgeText = computed(() => {
  const count = notificationStore.unreadCount
  if (count <= 0) return ''
  return count > 99 ? '99+' : count.toString()
})

// Initialize notification WebSocket for Super Admin
const syncNotificationConnection = () => {
  if (authStore.isAuthenticated && authStore.isSuperAdmin) {
    notificationStore.init()
  } else {
    notificationStore.disconnect()
  }
}

watch(
  [() => authStore.isAuthenticated, () => authStore.isSuperAdmin],
  () => {
    syncNotificationConnection()
  },
  { immediate: true }
)

// Handle click outside to close notification panel
const handleClickOutside = (event) => {
  if (
    notificationStore.isPanelOpen &&
    bellContainerRef.value &&
    !bellContainerRef.value.contains(event.target)
  ) {
    notificationStore.closePanel()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  syncNotificationConnection()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleBellClick = () => {
  notificationStore.togglePanel()
}

const handleLogout = () => {
  notificationStore.disconnect()
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="navbar">
    <!-- Page Title / Breadcrumb -->
    <div class="navbar-left">
      <button
        type="button"
        class="sidebar-toggle"
        :aria-expanded="sidebarOpen"
        aria-controls="app-sidebar"
        :title="sidebarOpen ? 'Hide sidebar' : 'Show sidebar'"
        :aria-label="sidebarOpen ? 'Hide sidebar' : 'Show sidebar'"
        @click="toggleSidebar"
      >
        <svg
          v-if="sidebarOpen"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="11 17 6 12 11 7"></polyline>
          <line x1="18" y1="12" x2="6" y2="12"></line>
        </svg>
        <svg
          v-else
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <h2 class="title">{{ pageTitle }}</h2>
    </div>

    <!-- Right Side Profile & Actions -->
    <div class="navbar-right">
      <!-- Super Admin Notification Bell -->
      <div
        v-if="authStore.isAuthenticated && authStore.isSuperAdmin"
        ref="bellContainerRef"
        class="notification-bell-container"
      >
        <button
          type="button"
          class="bell-btn"
          :class="{ 'has-unread': notificationStore.hasUnread, 'panel-active': notificationStore.isPanelOpen }"
          title="Activity Notifications"
          aria-label="Activity Notifications"
          @click="handleBellClick"
        >
          <!-- Bell Icon -->
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="bell-icon"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>

          <!-- Unread Count Badge -->
          <span
            v-if="notificationStore.hasUnread"
            class="unread-badge"
          >
            {{ unreadBadgeText }}
          </span>

          <!-- Live Connection Status Pip -->
          <span
            class="connection-pip"
            :class="{ 'pip-online': notificationStore.isConnected, 'pip-offline': !notificationStore.isConnected }"
            :title="notificationStore.isConnected ? 'WebSocket Connected' : 'Disconnected'"
          ></span>
        </button>

        <!-- Notification Dropdown Panel -->
        <NotificationPanel v-if="notificationStore.isPanelOpen" />
      </div>

      <!-- User Profile & Session -->
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
  top: var(--navbar-top, 0px);
  left: var(--sidebar-offset, 240px);
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-light);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: left 0.3s ease, top 0.3s ease;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.sidebar-toggle {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid var(--border-light, #e2e8f0);
  background: #ffffff;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
}

.sidebar-toggle:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #0f172a;
}

.title {
  font-size: 19px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.01em;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Bell Container */
.notification-bell-container {
  position: relative;
  display: flex;
  align-items: center;
}

.bell-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border-light, #e2e8f0);
  background: #ffffff;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
}

.bell-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #0f172a;
}

.bell-btn.panel-active {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #2563eb;
}

.bell-icon {
  transition: transform 0.2s ease;
}

.bell-btn:hover .bell-icon {
  transform: rotate(12deg);
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 5px rgba(239, 68, 68, 0.4);
  animation: badgeBounce 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes badgeBounce {
  0% { transform: scale(0.6); }
  50% { transform: scale(1.18); }
  100% { transform: scale(1); }
}

.connection-pip {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1px solid #ffffff;
}

.pip-online {
  background: #10b981;
}

.pip-offline {
  background: #94a3b8;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-left: 6px;
  border-left: 1px solid var(--border-light, #e2e8f0);
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