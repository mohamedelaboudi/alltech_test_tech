/**
 * Standard backend API error response format returned by Spring Boot
 */
export interface ApiErrorResponse {
  timestamp?: string
  status: number
  error?: string
  message: string
  path?: string
  errors?: Record<string, string>
}

/**
 * Standardized frontend API Error class wrapping backend error responses
 */
export class ApiError extends Error {
  public readonly status: number
  public readonly errorTitle?: string
  public readonly timestamp?: string
  public readonly path?: string
  public readonly errors?: Record<string, string>
  public readonly rawResponse?: ApiErrorResponse

  constructor(response: ApiErrorResponse) {
    super(response.message || 'An unexpected error occurred')
    this.name = 'ApiError'
    this.status = response.status
    this.errorTitle = response.error
    this.timestamp = response.timestamp
    this.path = response.path
    this.errors = response.errors
    this.rawResponse = response
    Object.setPrototypeOf(this, ApiError.prototype)
  }

  /**
   * Returns true if there are field-specific validation errors
   */
  get hasFieldErrors(): boolean {
    return !!(this.errors && Object.keys(this.errors).length > 0)
  }

  /**
   * Retrieves a specific field error message if present
   */
  getFieldError(fieldName: string): string | undefined {
    return this.errors?.[fieldName]
  }

  /**
   * Check if this error is specifically an email conflict (HTTP 409)
   */
  get isEmailConflict(): boolean {
    if (this.status !== 409) return false
    const msg = (this.message || '').toLowerCase()
    return msg.includes('email') || !!(this.errors && 'email' in this.errors)
  }
}

/**
 * Type guard to check if an unknown error is an instance of ApiError
 */
export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}

/**
 * Get fallback human-readable message for HTTP status codes
 */
function getDefaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Bad request. Please verify the submitted data.'
    case 401:
      return 'Invalid email or password'
    case 403:
      return 'You do not have permission to perform this action.'
    case 404:
      return 'Requested resource was not found.'
    case 409:
      return 'A conflict occurred with an existing resource.'
    case 500:
      return 'An unexpected error occurred. Please try again later.'
    case 502:
      return 'Bad gateway: The backend service is temporarily unreachable.'
    case 503:
      return 'Service temporarily unavailable. Please try again later.'
    case 504:
      return 'Gateway timeout: The server took too long to respond.'
    default:
      return 'An unexpected error occurred. Please try again later.'
  }
}

/**
 * Converts any caught error into a standardized ApiError instance
 */
export function toApiError(err: unknown): ApiError {
  if (isApiError(err)) {
    return err
  }

  if (err && typeof err === 'object') {
    const maybeAxios = err as {
      response?: {
        status?: number
        data?: ApiErrorResponse | Record<string, unknown> | string
      }
      message?: string
      status?: number
    }

    if (maybeAxios.response) {
      const resp = maybeAxios.response
      const data = resp.data
      const status = typeof resp.status === 'number' ? resp.status : 500

      if (data && typeof data === 'object') {
        const typedData = data as Partial<ApiErrorResponse>
        // Ensure status 500 never exposes internal stack traces or database errors
        const message =
          status === 500
            ? 'An unexpected error occurred. Please try again later.'
            : typedData.message || getDefaultMessageForStatus(status)

        return new ApiError({
          timestamp: typedData.timestamp,
          status: typeof typedData.status === 'number' ? typedData.status : status,
          error: typedData.error,
          message,
          path: typedData.path,
          errors:
            typedData.errors && typeof typedData.errors === 'object'
              ? (typedData.errors as Record<string, string>)
              : undefined
        })
      } else if (typeof data === 'string' && data.trim()) {
        const message =
          status === 500
            ? 'An unexpected error occurred. Please try again later.'
            : data.trim()

        return new ApiError({
          status,
          message
        })
      }

      return new ApiError({
        status,
        message: getDefaultMessageForStatus(status)
      })
    }

    // Network error / connection refused
    if (maybeAxios.message && maybeAxios.message.toLowerCase().includes('network error')) {
      return new ApiError({
        status: 0,
        message: 'Unable to connect to backend server. Please verify Spring Boot is running.'
      })
    }

    if (maybeAxios.message) {
      return new ApiError({
        status: maybeAxios.status || 0,
        message: maybeAxios.message
      })
    }
  }

  if (typeof err === 'string') {
    return new ApiError({
      status: 0,
      message: err
    })
  }

  return new ApiError({
    status: 500,
    message: 'An unexpected error occurred. Please try again later.'
  })
}
