/// <reference types="vite/client" />
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { Router } from 'vue-router'
import { useAlertStore } from '@/stores/alertStore'
import { useAuthStore } from '@/stores/authStore'
import { toApiError, type ApiError } from '@/models/apiError'

// If VITE_API_BASE_URL is explicitly defined, use it. Otherwise default to empty string so requests use Vite dev proxy
const env = import.meta.env
const baseURL =
  env?.VITE_API_BASE_URL !== undefined
    ? env.VITE_API_BASE_URL
    : env?.DEV
      ? ''
      : 'http://localhost:8080'

let routerInstance: Router | null = null

/**
 * Configure router reference for SPA-friendly redirects from interceptors
 */
export const setRouter = (router: Router) => {
  routerInstance = router
}

const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
})

/**
 * Request interceptor: ensures correct headers without leaking tokens into JS
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // For FormData payloads, do not set application/json so browser sets multipart boundary
    if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Response interceptor: centralized error handling and 401 token refresh retry
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const apiError: ApiError = toApiError(error)
    const status = apiError.status
    const url = error.config?.url || ''

    // 1. 401 Unauthorized handling
    const isLoginRequest = url.includes('/login') || url.includes('auth/login')
    const isRefreshRequest = url.includes('/refresh') || url.includes('auth/refresh')
    const isLogoutRequest = url.includes('/logout') || url.includes('auth/logout')

    if (status === 401) {
      // If login endpoint returns 401, reject so login form displays credentials error
      if (isLoginRequest) {
        return Promise.reject(apiError)
      }

      // Refresh/logout 401 is handled by the auth store to avoid duplicate logout.
      // A retried request that still returns 401 means the new access cookie is not valid.
      if (isRefreshRequest || isLogoutRequest) {
        return Promise.reject(apiError)
      }

      if (error.config?._retry) {
        try {
          const authStore = useAuthStore()
          if (authStore.isAuthenticated && !authStore.isRefreshing) {
            authStore.handleSessionExpired()
          }
        } catch {
          if (routerInstance && routerInstance.currentRoute.value.path !== '/login') {
            routerInstance.push('/login')
          }
        }
        return Promise.reject(apiError)
      }

      // Automatic fallback for expired access token: single-flight refresh and retry once
      const originalRequest = error.config
      originalRequest._retry = true

      try {
        const authStore = useAuthStore()
        // Concurrency-safe: awaits existing shared refresh promise if one is already in-flight
        await authStore.refreshToken()
        // Retry original request; browser automatically attaches refreshed HttpOnly cookies
        return api(originalRequest)
      } catch (refreshErr) {
        return Promise.reject(toApiError(refreshErr))
      }
    }

    // 2. 502 / 503 / 504: Bad Gateway or Service Unavailable
    // Handled as temporary server/proxy infrastructure error, NOT user session invalidation
    if (status === 502 || status === 503 || status === 504) {
      try {
        const alertStore = useAlertStore()
        alertStore.showToast(
          status === 502
            ? 'Bad Gateway: Backend server is temporarily unreachable.'
            : 'Server is temporarily unavailable. Please try again later.',
          'error'
        )
      } catch {
        // Fallback
      }
      return Promise.reject(apiError)
    }

    // 2. 403 Forbidden: authenticated but lacks permission
    if (status === 403) {
      try {
        const alertStore = useAlertStore()
        const permissionMsg =
          apiError.message &&
          apiError.message !== 'Forbidden' &&
          apiError.message !== 'Access Denied'
            ? apiError.message
            : 'You do not have permission to perform this action.'
        alertStore.showToast(permissionMsg, 'error')
      } catch {
        // Fallback
      }
    }

    // 3. 404 Not Found: resource does not exist
    if (status === 404) {
      try {
        const alertStore = useAlertStore()
        alertStore.showToast(apiError.message, 'error')
      } catch {
        // Fallback
      }
    }

    // 4. 409 Conflict: database constraint violation or generic conflict not handled in form email
    if (status === 409 && !apiError.isEmailConflict) {
      try {
        const alertStore = useAlertStore()
        alertStore.showToast(apiError.message, 'error')
      } catch {
        // Fallback
      }
    }

    // 5. 400 Bad Request: generic bad request without field-level errors
    // When field-level errors exist, prioritize field errors and do not show a generic toast
    if (status === 400 && !apiError.hasFieldErrors) {
      try {
        const alertStore = useAlertStore()
        alertStore.showToast(apiError.message, 'error')
      } catch {
        // Fallback
      }
    }

    // 6. 500 Internal Server Error: unexpected backend error
    // Display generic user-friendly message without exposing stack traces or technical details
    if (status === 500) {
      try {
        const alertStore = useAlertStore()
        alertStore.showToast('An unexpected error occurred. Please try again later.', 'error')
      } catch {
        // Fallback
      }
    }

    // 7. Network / Connection Error (Backend offline / unreachable)
    if (status === 0) {
      try {
        const alertStore = useAlertStore()
        alertStore.showToast(apiError.message, 'error')
      } catch {
        // Fallback
      }
    }

    // Always reject with the strongly-typed ApiError instance
    return Promise.reject(apiError)
  }
)

export default api
