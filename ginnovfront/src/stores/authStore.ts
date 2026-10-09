import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'
import authService from '@/services/authService'
import type {
  LoginRequest,
  LoginResponse,
  AuthUser,
  PermissionType,
  UserType
} from '@/models/auth'
import { toApiError } from '@/models/apiError'

export const ALL_PERMISSIONS: PermissionType[] = ['CREATE', 'READ', 'UPDATE', 'DELETE']

export const isPermissionType = (value: string): value is PermissionType => {
  return ALL_PERMISSIONS.includes(value as PermissionType)
}

// 7-day default duration for the refresh session (matching backend jwt.refresh-expiration)
const DEFAULT_REFRESH_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000 // 604,800,000 ms

// Timings for warnings and silent refresh
const ACCESS_TOKEN_WARNING_LEAD_TIME_MS = 30000 // Show warning 30s before short access token expires
const REFRESH_SILENT_LEAD_TIME_MS = 20000 // Trigger silent background refresh 20s before expiry
const LONG_SESSION_WARNING_LEAD_TIME_MS = 60000 // Show warning 60s before 7-day session expires
const REFRESH_RETRY_DELAYS_MS = [1000, 3000, 7000]

// Storage keys for preserving extended session state across page refreshes
const STAY_CONNECTED_STORAGE_KEY = 'alltech_stay_connected'
const REFRESH_EXPIRES_AT_STORAGE_KEY = 'alltech_refresh_expires_at'

