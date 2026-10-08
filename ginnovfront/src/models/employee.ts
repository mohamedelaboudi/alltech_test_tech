/**
 * Standard department options for employees
 */
export const DEPARTMENTS = [
  'Engineering',
  'Development',
  'IT',
  'Human Resources',
  'Finance',
  'Marketing',
  'Sales',
  'Product Design',
  'Customer Support',
  'Operations',
  'Legal'
] as const

/**
 * Employee Search Request matching backend @ModelAttribute EmployeeSearchRequest
 */
export interface EmployeeSearchRequest {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  jobTitle?: string
  department?: string
  hireDate?: string
  salary?: number
}

/**
 * Employee Response matching backend EmployeeResponse
 */
export interface EmployeeResponse {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  jobTitle?: string
  department?: string
  hireDate?: string
  salary?: number | null
  createdAt?: string
  updatedAt?: string
  photoUrl?: string
  cvUrl?: string
}

export interface EmployeeCreateRequest {
  firstName: string
  lastName: string
  email: string
  phone?: string
  jobTitle?: string
  department?: string
  hireDate?: string
  salary?: number | null
}

export interface EmployeeUpdateRequest {
  firstName: string
  lastName: string
  email: string
  phone?: string
  jobTitle?: string
  department?: string
  hireDate?: string
  salary?: number | null
}

/**
 * Default empty create employee form
 */
export const defaultCreateEmployeeForm = (): EmployeeCreateRequest => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  department: 'Engineering',
  hireDate: new Date().toISOString().split('T')[0],
  salary: null
})

/**
 * Default empty update employee form
 */
export const defaultUpdateEmployeeForm = (): EmployeeUpdateRequest => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  department: '',
  hireDate: '',
  salary: null
})

/**
 * Format currency helper
 */
export const formatSalary = (salary?: number | string | null): string => {
  if (salary === null || salary === undefined || salary === '') return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(Number(salary))
}
