<script setup>
import { computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { useAuthorization } from '@/utils/authorization'

const { hasPermission } = useAuthorization()

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'edit'])

const userPermissions = computed(() => {
  if (props.user?.userType === 'SUPER_ADMIN') {
    return ['CREATE', 'READ', 'UPDATE', 'DELETE']
  }
  if (!props.user?.permissions) return []
  const list = Array.isArray(props.user.permissions)
    ? props.user.permissions
    : Array.from(props.user.permissions)
  return list
    .map((p) => (typeof p === 'string' ? p : p?.name || p?.permission || p?.permissionType || ''))
    .filter(Boolean)
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    title="User Details"
    subtitle="Full profile information for this user"
    max-width="500px"
    @close="emit('close')"
  >
    <div v-if="user" class="details-content">
      <div class="user-profile-header">
        <div class="avatar-large">
          {{ (user.firstName?.[0] || 'U').toUpperCase() }}
        </div>
        <div class="user-header-text">
          <h4>{{ user.firstName }} {{ user.lastName }}</h4>
          <span class="email-sub">{{ user.email }}</span>
        </div>
      </div>

      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">User ID</span>
          <span class="detail-val">#{{ user.id }}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">User Type / Role</span>
          <span class="detail-val">
            <span
              class="badge"
              :class="user.userType === 'SUPER_ADMIN' ? 'badge-primary' : 'badge-muted'"
            >
              {{ user.userType === 'SUPER_ADMIN' ? 'Super Admin' : 'Normal User' }}
            </span>
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Account Status</span>
          <span class="detail-val">
            <span
              class="badge"
              :class="user.enabled !== false ? 'badge-success' : 'badge-warning'"
            >
              {{ user.enabled !== false ? 'Active' : 'Disabled' }}
            </span>
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Created At</span>
          <span class="detail-val">{{ formatDate(user.createdAt) }}</span>
        </div>

        <div class="detail-item full-width">
          <span class="detail-label">Permissions</span>
          <div class="detail-permissions-list">
            <span
              v-for="perm in userPermissions"
              :key="perm"
              class="badge badge-primary perm-chip"
            >
              {{ perm }}
            </span>
            <span
              v-if="userPermissions.length === 0"
              class="text-muted-inline"
            >
              No permissions assigned
            </span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        @click="emit('close')"
      >
        Close
      </button>

      <button
        v-if="hasPermission('UPDATE')"
        type="button"
        class="btn btn-primary"
        @click="emit('edit', user)"
      >
        ✏ Edit User
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.details-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}

.avatar-large {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.25);
}

.user-header-text h4 {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-main);
}

.email-sub {
  font-size: 13px;
  color: var(--text-muted);
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-subtle);
  font-weight: 600;
}

.detail-val {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.full-width {
  grid-column: 1 / -1;
}

.detail-permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-top: 2px;
}

.perm-chip {
  font-size: 11.5px;
  font-weight: 600;
}

.text-muted-inline {
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
}
</style>
