import api from './api/axios'
import type { LoginRequest, LoginResponse } from '@/models/auth'

/**
 * Authentication service communicating with Spring Boot auth endpoints
 */
export const authService = {
  /**
   * Send login credentials to backend
   * Supports both /api/auth/login and /api/v1/auth/login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/api/auth/login', credentials)
      return response.data
    } catch (err: any) {
      // If /api/auth/login returns 404, fallback to /api/v1/auth/login
      if (err?.status === 404 || err?.response?.status === 404) {
        const response = await api.post<LoginResponse>('/api/v1/auth/login', credentials)
        return response.data
      }
      throw err
    }
  },

  /**
   * Refresh session tokens via HttpOnly refresh_token cookie
   * The browser automatically transmits the HttpOnly refresh_token cookie.
   * Returns updated user information and the new access token expiresIn lifetime.
   */
  async refresh(): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/api/auth/refresh')
      return response.data
    } catch (err: any) {
      if (err?.status === 404 || err?.response?.status === 404) {
        const response = await api.post<LoginResponse>('/api/v1/auth/refresh')
        return response.data
      }
      throw err
    }
  },

  /**
   * Invalidate session and revoke cookies on backend
   * Calls POST /api/auth/logout with credentials to revoke refresh token and clear cookies
   */
  async logout(): Promise<void> {
    try {
      try {
        await api.post('/api/auth/logout')
      } catch (err: any) {
        if (err?.status === 404 || err?.response?.status === 404) {
          await api.post('/api/v1/auth/logout')
        } else {
          throw err
        }
      }
    } catch (e) {
      console.warn('Backend logout request failed:', e)
    }
  }
}

export default authService

