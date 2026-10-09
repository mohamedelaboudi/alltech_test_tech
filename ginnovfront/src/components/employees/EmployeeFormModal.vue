<script setup>
import { ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmployeePhotoUpload from './EmployeePhotoUpload.vue'
import EmployeeCvUpload from './EmployeeCvUpload.vue'
import employeeService from '@/services/employeeService'
import { useEmployeeStore } from '@/stores/employeeStore'
import { useAlertStore } from '@/stores/alertStore'
import { DEPARTMENTS, defaultCreateEmployeeForm } from '@/models/employee'
import { useFormValidation } from '@/composables/useFormValidation'
import { toApiError } from '@/models/apiError'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  employee: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])

const employeeStore = useEmployeeStore()
const alertStore = useAlertStore()

const isEdit = ref(false)
const form = ref(defaultCreateEmployeeForm())

// File upload states
const photoFile = ref(null)
const cvFile = ref(null)
const currentPhotoUrl = ref('')
const currentCvUrl = ref('')

// Independent loading states
const isUploadingPhoto = ref(false)
const isUploadingCv = ref(false)
const isDeletingPhoto = ref(false)
const isDeletingCv = ref(false)

// Confirm dialog states
const isConfirmDeletePhotoOpen = ref(false)
const isConfirmDeleteCvOpen = ref(false)

const {
  generalError,
  hasError,
  getFieldError,
  clearFieldError,
  clearErrors,
  setFieldErrors,
  handleApiError
} = useFormValidation()

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      clearErrors()
      photoFile.value = null
      cvFile.value = null
      isUploadingPhoto.value = false
      isUploadingCv.value = false
      isDeletingPhoto.value = false
      isDeletingCv.value = false
      isConfirmDeletePhotoOpen.value = false
      isConfirmDeleteCvOpen.value = false

      if (props.employee) {
        isEdit.value = true
        form.value = {
          firstName: props.employee.firstName || '',
          lastName: props.employee.lastName || '',
          email: props.employee.email || '',
          phone: props.employee.phone || '',
          jobTitle: props.employee.jobTitle || '',
          department: props.employee.department || 'Engineering',
          hireDate: props.employee.hireDate || '',
          salary:
            props.employee.salary !== null && props.employee.salary !== undefined
              ? props.employee.salary
              : null
        }
        currentPhotoUrl.value = props.employee.photoUrl || ''
        currentCvUrl.value = props.employee.cvUrl || ''
      } else {
        isEdit.value = false
        form.value = defaultCreateEmployeeForm()
        currentPhotoUrl.value = ''
        currentCvUrl.value = ''
      }
    } else {
      clearErrors()
      photoFile.value = null
      cvFile.value = null
    }
  },
  { immediate: true }
)

// Safe error message extractor that hides internal MinIO details
const getSafeErrorMessage = (err, fallbackMsg) => {
  const apiError = toApiError(err)
  const msg = apiError.message || ''
  const lower = msg.toLowerCase()
  if (
    lower.includes('minio') ||
    lower.includes('s3') ||
    lower.includes('bucket') ||
    lower.includes('xml') ||
    apiError.status === 500
  ) {
    return fallbackMsg
  }
  return msg || fallbackMsg
}

// Immediate upload handlers in Edit mode
const handleImmediateUploadPhoto = async () => {
  if (!props.employee?.id || !photoFile.value) return
  isUploadingPhoto.value = true
  try {
    const updated = await employeeService.uploadPhoto(props.employee.id, photoFile.value)
    currentPhotoUrl.value = updated?.photoUrl || currentPhotoUrl.value
    photoFile.value = null
    alertStore.showToast('Profile picture uploaded successfully.')
    await employeeStore.searchEmployees()
  } catch (err) {
    const msg = getSafeErrorMessage(err, 'Unable to upload the profile picture.')
    alertStore.showToast(msg, 'error')
  } finally {
    isUploadingPhoto.value = false
  }
}

const handleImmediateUploadCv = async () => {
  if (!props.employee?.id || !cvFile.value) return
  isUploadingCv.value = true
  try {
    const updated = await employeeService.uploadCv(props.employee.id, cvFile.value)
    currentCvUrl.value = updated?.cvUrl || currentCvUrl.value
    cvFile.value = null
    alertStore.showToast('CV uploaded successfully.')
    await employeeStore.searchEmployees()
  } catch (err) {
    const msg = getSafeErrorMessage(err, 'Unable to upload the CV.')
    alertStore.showToast(msg, 'error')
  } finally {
    isUploadingCv.value = false
  }
}

// Permanent delete handlers
const handleConfirmDeletePhoto = async () => {
  if (!props.employee?.id) return
  isDeletingPhoto.value = true
  try {
    await employeeService.deletePhoto(props.employee.id)
    currentPhotoUrl.value = ''
    alertStore.showToast('Profile picture deleted successfully.')
    await employeeStore.searchEmployees()
    isConfirmDeletePhotoOpen.value = false
  } catch (err) {
    const msg = getSafeErrorMessage(err, 'Unable to delete the profile picture.')
    alertStore.showToast(msg, 'error')
  } finally {
    isDeletingPhoto.value = false
  }
}

