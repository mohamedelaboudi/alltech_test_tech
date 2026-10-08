import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import employeeService from '@/services/employeeService'
import { toApiError } from '@/models/apiError'
import type {
  EmployeeResponse,
  EmployeeSearchRequest,
  EmployeeCreateRequest,
  EmployeeUpdateRequest
} from '@/models/employee'

export const useEmployeeStore = defineStore('employee', () => {
  const employees = ref<EmployeeResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const backendConnected = ref(true)

  const filters = ref<EmployeeSearchRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    hireDate: '',
    salary: undefined
  })

  const currentPage = ref(0)
  const pageSize = ref(10)
  const totalElements = ref(0)
  const totalPages = ref(0)

  // Computed helper for existing components expecting paginatedEmployees
  const paginatedEmployees = computed(() => employees.value)
  const totalCount = computed(() => totalElements.value)

  /**
   * Search employees with active filters and pagination
   */
  const searchEmployees = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await employeeService.getEmployees(
        filters.value,
        currentPage.value,
        pageSize.value
      )

      if (data && typeof data === 'object' && Array.isArray(data.content)) {
        employees.value = data.content
        totalElements.value = data.totalElements ?? 0
        totalPages.value = data.totalPages ?? 0
        currentPage.value = data.number ?? currentPage.value
        pageSize.value = data.size ?? pageSize.value
      } else if (Array.isArray(data)) {
        employees.value = data
        totalElements.value = data.length
        totalPages.value = Math.ceil(data.length / pageSize.value) || 1
      } else {
        employees.value = []
        totalElements.value = 0
        totalPages.value = 0
      }
      backendConnected.value = true
    } catch (err: unknown) {
      const apiError = toApiError(err)
      backendConnected.value = false
      error.value = apiError.message
      employees.value = []
      totalElements.value = 0
      totalPages.value = 0
    } finally {
      loading.value = false
    }
  }

  /**
   * Submit new search: update filters, reset page to 0, fetch employees
   */
  const applyEmployeeFilters = async (newFilters?: Partial<EmployeeSearchRequest>) => {
    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }
    currentPage.value = 0
    await searchEmployees()
  }

  /**
   * Reset all filters, reset page to 0, reload all employees
   */
  const resetEmployeeFilters = async () => {
    filters.value = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      department: '',
      hireDate: '',
      salary: undefined
    }
    currentPage.value = 0
    await searchEmployees()
  }

  /**
   * Change page and fetch results
   */
  const changeEmployeePage = async (page: number) => {
    if (page < 0) return
    if (totalPages.value > 0 && page >= totalPages.value) return
    currentPage.value = page
    await searchEmployees()
  }

  /**
   * Change page size, reset to page 0, and fetch results
   */
  const changeEmployeePageSize = async (size: number) => {
    pageSize.value = Number(size)
    currentPage.value = 0
    await searchEmployees()
  }

  /**
   * Alias for backward compatibility
   */
  const fetchEmployees = async () => {
    return searchEmployees()
  }

  /**
   * Create employee via backend API and refresh current search results
   */
  const createEmployee = async (payload: EmployeeCreateRequest) => {
    loading.value = true
    error.value = null
    try {
      const createdEmployee = await employeeService.create(payload)
      // Reset to page 0 to show the newly created employee
      currentPage.value = 0
      await searchEmployees()
      return createdEmployee
    } catch (err: unknown) {
      const apiError = toApiError(err)
      error.value = apiError.message
      throw apiError
    } finally {
      loading.value = false
    }
  }

  /**
   * Update employee via backend API and refresh current page
   */
  const updateEmployee = async (id: number | string, payload: EmployeeUpdateRequest) => {
    loading.value = true
    error.value = null
    try {
      const updatedEmployee = await employeeService.update(id, payload)
      await searchEmployees()
      return updatedEmployee
    } catch (err: unknown) {
      const apiError = toApiError(err)
      error.value = apiError.message
      throw apiError
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete employee via backend API and refresh current page
   */
  const deleteEmployee = async (id: number | string) => {
    loading.value = true
    error.value = null
    try {
      await employeeService.delete(id)
      if (employees.value.length === 1 && currentPage.value > 0) {
        currentPage.value--
      }
      await searchEmployees()
    } catch (err: unknown) {
      const apiError = toApiError(err)
      error.value = apiError.message
      throw apiError
    } finally {
      loading.value = false
    }
  }

  return {
    employees,
    loading,
    error,
    backendConnected,
    filters,
    currentPage,
    pageSize,
    totalElements,
    totalPages,
    paginatedEmployees,
    totalCount,
    searchEmployees,
    applyEmployeeFilters,
    resetEmployeeFilters,
    changeEmployeePage,
    changeEmployeePageSize,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    // Aliases for BasePagination event listeners
    setPage: changeEmployeePage,
    setPageSize: changeEmployeePageSize
  }
})

export default useEmployeeStore
