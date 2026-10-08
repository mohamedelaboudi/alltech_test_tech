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
  }
}

export default authService
