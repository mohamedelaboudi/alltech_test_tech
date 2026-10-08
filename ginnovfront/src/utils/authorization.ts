import { useAuthStore } from '@/stores/authStore'
import type { PermissionType } from '@/models/auth'

/**
 * Vue composable for reactive frontend authorization checks
 */
export function useAuthorization() {
  const authStore = useAuthStore()

  const isSuperAdmin = (): boolean => authStore.isSuperAdmin
  const isNormalUser = (): boolean => authStore.isNormalUser
  const hasPermission = (permission: PermissionType): boolean => authStore.hasPermission(permission)

  return {
    isSuperAdmin,
    isNormalUser,
    hasPermission,
    permissions: authStore.permissions
  }
}

/**
 * Standalone authorization helper functions for use outside setup or in utility functions
 */
export const isSuperAdmin = (): boolean => {
  const authStore = useAuthStore()
  return authStore.isSuperAdmin
}

export const isNormalUser = (): boolean => {
  const authStore = useAuthStore()
  return authStore.isNormalUser
}

export const hasPermission = (permission: PermissionType): boolean => {
  const authStore = useAuthStore()
  return authStore.hasPermission(permission)
}

export default useAuthorization
