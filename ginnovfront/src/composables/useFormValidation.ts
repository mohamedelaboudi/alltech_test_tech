import { ref } from 'vue'
import { toApiError, type ApiError } from '@/models/apiError'

/**
 * Composable for managing form validation and API error states
 */
export function useFormValidation() {
  const errors = ref<Record<string, string>>({})
  const generalError = ref<string | null>(null)

  /**
   * Check whether a specific field has a validation error
   */
  const hasError = (field: string): boolean => {
    return !!errors.value[field]
  }

  /**
   * Retrieve the validation error message for a specific field
   */
  const getFieldError = (field: string): string | undefined => {
    return errors.value[field]
  }

  /**
   * Clear error for a specific field when the user starts correcting it
   */
  const clearFieldError = (field: string): void => {
    if (errors.value[field]) {
      const updated = { ...errors.value }
      delete updated[field]
      errors.value = updated
    }
  }

  /**
   * Clear all field errors and general form error
   */
  const clearErrors = (): void => {
    errors.value = {}
    generalError.value = null
  }

  /**
   * Explicitly set an error message for a single field
   */
  const setFieldError = (field: string, message: string): void => {
    errors.value = {
      ...errors.value,
      [field]: message
    }
  }

  /**
   * Bulk-set field errors from a backend error map
   */
  const setFieldErrors = (backendErrors?: Record<string, string>): void => {
    if (backendErrors && typeof backendErrors === 'object') {
      errors.value = { ...backendErrors }
    } else {
      errors.value = {}
    }
  }

  /**
   * Consume an API error and propagate field-level or general messages.
   * Returns true if handled within form fields or form banner.
   */
  const handleApiError = (err: unknown, emailField: string = 'email'): boolean => {
    const apiError: ApiError = toApiError(err)

    // 1. Validation Errors (HTTP 400 with field map)
    if (apiError.hasFieldErrors) {
      setFieldErrors(apiError.errors)
      // Do not display generic "Validation failed" as banner when field errors are present
      generalError.value = null
      return true
    }

    // 2. Email Conflict (HTTP 409 with email duplicate message)
    if (apiError.isEmailConflict) {
      setFieldError(emailField, apiError.message)
      generalError.value = null
      return true
    }

    // 3. Database constraint violation or other HTTP 409 conflict
    if (apiError.status === 409) {
      generalError.value = apiError.message
      return true
    }

    // 4. Generic Bad Request (HTTP 400 without field map)
    if (apiError.status === 400) {
      generalError.value = apiError.message
      return true
    }

    // 5. Unexpected / other errors
    generalError.value = apiError.message
    return false
  }

  return {
    errors,
    generalError,
    hasError,
    getFieldError,
    clearFieldError,
    clearErrors,
    setFieldError,
    setFieldErrors,
    handleApiError
  }
}

export default useFormValidation