const handleConfirmDeleteCv = async () => {
  if (!props.employee?.id) return
  isDeletingCv.value = true
  try {
    await employeeService.deleteCv(props.employee.id)
    currentCvUrl.value = ''
    alertStore.showToast('CV deleted successfully.')
    await employeeStore.searchEmployees()
    isConfirmDeleteCvOpen.value = false
  } catch (err) {
    const msg = getSafeErrorMessage(err, 'Unable to delete the CV.')
    alertStore.showToast(msg, 'error')
  } finally {
    isDeletingCv.value = false
  }
}

const handleSubmit = () => {
  if (
    props.loading ||
    isUploadingPhoto.value ||
    isUploadingCv.value ||
    isDeletingPhoto.value ||
    isDeletingCv.value
  ) {
    return
  }
  clearErrors()

  emit('submit', {
    isEdit: isEdit.value,
    id: props.employee?.id,
    data: {
      ...form.value,
      salary:
        form.value.salary !== null && form.value.salary !== '' && !isNaN(Number(form.value.salary))
          ? Number(form.value.salary)
          : null
    },
    photoFile: photoFile.value,
    cvFile: cvFile.value,
    setUploadingPhoto: (val) => {
      isUploadingPhoto.value = val
    },
    setUploadingCv: (val) => {
      isUploadingCv.value = val
    },
    onError: (err) => handleApiError(err, 'email'),
    onSuccess: () => {
      clearErrors()
      photoFile.value = null
      cvFile.value = null
    }
  })
}

