import api from './api/axios'
import { cleanQueryParams } from './api/paramUtils'
import type {
  UserSearchRequest,
  UserResponse,
  UserCreateRequest,
  UserUpdateRequest
} from '@/models/user'
import type { PageResponse } from '@/models/pagination'

const BASE_URL = '/api/v1/users'

export const userService = {
  /**
   * Search / get users with pagination and filters
   * GET /api/v1/users?firstName=...&page=0&size=10
   */
  async getUsers(
    filters: UserSearchRequest = {},
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<UserResponse>> {
    const params = cleanQueryParams({
      ...filters,
      page,
      size
    })
    const response = await api.get<PageResponse<UserResponse>>(BASE_URL, { params })
    return response.data
  },

  /**
   * Alias for backward compatibility
   */
  async getAll(
    filters: UserSearchRequest = {},
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<UserResponse>> {
    return this.getUsers(filters, page, size)
  },

  /**
   * Get user by ID
   */
  async getById(id: number | string): Promise<UserResponse> {
    const response = await api.get<UserResponse>(`${BASE_URL}/${id}`)
    return response.data
  },

  /**
   * Create a new user
   */
  async create(userData: UserCreateRequest): Promise<UserResponse> {
    const response = await api.post<UserResponse>(BASE_URL, userData)
    return response.data
  },

  /**
   * Update an existing user
   */
  async update(id: number | string, userData: UserUpdateRequest): Promise<UserResponse> {
    const response = await api.put<UserResponse>(`${BASE_URL}/${id}`, userData)
    return response.data
  },

  /**
   * Delete a user by ID
   */
  async delete(id: number | string): Promise<void> {
    const response = await api.delete(`${BASE_URL}/${id}`)
    return response.data
  }
}

export default userService
