import { UserType, type PermissionType, ALL_PERMISSIONS } from '@/models/auth'

export { UserType, type PermissionType, ALL_PERMISSIONS }

export const USER_TYPE_LABELS: Record<UserType, string> = {
  [UserType.SUPER_ADMIN]: 'Super Admin',
  [UserType.NORMAL_USER]: 'Normal User'
}

/**
 * User Search Request matching backend @ModelAttribute UserSearchRequest
 */
export interface UserSearchRequest {
  firstName?: string
  lastName?: string
  email?: string
  userType?: UserType | string
}

/**
 * User Response matching backend UserResponse
 */
export interface UserResponse {
  id: number
  firstName: string
  lastName: string
  email: string
  userType: UserType | string
  enabled?: boolean
  permissions?: PermissionType[]
  createdAt?: string
  updatedAt?: string
}

export interface UserCreateRequest {
  firstName: string
  lastName: string
  email: string
  password?: string
  userType: UserType | string
  permissions: PermissionType[]
}

export interface UserUpdateRequest {
  firstName: string
  lastName: string
  email: string
  password?: string
  userType: UserType | string
  enabled?: boolean
  permissions: PermissionType[]
}

/**
 * Default empty create user form
 */
export const defaultCreateUserForm = (): UserCreateRequest => ({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  userType: UserType.NORMAL_USER,
  permissions: []
})

/**
 * Default empty update user form
 */
export const defaultUpdateUserForm = (): UserUpdateRequest => ({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  userType: UserType.NORMAL_USER,
  enabled: true,
  permissions: []
})
