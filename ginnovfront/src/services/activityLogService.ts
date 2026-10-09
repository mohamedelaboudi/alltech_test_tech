import api from './api/axios'
import type { ActivityLogPageResponse } from '@/models/activityLog'

const BASE_URL = '/api/v1/activity-logs'

export const activityLogService = {
  /**
   * Fetch paginated activity audit logs
   * Only accessible by SUPER_ADMIN
   */
  async getActivityLogs(page: number = 0, size: number = 20): Promise<ActivityLogPageResponse> {
    const response = await api.get<ActivityLogPageResponse>(BASE_URL, {
      params: {
        page,
        size
      }
    })
    return response.data
  }
}

export default activityLogService