export const useAuthStore = defineStore('auth', () => {
  // Authentication & User State (No tokens stored in memory/storage; HttpOnly cookies are used)
  const user = ref<AuthUser | null>(null)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const isInitialized = ref<boolean>(false)

  // Session & Expiration State
  const expiresIn = ref<number>(0)
  const tokenExpiresAt = ref<number | null>(null) // Absolute timestamp of access token expiration
  const refreshExpiresAt = ref<number | null>(null) // Absolute timestamp of 7-day refresh token expiration
  const isStayConnected = ref<boolean>(false) // True when user opted into 7-day extended session
  const showSessionWarning = ref<boolean>(false) // Controls visibility of the warning modal
  const warningRemainingSeconds = ref<number>(30)
  const isRefreshing = ref<boolean>(false)
  const isLongSessionExpiring = ref<boolean>(false) // True when the 7-day session (not short access token) is expiring

  // Internal timer handles
  let warningTimer: ReturnType<typeof setTimeout> | null = null
  let silentRefreshTimer: ReturnType<typeof setTimeout> | null = null
  let hardExpirationTimer: ReturnType<typeof setTimeout> | null = null
  let countdownInterval: ReturnType<typeof setInterval> | null = null

  // Invalidation & Single-Flight guards
  let sessionGeneration = 0
  let isHandlingSessionExpiry = false
  let refreshPromise: Promise<LoginResponse> | null = null
  let initPromise: Promise<void> | null = null
  let automaticRefreshAttempts = 0

  // =========================================================================
  // Getters & Computed
  // =========================================================================

  const isAuthenticated = computed<boolean>(() => {
    return !!user.value
  })

  const userEmail = computed<string>(() => {
    return user.value?.email || ''
  })

  const userType = computed<string>(() => {
    return user.value?.userType || ''
  })

  const isSuperAdmin = computed<boolean>(() => {
    return user.value?.userType === 'SUPER_ADMIN'
  })

  const isNormalUser = computed<boolean>(() => {
    return user.value?.userType === 'NORMAL_USER'
  })

  const permissions = computed<PermissionType[]>(() => {
    if (isSuperAdmin.value) {
      return ALL_PERMISSIONS
    }
    return user.value?.permissions || []
  })

  const hasPermission = (permission: PermissionType): boolean => {
    if (isSuperAdmin.value) return true
    return permissions.value.includes(permission)
  }

  // =========================================================================
  // Helper & Timer Management
  // =========================================================================

  const normalizeExpiresInMs = (value: unknown): number => {
    const numeric = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(numeric) || numeric <= 0) {
      throw toApiError({ status: 500, message: 'Authentication response has an invalid expiresIn value.' })
    }
    return numeric
  }

  const stopTimerHandles = () => {
    if (warningTimer) {
      clearTimeout(warningTimer)
      warningTimer = null
    }
    if (silentRefreshTimer) {
      clearTimeout(silentRefreshTimer)
      silentRefreshTimer = null
    }
    if (hardExpirationTimer) {
      clearTimeout(hardExpirationTimer)
      hardExpirationTimer = null
    }
    if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }

  const clearSessionTimer = () => {
    sessionGeneration += 1
    stopTimerHandles()
    tokenExpiresAt.value = null
    refreshExpiresAt.value = null
    showSessionWarning.value = false
    isLongSessionExpiring.value = false
    warningRemainingSeconds.value = Math.ceil(ACCESS_TOKEN_WARNING_LEAD_TIME_MS / 1000)
  }

  const closeSessionWarning = () => {
    showSessionWarning.value = false
    isLongSessionExpiring.value = false
    if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
    warningRemainingSeconds.value = Math.ceil(ACCESS_TOKEN_WARNING_LEAD_TIME_MS / 1000)
  }

  /**
   * Updates countdown tick based on wall-clock time until the target expiration deadline
   */
  const updateCountdown = (targetDeadline: number, generation: number) => {
    if (generation !== sessionGeneration) return
    const remaining = Math.max(0, Math.ceil((targetDeadline - Date.now()) / 1000))
    warningRemainingSeconds.value = remaining
    if (remaining <= 0) {
      if (countdownInterval) {
        clearInterval(countdownInterval)
        countdownInterval = null
      }
      handleSessionExpired()
    }
  }

  /**
   * Displays the session warning modal with real-time countdown
   */
  const openWarningModal = (targetDeadline: number, isLongSession: boolean, generation: number) => {
    if (generation !== sessionGeneration || !user.value || isHandlingSessionExpiry) return

    isLongSessionExpiring.value = isLongSession
    showSessionWarning.value = true
    updateCountdown(targetDeadline, generation)

    if (countdownInterval) clearInterval(countdownInterval)
    countdownInterval = setInterval(() => {
      updateCountdown(targetDeadline, generation)
    }, 1000)
  }

  /**
   * Core session scheduling engine:
   * - If isStayConnected is FALSE: User is in initial short session.
   *   Shows warning modal before access token expires to prompt user: "Stay Connected" or "Logout".
   * - If isStayConnected is TRUE: User chose "Stay Connected" (7-day extended session).
   *   DOES NOT show warning repeatedly every time access token expires!
   *   Silently refreshes access token in the background.
   *   ONLY shows warning modal when the 7-day session itself is about to expire!
   */
  const scheduleSessionTimers = (tokenLifetimeMs: number, refreshLifetimeMs?: number) => {
    stopTimerHandles()
    sessionGeneration += 1
    const generation = sessionGeneration

    const tokenLifetime = normalizeExpiresInMs(tokenLifetimeMs)
    expiresIn.value = tokenLifetime
    const now = Date.now()
    tokenExpiresAt.value = now + tokenLifetime
    closeSessionWarning()
    automaticRefreshAttempts = 0

    // =========================================================================
    // CASE 1: 7-DAY EXTENDED SESSION (User selected "Stay Connected")
    // =========================================================================
    if (isStayConnected.value) {
      // Ensure refreshExpiresAt timestamp exists
      if (!refreshExpiresAt.value) {
        const fullDuration = refreshLifetimeMs && refreshLifetimeMs > 0
          ? refreshLifetimeMs
          : DEFAULT_REFRESH_TOKEN_LIFETIME_MS
        refreshExpiresAt.value = now + fullDuration
        try {
          localStorage.setItem(REFRESH_EXPIRES_AT_STORAGE_KEY, String(refreshExpiresAt.value))
          localStorage.setItem(STAY_CONNECTED_STORAGE_KEY, 'true')
        } catch {
          // LocalStorage fallback
        }
      }

      // If the 7-day duration has fully passed, immediately expire session
      if (now >= refreshExpiresAt.value) {
        handleSessionExpired(true)
        return
      }

      const timeUntil7DayExpiry = refreshExpiresAt.value - now

      // Check if 7-day refresh token itself is about to expire (within 60s)
      if (timeUntil7DayExpiry <= LONG_SESSION_WARNING_LEAD_TIME_MS) {
        // Show the 7-day expiration warning
        openWarningModal(refreshExpiresAt.value, true, generation)

        hardExpirationTimer = setTimeout(() => {
          if (generation !== sessionGeneration) return
          handleSessionExpired()
        }, Math.max(0, timeUntil7DayExpiry))
        return
      }

      // During the 7 days: SILENT BACKGROUND REFRESH (NO WARNING MODAL!)
      // Refresh shortly before the short access token expires
      const silentLeadTime = Math.min(REFRESH_SILENT_LEAD_TIME_MS, Math.floor(tokenLifetime / 2))
      const silentDelayMs = Math.max(0, tokenLifetime - silentLeadTime)

      const attemptSilentRefresh = async () => {
        if (generation !== sessionGeneration || !user.value || isHandlingSessionExpiry) return
        try {
          await refreshToken()
        } catch (err) {
          console.warn('[AuthStore] Silent refresh failed, scheduling retry or fallback:', err)
          if (automaticRefreshAttempts < REFRESH_RETRY_DELAYS_MS.length) {
            const retryDelay = REFRESH_RETRY_DELAYS_MS[automaticRefreshAttempts]
            automaticRefreshAttempts += 1
            silentRefreshTimer = setTimeout(attemptSilentRefresh, retryDelay)
          } else if (tokenExpiresAt.value && Date.now() >= tokenExpiresAt.value - ACCESS_TOKEN_WARNING_LEAD_TIME_MS) {
            openWarningModal(tokenExpiresAt.value, false, generation)
          }
        }
      }

      silentRefreshTimer = setTimeout(attemptSilentRefresh, silentDelayMs)

      // Schedule warning for when the 7-day session approaches its end
      const delayUntil7DayWarning = Math.max(0, timeUntil7DayExpiry - LONG_SESSION_WARNING_LEAD_TIME_MS)
      warningTimer = setTimeout(() => {
        if (generation !== sessionGeneration || !user.value || isHandlingSessionExpiry) return
        if (refreshExpiresAt.value) {
          openWarningModal(refreshExpiresAt.value, true, generation)
        }
      }, delayUntil7DayWarning)

      // Safety hard-expiration timer in case background network is completely disconnected
      hardExpirationTimer = setTimeout(() => {
        if (generation !== sessionGeneration) return
        if (tokenExpiresAt.value && Date.now() < tokenExpiresAt.value) return
        handleSessionExpired()
      }, Math.max(0, tokenLifetime + 5000))

      return
    }

    // =========================================================================
    // CASE 2: INITIAL LOGIN SESSION (User has NOT chosen "Stay Connected" yet)
    // Prompt the user with the warning modal before access token expires
    // =========================================================================
    const warningLeadTime = Math.min(ACCESS_TOKEN_WARNING_LEAD_TIME_MS, Math.floor(tokenLifetime / 2))
    const delayUntilWarning = Math.max(0, tokenLifetime - warningLeadTime)

    warningTimer = setTimeout(() => {
      if (generation !== sessionGeneration || !user.value || isHandlingSessionExpiry) return
      if (tokenExpiresAt.value) {
        openWarningModal(tokenExpiresAt.value, false, generation)
      }
    }, delayUntilWarning)

    // Hard expiration timer if user does not choose "Stay Connected" before token dies
    hardExpirationTimer = setTimeout(() => {
      if (generation !== sessionGeneration) return
      if (tokenExpiresAt.value && Date.now() < tokenExpiresAt.value) return
      handleSessionExpired()
    }, Math.max(0, tokenLifetime))
  }

  /**
   * Evaluates wall-clock time after browser suspension or tab refocus
   */
  const checkSessionLiveness = () => {
    if (!user.value) return
    if (isHandlingSessionExpiry) return

    const now = Date.now()

    if (isStayConnected.value) {
      // Check 7-day absolute deadline
      if (refreshExpiresAt.value && now >= refreshExpiresAt.value) {
        handleSessionExpired(true)
        return
      }

      // If access token expired or is near expiry while suspended, refresh silently
      if (tokenExpiresAt.value && now >= tokenExpiresAt.value - REFRESH_SILENT_LEAD_TIME_MS) {
        void refreshToken().catch(() => {
          if (tokenExpiresAt.value && now >= tokenExpiresAt.value) {
            handleSessionExpired()
          }
        })
      }
      return
    }

    // If in initial session: check if access token expired while asleep
    if (tokenExpiresAt.value) {
      if (now >= tokenExpiresAt.value) {
        handleSessionExpired()
      } else if (now >= tokenExpiresAt.value - ACCESS_TOKEN_WARNING_LEAD_TIME_MS) {
        openWarningModal(tokenExpiresAt.value, false, sessionGeneration)
      }
    }
  }

  // Register window & document listeners for sleep/focus recovery
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', checkSessionLiveness)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkSessionLiveness()
      }
    })
  }

  /**
   * Clears in-memory auth state and localStorage
   */
  const clearAuthState = () => {
    clearSessionTimer()
    user.value = null
    isStayConnected.value = false
    refreshExpiresAt.value = null
    showSessionWarning.value = false
    isLongSessionExpiring.value = false

    try {
      localStorage.removeItem(STAY_CONNECTED_STORAGE_KEY)
      localStorage.removeItem(REFRESH_EXPIRES_AT_STORAGE_KEY)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    } catch {
      // LocalStorage fallback
    }
  }

  /**
   * Processes backend login/refresh response
   */
  const handleAuthSuccess = (data: LoginResponse) => {
    isHandlingSessionExpiry = false

    if (!data?.email || !Number.isFinite(Number(data.expiresIn)) || Number(data.expiresIn) <= 0) {
      throw toApiError({ status: 500, message: 'Authentication response is missing valid user information or expiresIn.' })
    }

    const email = data.email
    const uType = (data.userType || 'NORMAL_USER') as UserType

    const perms: PermissionType[] =
      uType === 'SUPER_ADMIN'
        ? [...ALL_PERMISSIONS]
        : Array.isArray(data.permissions)
          ? data.permissions.filter(isPermissionType)
          : []

    user.value = {
      email,
      userType: uType,
      permissions: perms
    }

    // Schedule timers according to current session mode
    scheduleSessionTimers(data.expiresIn, data.refreshExpiresIn)
  }

  // =========================================================================
  // Authentication Actions
  // =========================================================================

  /**
   * Login action:
   * Sets initial authentication state (isStayConnected starts as FALSE).
   * Backend sets HttpOnly access_token and refresh_token cookies.
   */
  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    loading.value = true
    error.value = null
    try {
      // Reset any previous stayConnected state on fresh login
      isStayConnected.value = false
      refreshExpiresAt.value = null
      try {
        localStorage.removeItem(STAY_CONNECTED_STORAGE_KEY)
        localStorage.removeItem(REFRESH_EXPIRES_AT_STORAGE_KEY)
      } catch {
        // Ignored
      }

      const data = await authService.login(credentials)
      handleAuthSuccess(data)
      return data
    } catch (err: unknown) {
      const apiError = toApiError(err)
      const message =
        apiError.status === 401
          ? apiError.message || 'Invalid email or password'
          : apiError.status === 403
            ? 'Access forbidden: account not authorized.'
            : apiError.message || 'Authentication failed. Please verify your credentials.'
      error.value = message
      throw apiError
    } finally {
      loading.value = false
    }
  }

  /**
   * Single-flight token refresh:
   * Handles concurrent refresh callers safely.
   */
  const refreshToken = async (options?: { expireOnFailure?: boolean }): Promise<LoginResponse> => {
    if (refreshPromise) {
      return refreshPromise
    }

    const expireOnFailure = options?.expireOnFailure !== false
    const startingGeneration = sessionGeneration
    isRefreshing.value = true

    refreshPromise = (async () => {
      try {
        const data = await authService.refresh()
        if (!data?.email || data.expiresIn == null) {
          throw toApiError({
            status: 500,
            message: 'Refresh response is missing user information or expiresIn.'
          })
        }
        if (startingGeneration !== sessionGeneration) {
          throw toApiError({ status: 409, message: 'Refresh response belongs to an expired session.' })
        }
        handleAuthSuccess(data)
        return data
      } catch (err: unknown) {
        const apiErr = toApiError(err)
        // If refresh failed because the refresh token is expired, revoked, or invalid (401 / 403),
        // cleanly log out user and redirect to login
        if (
          expireOnFailure &&
          user.value !== null &&
          startingGeneration === sessionGeneration &&
          (apiErr.status === 401 || apiErr.status === 403)
        ) {
          handleSessionExpired(true)
        }
        throw apiErr
      } finally {
        isRefreshing.value = false
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  /**
   * User action when clicking "Stay Connected":
   * 1. Activates 7-day extended session (isStayConnected = true).
   * 2. Calls refreshToken() to get a fresh access token.
   * 3. Sets refreshExpiresAt for 7 days into the future.
   * 4. Closes the warning modal.
   * 5. From now on, tokens refresh SILENTLY without showing the warning modal repeatedly!
   */
  const stayConnected = async (): Promise<void> => {
    if (isRefreshing.value && refreshPromise) {
      await refreshPromise
      return
    }

    try {
      isStayConnected.value = true
      const now = Date.now()
      refreshExpiresAt.value = now + DEFAULT_REFRESH_TOKEN_LIFETIME_MS

      try {
        localStorage.setItem(STAY_CONNECTED_STORAGE_KEY, 'true')
        localStorage.setItem(REFRESH_EXPIRES_AT_STORAGE_KEY, String(refreshExpiresAt.value))
      } catch {
        // Ignored
      }

      await refreshToken()
      closeSessionWarning()
    } catch (err) {
      console.warn('Failed to stay connected:', err)
    }
  }

  /**
   * Logout action:
   * Revokes refresh token on backend, deletes cookies, and redirects to /login
   */
  const logout = async (): Promise<void> => {
    if (isHandlingSessionExpiry) return
    clearAuthState()
    try {
      await authService.logout()
    } catch (err) {
      console.warn('Backend logout request failed:', err)
    } finally {
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    }
  }

  /**
   * Session expiration fallback:
   * Cleans state and routes user to /login
   */
  const handleSessionExpired = (force = false) => {
    if (isHandlingSessionExpiry) return
    if (!force && isRefreshing.value) return

    isHandlingSessionExpiry = true
    clearAuthState()

    if (router.currentRoute.value.path !== '/login') {
      router.push({
        path: '/login',
        query: {
          redirect:
            router.currentRoute.value.fullPath !== '/'
              ? router.currentRoute.value.fullPath
              : undefined
        }
      })
    }
  }

  /**
   * Application bootstrap / Page reload:
   * Restores authenticated state and checks if user had opted into 7-day Stay Connected session.
   */
  const initializeAuth = async (): Promise<void> => {
    if (isInitialized.value) return
    if (initPromise) return initPromise

    initPromise = (async () => {
      try {
        // Restore 7-day stayConnected state from localStorage if valid
        try {
          const savedStayConnected = localStorage.getItem(STAY_CONNECTED_STORAGE_KEY)
          const savedRefreshExpiresAt = localStorage.getItem(REFRESH_EXPIRES_AT_STORAGE_KEY)

          if (savedStayConnected === 'true' && savedRefreshExpiresAt) {
            const exp = Number(savedRefreshExpiresAt)
            if (Number.isFinite(exp) && exp > Date.now()) {
              isStayConnected.value = true
              refreshExpiresAt.value = exp
            } else {
              localStorage.removeItem(STAY_CONNECTED_STORAGE_KEY)
              localStorage.removeItem(REFRESH_EXPIRES_AT_STORAGE_KEY)
            }
          }
        } catch {
          // Ignored
        }

        await refreshToken({ expireOnFailure: false })
      } catch (err: unknown) {
        const apiErr = toApiError(err)
        if (apiErr.status === 401 || apiErr.status === 403) {
          clearAuthState()
        } else {
          clearSessionTimer()
          user.value = null
        }
      } finally {
        isInitialized.value = true
        initPromise = null
      }
    })()

    return initPromise
  }

  return {
    user,
    loading,
    error,
    isInitialized,
    isAuthenticated,
    userEmail,
    userType,
    isSuperAdmin,
    isNormalUser,
    permissions,
    hasPermission,
    expiresIn,
    tokenExpiresAt,
    refreshExpiresAt,
    isStayConnected,
    isLongSessionExpiring,
    showSessionWarning,
    warningRemainingSeconds,
    isRefreshing,
    scheduleSessionTimers,
    startSessionTimer: scheduleSessionTimers, // Backward-compatibility alias
    clearSessionTimer,
    login,
    refreshToken,
    stayConnected,
    logout,
    handleSessionExpired,
    initializeAuth
  }
})

export default useAuthStore
