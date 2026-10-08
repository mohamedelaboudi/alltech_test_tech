import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import userService from '@/services/userService'
import { toApiError } from '@/models/apiError'
import type {
  UserResponse,
  UserSearchRequest,
  UserCreateRequest,
  UserUpdateRequest
} from '@/models/user'

export const useUserStore = defineStore('user', () => {
  const users = ref<UserResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const backendConnected = ref(true)

  const filters = ref<UserSearchRequest>({
    firstName: '',
    lastName: '',
    email: '',
    userType: undefined
  })

  const currentPage = ref(0)
  const pageSize = ref(10)
  const totalElements = ref(0)
  const totalPages = ref(0)

  // Computed helper for existing components expecting paginatedUsers
  const paginatedUsers = computed(() => users.value)
  const totalCount = computed(() => totalElements.value)

  /**
   * Search users with active filters and pagination
   */
  const searchUsers = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await userService.getUsers(
        filters.value,
        currentPage.value,
        pageSize.value
      )

      if (data && typeof data === 'object' && Array.isArray(data.content)) {
        users.value = data.content
        totalElements.value = data.totalElements ?? 0
        totalPages.value = data.totalPages ?? 0
        currentPage.value = data.number ?? currentPage.value
        pageSize.value = data.size ?? pageSize.value
      } else if (Array.isArray(data)) {
        users.value = data
        totalElements.value = data.length
        totalPages.value = Math.ceil(data.length / pageSize.value) || 1
      } else {
        users.value = []
        totalElements.value = 0
        totalPages.value = 0
      }
      backendConnected.value = true
    } catch (err: unknown) {
      const apiError = toApiError(err)
      backendConnected.value = false
      error.value = apiError.message
      users.value = []
      totalElements.value = 0
      totalPages.value = 0
    } finally {
      loading.value = false
    }
  }

  /**
   * Submit new search: update filters, reset page to 0, fetch users
   */
  const applyUserFilters = async (newFilters?: Partial<UserSearchRequest>) => {
    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }
    currentPage.value = 0
    await searchUsers()
  }

  /**
   * Reset all filters, reset page to 0, reload all users
   */
  const resetUserFilters = async () => {
    filters.value = {
      firstName: '',
      lastName: '',
      email: '',
      userType: undefined
    }
    currentPage.value = 0
    await searchUsers()
  }

  /**
   * Change page and fetch results
   */
  const changeUserPage = async (page: number) => {
    if (page < 0) return
    if (totalPages.value > 0 && page >= totalPages.value) return
    currentPage.value = page
    await searchUsers()
  }

  /**
   * Change page size, reset to page 0, and fetch results
   */
  const changeUserPageSize = async (size: number) => {
    pageSize.value = Number(size)
    currentPage.value = 0
    await searchUsers()
  }

  /**
   * Alias for backward compatibility
   */
  const fetchUsers = async () => {
    return searchUsers()
  }

  /**
   * Create user via backend API and refresh current search results
   */
  const createUser = async (payload: UserCreateRequest) => {
    loading.value = true
    error.value = null
    try {
      const createdUser = await userService.create(payload)
      // Reset to page 0 to show the newly created user
      currentPage.value = 0
      await searchUsers()
      return createdUser
    } catch (err: unknown) {
      const apiError = toApiError(err)
      error.value = apiError.message
      throw apiError
    } finally {
      loading.value = false
    }
  }

  /**
   * Update user via backend API and refresh current page
   */
  const updateUser = async (id: number | string, payload: UserUpdateRequest) => {
    loading.value = true
    error.value = null
    try {
      const updatedUser = await userService.update(id, payload)
      await searchUsers()
      return updatedUser
    } catch (err: unknown) {
      const apiError = toApiError(err)
      error.value = apiError.message
      throw apiError
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete user via backend API and refresh current page
   */
  const deleteUser = async (id: number | string) => {
    loading.value = true
    error.value = null
    try {
      await userService.delete(id)
      if (users.value.length === 1 && currentPage.value > 0) {
        currentPage.value--
      }
      await searchUsers()
    } catch (err: unknown) {
      const apiError = toApiError(err)
      error.value = apiError.message
      throw apiError
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    loading,
    error,
    backendConnected,
    filters,
    currentPage,
    pageSize,
    totalElements,
    totalPages,
    paginatedUsers,
    totalCount,
    searchUsers,
    applyUserFilters,
    resetUserFilters,
    changeUserPage,
    changeUserPageSize,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    // Aliases for BasePagination event listeners
    setPage: changeUserPage,
    setPageSize: changeUserPageSize
  }
})

export default useUserStore
