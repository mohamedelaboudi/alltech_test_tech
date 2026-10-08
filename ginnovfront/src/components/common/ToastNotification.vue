<script setup>
import { useAlertStore } from '@/stores/alertStore'

const alertStore = useAlertStore()
</script>

<template>
  <Transition name="toast">
    <div
      v-if="alertStore.toastVisible"
      class="toast-alert"
      :class="alertStore.toastType"
      role="alert"
    >
      <span class="toast-icon">
        {{ alertStore.toastType === 'success' ? '✓' : '⚠️' }}
      </span>
      <span class="toast-message">{{ alertStore.toastMessage }}</span>
      <button
        type="button"
        class="toast-close-btn"
        aria-label="Close notification"
        @click="alertStore.hideToast"
      >
        ×
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.toast-alert {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 2200;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: var(--radius-md, 8px);
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05));
  font-size: 14px;
  font-weight: 500;
  max-width: 440px;
  word-break: break-word;
}

.toast-alert.success {
  background-color: #065f46;
  color: #ecfdf5;
}

.toast-alert.error {
  background-color: #991b1b;
  color: #fef2f2;
}

.toast-alert.warning {
  background-color: #92400e;
  color: #fffbeb;
}

.toast-alert.info {
  background-color: #1e40af;
  color: #eff6ff;
}

.toast-icon {
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
}

.toast-close-btn {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.7;
  padding: 0 4px;
  margin-left: 6px;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}

.toast-close-btn:hover {
  opacity: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
