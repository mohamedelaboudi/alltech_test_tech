/**
 * Remove empty strings, null, and undefined values from query parameters object.
 * Preserves 0, false, and non-empty strings.
 */
export const cleanQueryParams = (params: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {}
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null) {
      continue
    }
    if (typeof val === 'string') {
      const trimmed = val.trim()
      if (trimmed !== '') {
        cleaned[key] = trimmed
      }
    } else if (typeof val === 'number') {
      if (!Number.isNaN(val)) {
        cleaned[key] = val
      }
    } else {
      cleaned[key] = val
    }
  }
  return cleaned
}
