<script setup>
import { ref, onMounted } from 'vue'
import { useEmployeeStore } from '@/stores/employeeStore'
import { useAlertStore } from '@/stores/alertStore'
import { hasPermission } from '@/utils/authorization'
import { toApiError } from '@/models/apiError'
import employeeService from '@/services/employeeService'
import EmployeeSearch from '@/components/employees/EmployeeSearch.vue'
import EmployeePagination from '@/components/employees/EmployeePagination.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmployeeTable from '@/components/employees/EmployeeTable.vue'
import EmployeeFormModal from '@/components/employees/EmployeeFormModal.vue'
import EmployeeDetailModal from '@/components/employees/EmployeeDetailModal.vue'

const employeeStore = useEmployeeStore()
const alertStore = useAlertStore()

// Modal states
const employeeFormRef = ref(null)
const isFormModalOpen = ref(false)
const selectedEmployeeForForm = ref(null)

const isDetailModalOpen = ref(false)
const selectedEmployeeForDetail = ref(null)

const isDeleteModalOpen = ref(false)
const employeeToDelete = ref(null)
const deleteLoading = ref(false)

const triggerToast = (msg, type = 'success') => {
  alertStore.showToast(msg, type)
}

// Initial fetch
onMounted(() => {
  employeeStore.searchEmployees()
})

// Action Handlers
const openCreateModal = () => {
  selectedEmployeeForForm.value = null
  isFormModalOpen.value = true
}

const openEditModal = (employee) => {
  selectedEmployeeForForm.value = { ...employee }
  isDetailModalOpen.value = false
  isFormModalOpen.value = true
}

const openViewModal = (employee) => {
  selectedEmployeeForDetail.value = employee
  isDetailModalOpen.value = true
}

const openDeleteConfirm = (employee) => {
  employeeToDelete.value = employee
  isDeleteModalOpen.value = true
}

// Handle Form Submission (Create or Update)
const handleFormSubmit = async (payload) => {
  const {
    isEdit,
    id,
    data,
    photoFile,
    cvFile,
    setUploadingPhoto,
    setUploadingCv,
    onError,
    onSuccess
  } = payload

  try {
    let savedEmployee
    if (isEdit) {
      savedEmployee = await employeeStore.updateEmployee(id, data)
      triggerToast(`Employee "${data.firstName} ${data.lastName}" updated successfully!`)
    } else {
      savedEmployee = await employeeStore.createEmployee(data)
      triggerToast(`Employee "${data.firstName} ${data.lastName}" created successfully!`)
    }

    const employeeId = isEdit ? id : savedEmployee?.id

    // Upload profile picture if one was selected
    if (photoFile && employeeId) {
      setUploadingPhoto?.(true)
      try {
        await employeeService.uploadPhoto(employeeId, photoFile)
        triggerToast('Profile picture uploaded successfully.')
      } catch (photoErr) {
        const apiErr = toApiError(photoErr)
        const msg =
          apiErr.message && !apiErr.message.toLowerCase().includes('minio') && apiErr.status !== 500
            ? apiErr.message
            : 'Unable to upload the profile picture.'
        triggerToast(msg, 'error')
      } finally {
        setUploadingPhoto?.(false)
      }
    }

    // Upload CV if one was selected
    if (cvFile && employeeId) {
      setUploadingCv?.(true)
      try {
        await employeeService.uploadCv(employeeId, cvFile)
        triggerToast('CV uploaded successfully.')
      } catch (cvErr) {
        const apiErr = toApiError(cvErr)
        const msg =
          apiErr.message && !apiErr.message.toLowerCase().includes('minio') && apiErr.status !== 500
            ? apiErr.message
            : 'Unable to upload the CV.'
        triggerToast(msg, 'error')
      } finally {
        setUploadingCv?.(false)
      }
    }

    // Refresh employee list if any file was uploaded so URLs are updated
    if (photoFile || cvFile) {
      await employeeStore.searchEmployees()
    }

    isFormModalOpen.value = false
    onSuccess?.()
  } catch (err) {
    const apiError = toApiError(err)
    onError?.(apiError)
    employeeFormRef.value?.handleApiError(apiError)

    // Show toast for generic errors not represented as field-level errors
    if (!apiError.hasFieldErrors && !apiError.isEmailConflict) {
      triggerToast(apiError.message, 'error')
    }
  }
}

// Handle Delete Confirmation
const handleDeleteConfirm = async () => {
  if (!employeeToDelete.value) return
  deleteLoading.value = true
  try {
    const fullName = `${employeeToDelete.value.firstName} ${employeeToDelete.value.lastName}`
    await employeeStore.deleteEmployee(employeeToDelete.value.id)
    triggerToast(`Employee "${fullName}" deleted successfully.`)
    isDeleteModalOpen.value = false
    employeeToDelete.value = null
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
      <div v-if="employeeStore.error" class="error-banner">
        <div class="error-banner-content">
          <span class="error-banner-icon">⚠️</span>
          <div class="error-banner-text">
            <strong>Backend Error:</strong>
            <span>{{ employeeStore.error }}</span>
          </div>
        </div>
        <button
          type="button"
          class="btn btn-secondary btn-sm retry-btn"
          :disabled="employeeStore.loading"
          @click="employeeStore.searchEmployees()"
        >
          {{ employeeStore.loading ? 'Retrying...' : 'Retry' }}
        </button>
      </div>

      <!-- Employee Search Form -->
      <div class="search-section">
        <EmployeeSearch />
      </div>

      <!-- Employees Table -->
      <div class="table-section">
        <EmployeeTable
          :employees="employeeStore.employees"
          :loading="employeeStore.loading"
          @view="openViewModal"
          @edit="openEditModal"
          @delete="openDeleteConfirm"
        />
      </div>

      <!-- Pagination -->
      <div class="pagination-section">
        <EmployeePagination />
      </div>

      <!-- Add Employee Button placed under the table (conditionally displayed if user has CREATE permission) -->
      <div v-if="hasPermission('CREATE')" class="bottom-action-container">
        <button
          type="button"
          class="btn btn-primary add-entity-btn"
          @click="openCreateModal"
        >
          <span class="btn-icon-plus">+</span>
          <span>Add Employee</span>
        </button>
      </div>
    </div>

    <!-- Modals -->
    <!-- Create / Edit Employee Form Modal -->
    <EmployeeFormModal
      ref="employeeFormRef"
      :is-open="isFormModalOpen"
      :employee="selectedEmployeeForForm"
      :loading="employeeStore.loading"
      @close="isFormModalOpen = false"
      @submit="handleFormSubmit"
    />

    <!-- View Employee Details Modal -->
    <EmployeeDetailModal
      :is-open="isDetailModalOpen"
      :employee="selectedEmployeeForDetail"
      @close="isDetailModalOpen = false"
      @edit="openEditModal"
    />

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :is-open="isDeleteModalOpen"
      title="Delete Employee"
      message="Are you sure you want to delete this employee?"
      :item-name="employeeToDelete ? `${employeeToDelete.firstName} ${employeeToDelete.lastName}` : ''"
      confirm-text="Delete Employee"
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
</style>
