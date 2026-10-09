export type ActivityActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'UPLOAD'
  | 'GENERATE'
  | string

export interface ActivityLog {
  id: number
  userId: number | null
  username: string | null
  action: ActivityActionType
  entityType: string
  entityId: number | null
  description: string
  createdAt: string
  read?: boolean
}

export interface ActivityLogPageResponse {
  content: ActivityLog[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    offset: number
    paged: boolean
    unpaged: boolean
  }
  totalElements: number
  totalPages: number
  last: boolean
  size: number
  number: number
  numberOfElements: number
  first: boolean
  empty: boolean
}
