import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export const useAlertStore = defineStore('alert', () => {
  // Modal dialog state (for ErrorModal.vue)
  const isOpen = ref(false)
  const title = ref('Error')
  const message = ref('')

  // Toast notification state
  const toastVisible = ref(false)
  const toastMessage = ref('')
  const toastType = ref<ToastType>('success')
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  const showError = (msg: string, customTitle: string = 'Error') => {
    message.value = msg || 'An unexpected error occurred.'
    title.value = customTitle
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
    message.value = ''
  }

  const showToast = (msg: string, type: ToastType = 'success', duration: number = 4000) => {
    if (toastTimer) {
      clearTimeout(toastTimer)
      toastTimer = null
    }
    toastMessage.value = msg || ''
    toastType.value = type
    toastVisible.value = true

    if (duration > 0) {
      toastTimer = setTimeout(() => {
        toastVisible.value = false
      }, duration)
    }
  }

  const hideToast = () => {
    if (toastTimer) {
      clearTimeout(toastTimer)
      toastTimer = null
    }
    toastVisible.value = false
  }

  return {
    // Modal methods & state
    isOpen,
    title,
    message,
    showError,
    close,

    // Toast methods & state
    toastVisible,
    toastMessage,
    toastType,
    showToast,
    hideToast
  }
})

export default useAlertStore
