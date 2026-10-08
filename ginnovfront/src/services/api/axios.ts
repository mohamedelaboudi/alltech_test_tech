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
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
})

/**
 * Request interceptor: automatically attaches JWT Bearer token
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // For FormData payloads, do not set application/json so browser sets multipart boundary
    if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Response interceptor: centralized error handling for all API requests
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: ApiError = toApiError(error)
    const status = apiError.status
    const url = error.config?.url || ''

    // 1. 401 Unauthorized: token missing, invalid, or expired
    // Do NOT automatically redirect or clear session if this is an authentication/login request
    const isLoginRequest = url.includes('/login') || url.includes('auth/login')

    if (status === 401 && !isLoginRequest) {
      try {
        const authStore = useAuthStore()
        authStore.logout()
      } catch {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }

      if (routerInstance && routerInstance.currentRoute.value.path !== '/login') {
        routerInstance.push('/login')
      } else if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
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
