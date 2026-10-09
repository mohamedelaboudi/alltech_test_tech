<script setup>
import { computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const isOpen = computed(() => authStore.showSessionWarning && authStore.isAuthenticated)
const remainingSeconds = computed(() => authStore.warningRemainingSeconds)
const isRefreshing = computed(() => authStore.isRefreshing)
const isLongSession = computed(() => authStore.isLongSessionExpiring)

const modalTitle = computed(() => {
  return isLongSession.value ? 'Extended Session Expiring' : 'Session Expiration Warning'
})

const modalDescription = computed(() => {
  return isLongSession.value
    ? 'Your 7-day extended session duration is about to end. Click "Stay Connected" to renew your session for another 7 days, or logout to exit safely.'
    : 'Your session is about to expire. Would you like to stay connected and extend your session for 7 days?'
})

const handleStayConnected = async () => {
  if (authStore.isRefreshing) {
    return
  }
  await authStore.stayConnected()
}

const handleLogout = async () => {
  await authStore.logout()
}

const handleModalDismiss = () => {
  // Modal cannot be dismissed by clicking outside to prevent unintentional session loss
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    :title="modalTitle"
    max-width="460px"
    :z-index="2300"
    :trap-escape="true"
    @close="handleModalDismiss"
  >
    <div class="session-warning-content">
      <div class="warning-icon-wrapper">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#d97706"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>

      <div class="warning-text">
        <h4 class="warning-title">{{ modalTitle }}</h4>
        <p class="warning-desc">
          {{ modalDescription }}
        </p>

        <div v-if="remainingSeconds > 0" class="countdown-badge">
          <span class="pulse-dot"></span>
          <span>
            {{ isLongSession ? '7-Day session' : 'Session' }} expires in <strong>{{ remainingSeconds }}s</strong>
          </span>
        </div>
        <div v-else class="countdown-badge expired">
          <span>Session expired. Click "Stay Connected" to refresh.</span>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="isRefreshing"
        @click="handleLogout"
      >
        Logout
      </button>

      <button
        type="button"
        class="btn btn-primary"
        :disabled="isRefreshing"
        @click="handleStayConnected"
      >
        <span v-if="isRefreshing" class="spinner"></span>
        <span>{{ isRefreshing ? 'Refreshing...' : 'Stay Connected' }}</span>
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.session-warning-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 8px 0;
}

.warning-icon-wrapper {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #fef3c7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.warning-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  line-height: 1.3;
}

.warning-desc {
  font-size: 13.5px;
  color: var(--text-muted);
  line-height: 1.45;
}

.countdown-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background-color: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
  font-size: 12.5px;
  font-weight: 500;
  margin-top: 4px;
  width: fit-content;
}

.countdown-badge.expired {
  background-color: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #f59e0b;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(245, 158, 11, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
  }
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
