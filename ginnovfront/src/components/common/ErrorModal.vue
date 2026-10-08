<script setup>
import { useAlertStore } from '@/stores/alertStore'
import BaseModal from './BaseModal.vue'

const alertStore = useAlertStore()

const handleClose = () => {
  alertStore.close()
}
</script>

<template>
  <BaseModal
    :is-open="alertStore.isOpen"
    :title="alertStore.title"
    max-width="440px"
    @close="handleClose"
  >
    <div class="error-popup-content">
      <div class="error-icon-wrapper">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>

      <div class="error-popup-text">
        <p class="error-message">{{ alertStore.message }}</p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="btn btn-primary"
        @click="handleClose"
      >
        OK
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.error-popup-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 8px 0;
}

.error-icon-wrapper {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #fee2e2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-popup-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 44px;
}

.error-message {
  font-size: 14px;
  color: var(--text-main, #1e293b);
  line-height: 1.5;
  margin: 0;
  word-break: break-word;
}

.btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.btn-primary {
  background-color: #ef4444;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #dc2626;
}
</style>