defineExpose({
  handleApiError,
  setFieldErrors,
  clearErrors,
  hasError,
  getFieldError
})
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    :title="isEdit ? 'Edit Employee' : 'Add New Employee'"
    :subtitle="
      isEdit
        ? 'Update employee personal details, role, and profile documents'
        : 'Fill in the information to onboard an employee'
    "
    max-width="660px"
    @close="emit('close')"
  >
    <form id="employeeForm" novalidate @submit.prevent="handleSubmit">
      <div v-if="generalError" class="alert-error">
        {{ generalError }}
      </div>

      <!-- Employee Information Fields -->
      <div class="form-row">
        <div class="form-group flex-1">
          <label class="form-label" for="empFirstName">
            First Name <span class="required">*</span>
          </label>
          <input
            id="empFirstName"
            v-model="form.firstName"
            type="text"
            class="form-input"
            :class="{ 'input-invalid': hasError('firstName') }"
            placeholder="e.g. Mohamed"
            @input="clearFieldError('firstName')"
          />
          <span v-if="hasError('firstName')" class="field-error-message">
            {{ getFieldError('firstName') }}
          </span>
        </div>

        <div class="form-group flex-1">
          <label class="form-label" for="empLastName">
            Last Name <span class="required">*</span>
          </label>
          <input
            id="empLastName"
            v-model="form.lastName"
            type="text"
            class="form-input"
            :class="{ 'input-invalid': hasError('lastName') }"
            placeholder="e.g. Aboudi"
            @input="clearFieldError('lastName')"
          />
          <span v-if="hasError('lastName')" class="field-error-message">
            {{ getFieldError('lastName') }}
          </span>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label class="form-label" for="empEmail">
            Email Address <span class="required">*</span>
          </label>
          <input
            id="empEmail"
            v-model="form.email"
            type="text"
            class="form-input"
            :class="{ 'input-invalid': hasError('email') }"
            placeholder="e.g. employee@company.com"
            @input="clearFieldError('email')"
          />
          <span v-if="hasError('email')" class="field-error-message">
            {{ getFieldError('email') }}
          </span>
        </div>

        <div class="form-group flex-1">
          <label class="form-label" for="empPhone">
            Phone Number
          </label>
          <input
            id="empPhone"
            v-model="form.phone"
            type="tel"
            class="form-input"
            :class="{ 'input-invalid': hasError('phone') }"
            placeholder="e.g. +212 600 000000"
            @input="clearFieldError('phone')"
          />
          <span v-if="hasError('phone')" class="field-error-message">
            {{ getFieldError('phone') }}
          </span>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label class="form-label" for="empJobTitle">
            Job Title <span class="required">*</span>
          </label>
          <input
            id="empJobTitle"
            v-model="form.jobTitle"
            type="text"
            class="form-input"
            :class="{ 'input-invalid': hasError('jobTitle') }"
            placeholder="e.g. Full Stack Engineer"
            @input="clearFieldError('jobTitle')"
          />
          <span v-if="hasError('jobTitle')" class="field-error-message">
            {{ getFieldError('jobTitle') }}
          </span>
        </div>

        <div class="form-group flex-1">
          <label class="form-label" for="empDepartment">
            Department
          </label>
          <select
            id="empDepartment"
            v-model="form.department"
            class="form-select"
            :class="{ 'input-invalid': hasError('department') }"
            @change="clearFieldError('department')"
          >
            <option v-for="dept in DEPARTMENTS" :key="dept" :value="dept">
              {{ dept }}
            </option>
          </select>
          <span v-if="hasError('department')" class="field-error-message">
            {{ getFieldError('department') }}
          </span>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label class="form-label" for="empHireDate">
            Hire Date <span class="required">*</span>
          </label>
          <input
            id="empHireDate"
            v-model="form.hireDate"
            type="date"
            class="form-input"
            :class="{ 'input-invalid': hasError('hireDate') }"
            @input="clearFieldError('hireDate')"
          />
          <span v-if="hasError('hireDate')" class="field-error-message">
            {{ getFieldError('hireDate') }}
          </span>
        </div>

        <div class="form-group flex-1">
          <label class="form-label" for="empSalary">
            Salary (USD)
          </label>
          <input
            id="empSalary"
            v-model="form.salary"
            type="number"
            step="0.01"
            min="0"
            class="form-input"
            :class="{ 'input-invalid': hasError('salary') }"
            placeholder="e.g. 75000"
            @input="clearFieldError('salary')"
          />
          <span v-if="hasError('salary')" class="field-error-message">
            {{ getFieldError('salary') }}
          </span>
        </div>
      </div>

      <!-- Dedicated Documents & Profile Section -->
      <div class="form-section-divider">
        <div class="form-section-title">
          <span class="section-icon">📁</span>
          <span>Documents & Profile</span>
        </div>
        <p class="form-section-desc">Upload and manage employee profile photo and CV document</p>
      </div>

      <div class="documents-grid">
        <!-- Profile Picture Upload Area -->
        <EmployeePhotoUpload
          v-model="photoFile"
          :current-photo-url="currentPhotoUrl"
          :is-uploading="isUploadingPhoto"
          :is-deleting="isDeletingPhoto"
          :is-edit="isEdit"
          :disabled="loading"
          @delete-existing="isConfirmDeletePhotoOpen = true"
          @upload-now="handleImmediateUploadPhoto"
        />

        <!-- CV Document Upload Area -->
        <EmployeeCvUpload
          v-model="cvFile"
          :employee-id="employee?.id"
          :employee-name="employee ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim() : ''"
          :current-cv-url="currentCvUrl"
          :is-uploading="isUploadingCv"
          :is-deleting="isDeletingCv"
          :is-edit="isEdit"
          :disabled="loading"
          @delete-existing="isConfirmDeleteCvOpen = true"
          @upload-now="handleImmediateUploadCv"
        />
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="loading || isUploadingPhoto || isUploadingCv || isDeletingPhoto || isDeletingCv"
        @click="emit('close')"
      >
        Cancel
      </button>

      <button
        type="submit"
        form="employeeForm"
        class="btn btn-primary"
        :disabled="loading || isUploadingPhoto || isUploadingCv || isDeletingPhoto || isDeletingCv"
      >
        <span v-if="loading || isUploadingPhoto || isUploadingCv" class="btn-spinner"></span>
        {{
          loading
            ? 'Saving...'
            : isUploadingPhoto
              ? 'Uploading Picture...'
              : isUploadingCv
                ? 'Uploading CV...'
                : isEdit
                  ? 'Update Employee'
                  : 'Add Employee'
        }}
      </button>
    </template>
  </BaseModal>

  <!-- Confirm Dialog for Deleting Profile Picture -->
  <ConfirmDialog
    :is-open="isConfirmDeletePhotoOpen"
    title="Delete Profile Picture"
    message="Are you sure you want to delete this employee's profile picture?"
    confirm-text="Delete Picture"
    :loading="isDeletingPhoto"
    @close="isConfirmDeletePhotoOpen = false"
    @confirm="handleConfirmDeletePhoto"
  />

  <!-- Confirm Dialog for Deleting CV Document -->
  <ConfirmDialog
    :is-open="isConfirmDeleteCvOpen"
    title="Delete CV"
    message="Are you sure you want to delete this employee's CV?"
    confirm-text="Delete CV"
    :loading="isDeletingCv"
    @close="isConfirmDeleteCvOpen = false"
    @confirm="handleConfirmDeleteCv"
  />
</template>

<style scoped>
.form-row {
  display: flex;
  gap: 16px;
}

.flex-1 {
  flex: 1;
}

.alert-error {
  padding: 10px 14px;
  background-color: var(--danger-light);
  border: 1px solid var(--danger-border);
  color: var(--danger);
  border-radius: var(--radius-md);
  font-size: 13px;
  margin-bottom: 16px;
}

.input-invalid {
  border-color: #ef4444 !important;
  background-color: #fef2f2 !important;
}

.input-invalid:focus {
  border-color: #dc2626 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18) !important;
}

.field-error-message {
  display: block;
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
  line-height: 1.3;
  font-weight: 500;
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
}

.form-section-divider {
  margin-top: 20px;
  margin-bottom: 14px;
  padding-top: 16px;
  border-top: 1px dashed var(--border-light);
}

.form-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-main);
}

.section-icon {
  font-size: 15px;
}

.form-section-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.documents-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 600px) {
  .documents-grid {
    grid-template-columns: 1fr;
  }
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
