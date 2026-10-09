<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useAlertStore } from '@/stores/alertStore'
import { useAuthorization } from '@/utils/authorization'
import { toApiError } from '@/models/apiError'
import UserSearch from '@/components/users/UserSearch.vue'
import UserPagination from '@/components/users/UserPagination.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import UserTable from '@/components/users/UserTable.vue'
import UserFormModal from '@/components/users/UserFormModal.vue'
import UserDetailModal from '@/components/users/UserDetailModal.vue'

const userStore = useUserStore()
const alertStore = useAlertStore()
const { hasPermission } = useAuthorization()

// Modal states
const userFormRef = ref(null)
const isFormModalOpen = ref(false)
const selectedUserForForm = ref(null)

const isDetailModalOpen = ref(false)
const selectedUserForDetail = ref(null)

const isDeleteModalOpen = ref(false)
const userToDelete = ref(null)
const deleteLoading = ref(false)

const triggerToast = (msg, type = 'success') => {
  alertStore.showToast(msg, type)
}

// Initial fetch: only if authenticated user has READ permission
onMounted(() => {
  if (hasPermission('READ')) {
    userStore.searchUsers()
  }
})

// Action Handlers
const openCreateModal = () => {
  selectedUserForForm.value = null
  isFormModalOpen.value = true
}

const openEditModal = (user) => {
  selectedUserForForm.value = { ...user }
  isDetailModalOpen.value = false
  isFormModalOpen.value = true
}

const openViewModal = (user) => {
  selectedUserForDetail.value = user
  isDetailModalOpen.value = true
}

const openDeleteConfirm = (user) => {
  userToDelete.value = user
  isDeleteModalOpen.value = true
}

// Handle Form Submission (Create or Update)
const handleFormSubmit = async (payload) => {
  const { isEdit, id, data, onError, onSuccess } = payload
  try {
    if (isEdit) {
      const updated = await userStore.updateUser(id, data)
      if (selectedUserForDetail.value && selectedUserForDetail.value.id === id) {
        selectedUserForDetail.value = updated || { ...selectedUserForDetail.value, ...data }
      }
      triggerToast(`User "${data.firstName} ${data.lastName}" updated successfully!`)
    } else {
      await userStore.createUser(data)
      triggerToast(`User "${data.firstName} ${data.lastName}" created successfully!`)
    }
    isFormModalOpen.value = false
    onSuccess?.()
  } catch (err) {
    const apiError = toApiError(err)
    onError?.(apiError)
    userFormRef.value?.handleApiError(apiError)

    // Show toast for generic errors not represented as field-level errors
    if (!apiError.hasFieldErrors && !apiError.isEmailConflict) {
      triggerToast(apiError.message, 'error')
    }
  }
}

// Handle Delete Confirmation
const handleDeleteConfirm = async () => {
  if (!userToDelete.value) return
  deleteLoading.value = true
  try {
    const fullName = `${userToDelete.value.firstName} ${userToDelete.value.lastName}`
    await userStore.deleteUser(userToDelete.value.id)
    triggerToast(`User "${fullName}" deleted successfully.`)
    isDeleteModalOpen.value = false
    userToDelete.value = null
  } catch (err) {
    const apiError = toApiError(err)
    triggerToast(apiError.message, 'error')
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="management-page fade-in">
    <!-- Page Header -->
    <div class="page-header"></div>

    <!-- Main Container Card -->
    <div class="panel-card content-card">
      <!-- Backend Error / Offline Banner -->
      <div v-if="userStore.error" class="error-banner">
        <div class="error-banner-content">
          <span class="error-banner-icon">⚠️</span>
          <div class="error-banner-text">
            <strong>Backend Error:</strong>
            <span>{{ userStore.error }}</span>
          </div>
        </div>
        <button
          type="button"
          class="btn btn-secondary btn-sm retry-btn"
          :disabled="userStore.loading"
          @click="userStore.searchUsers()"
        >
          {{ userStore.loading ? 'Retrying...' : 'Retry' }}
        </button>
      </div>

      <!-- Restricted Access state if user lacks READ permission -->
      <div v-if="!hasPermission('READ')" class="permission-restricted-panel">
        <div class="restricted-icon">🔒</div>
        <h3>Access Restricted</h3>
        <p>You do not have the <strong>READ</strong> permission required to view users.</p>
        <p class="restricted-sub">Please contact your system administrator if you believe this is an error.</p>
      </div>

      <template v-else>
        <!-- User Search Form -->
        <div class="search-section">
          <UserSearch />
        </div>

        <!-- Users Table -->
        <div class="table-section">
          <UserTable
            :users="userStore.users"
            :loading="userStore.loading"
            @view="openViewModal"
            @edit="openEditModal"
            @delete="openDeleteConfirm"
          />
        </div>

        <!-- Pagination -->
        <div class="pagination-section">
          <UserPagination />
        </div>
      </template>

      <!-- Add User Button placed under the table (CREATE permission required) -->
      <div v-if="hasPermission('CREATE')" class="bottom-action-container">
        <button
          type="button"
          class="btn btn-primary add-entity-btn"
          @click="openCreateModal"
        >
          <span class="btn-icon-plus">+</span>
          <span>Add User</span>
        </button>
      </div>
    </div>

    <!-- Modals -->
    <!-- Create / Edit User Form Modal -->
    <UserFormModal
      ref="userFormRef"
      :is-open="isFormModalOpen"
      :user="selectedUserForForm"
      :loading="userStore.loading"
      @close="isFormModalOpen = false"
      @submit="handleFormSubmit"
    />

    <!-- View User Details Modal -->
    <UserDetailModal
      :is-open="isDetailModalOpen"
      :user="selectedUserForDetail"
      @close="isDetailModalOpen = false"
      @edit="openEditModal"
    />

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :is-open="isDeleteModalOpen"
      title="Delete User"
      message="Are you sure you want to delete this user?"
      :item-name="userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : ''"
      confirm-text="Delete User"
      :loading="deleteLoading"
      @close="isDeleteModalOpen = false"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<style scoped>
.management-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.content-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
}

.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 18px;
  background-color: var(--danger-light);
  border: 1px solid var(--danger-border);
  border-radius: var(--radius-md);
  color: var(--danger);
  font-size: 13.5px;
}

.error-banner-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.error-banner-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.retry-btn {
  white-space: nowrap;
  padding: 6px 14px;
  font-size: 13px;
}

.search-section {
  width: 100%;
}

.table-section {
  width: 100%;
}

.pagination-section {
  border-top: 1px solid var(--border-light);
  padding-top: 12px;
}

.bottom-action-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px dashed var(--border-light);
}

.add-entity-btn {
  padding: 12px 28px;
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--radius-md);
}

.btn-icon-plus {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.permission-restricted-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--border-light);
}

.restricted-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.permission-restricted-panel h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 8px;
}

.permission-restricted-panel p {
  font-size: 14px;
  color: var(--text-muted);
  max-width: 420px;
  margin: 0;
}

.restricted-sub {
  margin-top: 6px !important;
  font-size: 13px !important;
}
</style>
