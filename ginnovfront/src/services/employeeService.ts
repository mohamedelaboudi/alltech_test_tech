import api from './api/axios'
import { cleanQueryParams } from './api/paramUtils'
import type {
  EmployeeSearchRequest,
  EmployeeResponse,
  EmployeeCreateRequest,
  EmployeeUpdateRequest
} from '@/models/employee'
import type { PageResponse } from '@/models/pagination'

const BASE_URL = '/api/v1/employees'

export const employeeService = {
  /**
   * Search / get employees with pagination and filters
   * GET /api/v1/employees?firstName=...&page=0&size=10
   */
  async getEmployees(
    filters: EmployeeSearchRequest = {},
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<EmployeeResponse>> {
    const params = cleanQueryParams({
      ...filters,
      page,
      size
    })
    const response = await api.get<PageResponse<EmployeeResponse>>(BASE_URL, { params })
    return response.data
  },

  /**
   * Alias for backward compatibility
   */
  async getAll(
    filters: EmployeeSearchRequest = {},
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<EmployeeResponse>> {
    return this.getEmployees(filters, page, size)
  },

  /**
   * Get employee by ID
   */
  async getById(id: number | string): Promise<EmployeeResponse> {
    const response = await api.get<EmployeeResponse>(`${BASE_URL}/${id}`)
    return response.data
  },

  /**
   * Create a new employee
   */
  async create(employeeData: EmployeeCreateRequest): Promise<EmployeeResponse> {
    const response = await api.post<EmployeeResponse>(BASE_URL, employeeData)
    return response.data
  },

  /**
   * Update an existing employee
   */
  async update(id: number | string, employeeData: EmployeeUpdateRequest): Promise<EmployeeResponse> {
    const response = await api.put<EmployeeResponse>(`${BASE_URL}/${id}`, employeeData)
    return response.data
  },

  /**
   * Delete an employee by ID
   */
  async delete(id: number | string): Promise<void> {
    const response = await api.delete(`${BASE_URL}/${id}`)
    return response.data
  },

  /**
   * Upload employee profile photo
   * POST /api/v1/employees/{id}/photo
   */
  async uploadPhoto(id: number | string, file: File): Promise<EmployeeResponse> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post<EmployeeResponse>(`${BASE_URL}/${id}/photo`, formData)
    return response.data
  },

  /**
   * Delete employee profile photo
   * DELETE /api/v1/employees/{id}/photo
   */
  async deletePhoto(id: number | string): Promise<void> {
    const response = await api.delete(`${BASE_URL}/${id}/photo`)
    return response.data
  },

  /**
   * Upload employee CV / resume document
   * POST /api/v1/employees/{id}/cv
   */
  async uploadCv(id: number | string, file: File): Promise<EmployeeResponse> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post<EmployeeResponse>(`${BASE_URL}/${id}/cv`, formData)
    return response.data
  },

  /**
   * Delete employee CV / resume document
   * DELETE /api/v1/employees/{id}/cv
   */
  async deleteCv(id: number | string): Promise<void> {
    const response = await api.delete(`${BASE_URL}/${id}/cv`)
    return response.data
  },

  /**
   * Generate employee contract PDF
   * GET /api/v1/employees/{id}/contract
   */
  async getContract(id: number | string): Promise<Blob> {
    const response = await api.get<Blob>(`${BASE_URL}/${id}/contract`, {
      responseType: 'blob'
    })
    return response.data
  },

  /**
   * Generate employee contract PDF (alias)
   * GET /api/v1/employees/{id}/contract
   */
  async generateContract(id: number | string): Promise<Blob> {
    return this.getContract(id)
  },

  /**
   * Get employee CV document as a Blob
   * GET /api/v1/employees/{id}/cv
   */
  async getCv(id: number | string): Promise<Blob> {
    const response = await api.get<Blob>(`${BASE_URL}/${id}/cv`, {
      responseType: 'blob',
      timeout: 60000
    })
    return response.data
  },

  /**
   * Get employee profile photo as a Blob
   * GET /api/v1/employees/{id}/photo
   */
  async getPhoto(id: number | string): Promise<Blob> {
    const response = await api.get<Blob>(`${BASE_URL}/${id}/photo`, {
      responseType: 'blob'
    })
    return response.data
  },

  /**
   * Get employee profile photo as a Blob (alias)
   * GET /api/v1/employees/{id}/photo
   */
  async getImage(id: number | string): Promise<Blob> {
    return this.getPhoto(id)
  },

  /**
   * Resolve backend URL for employee CV
   */
  getCvUrl(id: number | string): string {
    const base = api.defaults.baseURL || ''
    return `${base}${BASE_URL}/${id}/cv`
  },

  /**
   * Resolve backend URL for employee photo/image
   */
  getPhotoUrl(id: number | string): string {
    const base = api.defaults.baseURL || ''
    return `${base}${BASE_URL}/${id}/photo`
  },

  /**
   * Resolve backend URL for employee photo/image (alias)
   */
  getImageUrl(id: number | string): string {
    return this.getPhotoUrl(id)
  }
}

export default employeeService
