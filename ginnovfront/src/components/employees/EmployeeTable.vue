<script setup>
import { formatSalary } from '@/models/employee'
import { hasPermission } from '@/utils/authorization'

defineProps({
  employees: {
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

const getDepartmentBadgeClass = (department) => {
  switch (department) {
    case 'Engineering':
    case 'Development':
    case 'IT':
      return 'badge-primary'
    case 'Finance':
      return 'badge-success'
    case 'Human Resources':
      return 'badge-warning'
    default:
      return 'badge-muted'
  }
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
          <th>Job Title</th>
          <th>Department</th>
          <th>Hire Date</th>
          <th>Salary</th>
          <th style="width: 140px; text-align: center;">Actions</th>
        </tr>
      </thead>

      <tbody>
        <!-- Loading skeleton or spinner -->
        <tr v-if="loading">
          <td colspan="9" class="state-cell">
            <div class="spinner-inline"></div>
            <span>Loading employees...</span>
          </td>
        </tr>

        <!-- Empty state -->
        <tr v-else-if="employees.length === 0">
          <td colspan="9" class="state-cell">
            <div class="empty-state">
              <span class="empty-icon">👥</span>
              <h4>No employees found</h4>
              <p>No employee matches your search criteria. Try adjusting your filters or resetting.</p>
            </div>
          </td>
        </tr>

        <!-- Data rows -->
        <tr
          v-for="employee in employees"
          v-else
          :key="employee.id"
          class="table-row"
        >
          <td class="id-cell">#{{ employee.id }}</td>

          <td class="name-cell">
            <div class="employee-cell-flex">
              <div class="avatar-initials">
                {{ (employee.firstName?.[0] || 'E').toUpperCase() }}
              </div>
              <span class="font-medium">{{ employee.firstName }}</span>
            </div>
          </td>

          <td class="font-medium">{{ employee.lastName }}</td>

          <td class="email-cell">{{ employee.email }}</td>

          <td>
            <span class="job-title-text">{{ employee.jobTitle }}</span>
          </td>

          <td>
            <span class="badge" :class="getDepartmentBadgeClass(employee.department)">
              {{ employee.department || 'General' }}
            </span>
          </td>

          <td class="date-cell">{{ employee.hireDate || '-' }}</td>

          <td class="salary-cell">{{ formatSalary(employee.salary) }}</td>

          <td>
            <div class="actions-group">
              <!-- View / Afficher -->
              <button
                v-if="hasPermission('READ')"
                type="button"
                class="btn-icon btn-icon-view"
                title="View employee details"
                @click="emit('view', employee)"
              >
                👁
              </button>

              <!-- Edit / Modifier -->
              <button
                v-if="hasPermission('UPDATE')"
                type="button"
                class="btn-icon btn-icon-edit"
                title="Edit employee"
                @click="emit('edit', employee)"
              >
                ✏
              </button>

              <!-- Delete / Supprimer -->
              <button
                v-if="hasPermission('DELETE')"
                type="button"
                class="btn-icon btn-icon-delete"
                title="Delete employee"
                @click="emit('delete', employee)"
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

.employee-cell-flex {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-initials {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
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

.job-title-text {
  font-weight: 500;
  color: var(--text-main);
}

.date-cell {
  color: var(--text-muted);
  font-size: 13px;
}

.salary-cell {
  font-weight: 600;
  color: #059669;
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
