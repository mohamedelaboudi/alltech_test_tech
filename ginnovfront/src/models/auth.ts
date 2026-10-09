export const UserType = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  NORMAL_USER: 'NORMAL_USER'
} as const

export type UserType = (typeof UserType)[keyof typeof UserType]

/**
 * Permission types matching the Spring Boot PermissionType enum
 */
export type PermissionType = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'

export const ALL_PERMISSIONS: PermissionType[] = ['CREATE', 'READ', 'UPDATE', 'DELETE']

/**
 * Login Request matching backend POST /api/auth/login
 */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * Login Response matching backend response structure with HttpOnly cookies
 */
export interface LoginResponse {
  email: string
  userType: UserType
  permissions: PermissionType[]
  expiresIn: number
  refreshExpiresIn?: number
}

/**
 * Authenticated User state stored in Pinia / localStorage
 */
export interface AuthUser {
  email: string
  userType: UserType
  permissions: PermissionType[]
}

/**
 * Decoded JWT claims
 */
export interface DecodedJwtPayload {
  sub?: string
  email?: string
  userType?: string
  roles?: string[]
  authorities?: string[]
  permissions?: string[]
  exp?: number
  iat?: number
  [key: string]: any
}

/**
 * Safely parse a JWT payload without external dependencies
 */
export function parseJwtPayload(token: string): DecodedJwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/**
 * Check if a JWT is expired based on exp claim (if present)
 */
export function isJwtExpired(token: string): boolean {
  const payload = parseJwtPayload(token)
  if (!payload || !payload.exp) return false
  const nowInSeconds = Math.floor(Date.now() / 1000)
  return payload.exp < nowInSeconds
}
