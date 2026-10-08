/**
 * Utilities for client-side file validation and formatting
 */

export const PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
export const CV_MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export const ACCEPTED_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
]

export const ACCEPTED_PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

export const ACCEPTED_CV_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export const ACCEPTED_CV_EXTENSIONS = ['.pdf', '.doc', '.docx']

/**
 * Format bytes into readable string (e.g. 1.2 MB or 450 KB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(1))
  return `${formatted} ${sizes[i]}`
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate employee profile photo file
 */
export function validatePhotoFile(file: File): ValidationResult {
  if (!file || file.size === 0) {
    return {
      valid: false,
      error: 'The selected profile picture is empty.'
    }
  }

  if (file.size > PHOTO_MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `Picture file exceeds the 5 MB limit (${formatFileSize(file.size)}).`
    }
  }

  const extension = '.' + (file.name.split('.').pop() || '').toLowerCase()
  const isMimeValid = ACCEPTED_PHOTO_MIME_TYPES.includes(file.type.toLowerCase())
  const isExtValid = ACCEPTED_PHOTO_EXTENSIONS.includes(extension)

  if (!isMimeValid && !isExtValid) {
    return {
      valid: false,
      error: 'Invalid image format. Please select a JPG, PNG, or WEBP image.'
    }
  }

  return { valid: true }
}

/**
 * Validate employee CV / resume document file
 */
export function validateCvFile(file: File): ValidationResult {
  if (!file || file.size === 0) {
    return {
      valid: false,
      error: 'The selected CV file is empty.'
    }
  }

  if (file.size > CV_MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `CV file exceeds the 10 MB limit (${formatFileSize(file.size)}).`
    }
  }

  const extension = '.' + (file.name.split('.').pop() || '').toLowerCase()
  const isMimeValid = ACCEPTED_CV_MIME_TYPES.includes(file.type.toLowerCase())
  const isExtValid = ACCEPTED_CV_EXTENSIONS.includes(extension)

  if (!isMimeValid && !isExtValid) {
    return {
      valid: false,
      error: 'Invalid document format. Please select a PDF, DOC, or DOCX document.'
    }
  }

  return { valid: true }
}
