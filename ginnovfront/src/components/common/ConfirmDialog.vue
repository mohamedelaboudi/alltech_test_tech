<script setup>
import BaseModal from './BaseModal.vue'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    default: 'Are you sure you want to proceed?'
  },
  itemName: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: 'Delete'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'close'])
</script>

<template>
  <BaseModal :is-open="isOpen" :title="title" max-width="440px" @close="emit('close')">
    <div class="confirm-content">
      <div class="warning-icon-wrapper">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>

      <div class="confirm-text">
        <p class="confirm-message">{{ message }}</p>
        <p v-if="itemName" class="item-name">
          <strong>"{{ itemName }}"</strong>
        </p>
        <p class="warning-sub">This action cannot be undone.</p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="loading"
        @click="emit('close')"
      >
        {{ cancelText }}
      </button>

      <button
        type="button"
        class="btn btn-danger"
        :disabled="loading"
        @click="emit('confirm')"
      >
        {{ loading ? 'Deleting...' : confirmText }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 8px 0;
}

.warning-icon-wrapper {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #fee2e2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.confirm-message {
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.4;
}

.item-name {
  font-size: 14px;
  color: var(--danger);
}

.warning-sub {
  font-size: 12px;
  color: var(--text-subtle);
}
</style>
