<script setup>
import { useAuthorization } from '@/utils/authorization'

const { hasPermission } = useAuthorization()

defineProps({
  users: {
    type: Array,
    required: true,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['view', 'edit', 'delete'])

const getRoleBadgeClass = (userType) => {
  return userType === 'SUPER_ADMIN' ? 'badge-primary' : 'badge-muted'
}

const getRoleLabel = (userType) => {
  return userType === 'SUPER_ADMIN' ? 'Super Admin' : 'Normal User'
}
</script>

<template>
  <div class="table-responsive">
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 70px;">ID</th>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Email</th>
          <th>User Type</th>
          <th>Status</th>
          <th style="width: 140px; text-align: center;">Actions</th>
        </tr>
      </thead>

      <tbody>
        <!-- Loading skeleton or spinner -->
        <tr v-if="loading">
          <td colspan="7" class="state-cell">
            <div class="spinner-inline"></div>
            <span>Loading users...</span>
          </td>
        </tr>

        <!-- Empty state -->
        <tr v-else-if="users.length === 0">
          <td colspan="7" class="state-cell">
            <div class="empty-state">
              <span class="empty-icon">👥</span>
              <h4>No users found</h4>
              <p>No user matches your search criteria. Try adjusting your filters or resetting.</p>
            </div>
          </td>
        </tr>

        <!-- Data rows -->
        <tr
          v-for="user in users"
          v-else
          :key="user.id"
          class="table-row"
        >
          <td class="id-cell">#{{ user.id }}</td>

          <td class="name-cell">
            <div class="user-cell-flex">
              <div class="avatar-initials">
                {{ (user.firstName?.[0] || 'U').toUpperCase() }}
              </div>
              <span class="font-medium">{{ user.firstName }}</span>
            </div>
          </td>

          <td class="font-medium">{{ user.lastName }}</td>

          <td class="email-cell">{{ user.email }}</td>

          <td>
            <span class="badge" :class="getRoleBadgeClass(user.userType)">
              {{ getRoleLabel(user.userType) }}
            </span>
          </td>

          <td>
            <span
              class="badge"
              :class="user.enabled !== false ? 'badge-success' : 'badge-warning'"
            >
              <span class="status-dot" :class="{ 'dot-active': user.enabled !== false }"></span>
              {{ user.enabled !== false ? 'Active' : 'Disabled' }}
            </span>
          </td>

          <td>
            <div class="actions-group">
              <!-- View / Afficher -->
              <button
                type="button"
                class="btn-icon btn-icon-view"
                title="View user details"
                @click="emit('view', user)"
              >
                👁
              </button>

              <!-- Edit / Modifier (UPDATE permission required) -->
              <button
                v-if="hasPermission('UPDATE')"
                type="button"
                class="btn-icon btn-icon-edit"
                title="Edit user"
                @click="emit('edit', user)"
              >
                ✏
              </button>

              <!-- Delete / Supprimer (DELETE permission required) -->
              <button
                v-if="hasPermission('DELETE')"
                type="button"
                class="btn-icon btn-icon-delete"
                title="Delete user"
                @click="emit('delete', user)"
              >
                🗑
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-responsive {
  width: 100%;
  overflow-x: auto;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13.5px;
}

.data-table th {
  padding: 14px 18px;
  background-color: var(--bg-subtle);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-light);
  white-space: nowrap;
}

.data-table td {
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-main);
  vertical-align: middle;
}

.table-row {
  transition: background-color 0.15s ease;
}

.table-row:hover {
  background-color: #f8fafc;
}

.table-row:last-child td {
  border-bottom: none;
}

.id-cell {
  font-weight: 600;
  color: var(--text-subtle);
  font-size: 12.5px;
}

.user-cell-flex {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-initials {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
}

.font-medium {
  font-weight: 500;
}

.email-cell {
  color: var(--text-muted);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #f59e0b;
}

.status-dot.dot-active {
  background-color: #10b981;
}

.actions-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.state-cell {
  text-align: center;
  padding: 48px 24px;
}

.spinner-inline {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid var(--border-light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  font-size: 32px;
}

.empty-state h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.empty-state p {
  font-size: 13px;
  color: var(--text-muted);
  max-width: 340px;
}
</style>
