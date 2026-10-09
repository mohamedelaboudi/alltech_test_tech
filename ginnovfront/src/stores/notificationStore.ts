import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ActivityLog } from '@/models/activityLog'
import activityLogService from '@/services/activityLogService'
import activityWebSocketService from '@/services/activityWebSocketService'
import { useAuthStore } from './authStore'
import { useAlertStore } from './alertStore'

const MAX_ACTIVITIES = 50

export const useNotificationStore = defineStore('notification', () => {
  const activities = ref<ActivityLog[]>([])
  const isConnected = ref<boolean>(false)
  const isLoading = ref<boolean>(false)
  const isPanelOpen = ref<boolean>(false)
  const isInitialized = ref<boolean>(false)
  let unsubscribeStatus: (() => void) | null = null
  let unsubscribeActivity: (() => void) | null = null

  // Track unread status in client memory
  const unreadCount = computed<number>(() => {
    return activities.value.filter((a) => !a.read).length
  })

  const hasUnread = computed<boolean>(() => {
    return unreadCount.value > 0
  })

  /**
   * Format action message for toast display
   */
  const formatToastMessage = (log: ActivityLog): string => {
    const action = log.action || 'ACTIVITY'
    const desc = log.description || `${log.entityType} #${log.entityId}`
    const actor = log.username ? `by ${log.username}` : ''
    return `[${action}] ${desc} ${actor}`.trim()
  }

  /**
   * Process a new incoming real-time activity event from WebSocket
   */
  const handleIncomingActivity = (log: ActivityLog) => {
    // 1. Duplicate prevention by activity ID
    const exists = activities.value.some((item) => item.id === log.id)
    if (exists) {
      return
    }

    // 2. Mark incoming event as unread
    const newEntry: ActivityLog = {
      ...log,
      read: false
    }

    // 3. Add to the beginning of the list & cap at MAX_ACTIVITIES
    activities.value.unshift(newEntry)
    if (activities.value.length > MAX_ACTIVITIES) {
      activities.value = activities.value.slice(0, MAX_ACTIVITIES)
    }

    // 4. Trigger Toast notification ONLY for live incoming WebSocket events
    try {
      const alertStore = useAlertStore()
      const toastText = formatToastMessage(log)
      alertStore.showToast(toastText, 'info', 5000)
    } catch (e) {
      console.warn('[NotificationStore] Could not show toast:', e)
    }
  }

  /**
   * Fetch initial historical activity logs via REST API without triggering toasts
   */
  const fetchInitialLogs = async () => {
    const authStore = useAuthStore()
    if (!authStore.isSuperAdmin) {
      return
    }

    isLoading.value = true
    try {
      const pageData = await activityLogService.getActivityLogs(0, MAX_ACTIVITIES)
      if (pageData && Array.isArray(pageData.content)) {
        // Retain any existing unread states if already present
        const existingReadMap = new Map<number, boolean>()
        activities.value.forEach((a) => {
          if (a.read !== undefined) {
            existingReadMap.set(a.id, a.read)
          }
        })

        // On initial load, mark items as read so user doesn't get flooded with badges
        const mapped = pageData.content.map((item) => ({
          ...item,
          read: existingReadMap.has(item.id) ? existingReadMap.get(item.id)! : true
        }))

        // Limit to MAX_ACTIVITIES
        activities.value = mapped.slice(0, MAX_ACTIVITIES)
      }
    } catch (err) {
      console.error('[NotificationStore] Failed to fetch initial activity logs:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Mark a single notification item as read
   */
  const markAsRead = (id: number) => {
    const item = activities.value.find((a) => a.id === id)
    if (item && !item.read) {
      item.read = true
    }
  }

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = () => {
    activities.value.forEach((item) => {
      item.read = true
    })
  }

  /**
   * Clear all notification items from the in-memory panel
   */
  const clearAll = () => {
    activities.value = []
  }

  /**
   * Toggle, open, or close panel
   */
  const togglePanel = () => {
    isPanelOpen.value = !isPanelOpen.value
  }

  const closePanel = () => {
    isPanelOpen.value = false
  }

  const openPanel = () => {
    isPanelOpen.value = true
  }

  /**
   * Initialize WebSocket subscription for Super Admin
   */
  const init = async () => {
    const authStore = useAuthStore()

    // STRICT CHECK: Only Super Admin is allowed to subscribe to admin activity
    if (!authStore.isAuthenticated || !authStore.isSuperAdmin) {
      disconnect()
      return
    }

    if (isInitialized.value) {
      if (!activityWebSocketService.getConnected()) {
        activityWebSocketService.connect()
      }
      return
    }

    isInitialized.value = true

    // 1. Fetch initial REST logs
    await fetchInitialLogs()

    // 2. Set up connection status tracking
    unsubscribeStatus = activityWebSocketService.onConnectionChange((connected) => {
      isConnected.value = connected
    })

    // 3. Set up incoming message listener
    unsubscribeActivity = activityWebSocketService.onActivity((incomingLog) => {
      handleIncomingActivity(incomingLog)
    })

    // 4. Connect STOMP client (browser automatically sends HttpOnly cookies)
    activityWebSocketService.connect()
  }

  /**
   * Teardown and disconnect
   */
  const disconnect = () => {
    unsubscribeStatus?.()
    unsubscribeActivity?.()
    unsubscribeStatus = null
    unsubscribeActivity = null
    activityWebSocketService.disconnect()
    isConnected.value = false
    isInitialized.value = false
    isPanelOpen.value = false
    activities.value = []
  }

  return {
    activities,
    unreadCount,
    hasUnread,
    isConnected,
    isLoading,
    isPanelOpen,
    isInitialized,
    init,
    disconnect,
    fetchInitialLogs,
    markAsRead,
    markAllAsRead,
    clearAll,
    togglePanel,
    closePanel,
    openPanel,
    handleIncomingActivity
  }
})

export default useNotificationStore
