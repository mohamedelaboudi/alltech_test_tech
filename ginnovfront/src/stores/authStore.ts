import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '@/services/authService'
import type {
  LoginRequest,
  LoginResponse,
  AuthUser,
  PermissionType,
  UserType
} from '@/models/auth'
import { parseJwtPayload, isJwtExpired } from '@/models/auth'
import { toApiError } from '@/models/apiError'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export const ALL_PERMISSIONS: PermissionType[] = ['CREATE', 'READ', 'UPDATE', 'DELETE']

export const isPermissionType = (value: string): value is PermissionType => {
  return ALL_PERMISSIONS.includes(value as PermissionType)
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<AuthUser | null>(null)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const isInitialized = ref<boolean>(false)

  // Getters & Computed
  const isAuthenticated = computed<boolean>(() => {
    return !!token.value
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
      // SUPER_ADMIN automatically receives all CRUD permissions
      return ALL_PERMISSIONS
    }
    return user.value?.permissions || []
  })

  const hasPermission = (permission: PermissionType): boolean => {
    if (isSuperAdmin.value) return true
    return permissions.value.includes(permission)
  }

  /**
   * Helper to clear localStorage and reactive store
   */
  const clearStorage = () => {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  /**
   * Restore auth state from localStorage on application startup
   */
  const initializeAuth = () => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      const storedUser = localStorage.getItem(USER_KEY)

      if (storedToken) {
        // If JWT has exp claim and is expired, clear credentials
        if (isJwtExpired(storedToken)) {
          clearStorage()
          isInitialized.value = true
          return
        }

        token.value = storedToken
        if (storedUser) {
          try {
            user.value = JSON.parse(storedUser)
          } catch {
            user.value = null
          }
        }

        // If user was not in localStorage or invalid, fallback basic info from token payload without decoding permissions
        if (!user.value) {
          const payload = parseJwtPayload(storedToken)
          if (payload) {
            const uType = (payload.userType || 'NORMAL_USER') as UserType
            user.value = {
              email: payload.sub || payload.email || '',
              userType: uType,
              permissions: uType === 'SUPER_ADMIN' ? [...ALL_PERMISSIONS] : []
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore auth from localStorage:', e)
      clearStorage()
    } finally {
      isInitialized.value = true
    }
  }

  /**
   * Login action
   * Calls authService.login -> stores JWT and user info -> updates state
   */
  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    loading.value = true
    error.value = null
    try {
      const data = await authService.login(credentials)

      const jwtToken = data.token
      const email = data.email || credentials.email
      const uType = (data.userType || 'NORMAL_USER') as UserType

      // Derive permissions: SUPER_ADMIN gets all, otherwise read directly from login response
      const perms: PermissionType[] =
        uType === 'SUPER_ADMIN'
          ? [...ALL_PERMISSIONS]
          : Array.isArray(data.permissions)
            ? data.permissions.filter(isPermissionType)
            : []

      const authUserData: AuthUser = {
        email,
        userType: uType,
        permissions: perms
      }

      // Store in memory and localStorage
      token.value = jwtToken
      user.value = authUserData
      localStorage.setItem(TOKEN_KEY, jwtToken)
      localStorage.setItem(USER_KEY, JSON.stringify(authUserData))

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
   * Logout action
   * Clears JWT, user info, and Pinia auth state
   */
  const logout = () => {
    clearStorage()
  }

  return {
    token,
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
    login,
    logout,
    initializeAuth
  }
})

export default useAuthStore
