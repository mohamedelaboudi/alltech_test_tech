<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import CvPreviewModal from './CvPreviewModal.vue'
import { formatSalary } from '@/models/employee'
import { hasPermission } from '@/utils/authorization'
import { useAlertStore } from '@/stores/alertStore'
import { toApiError } from '@/models/apiError'
import employeeService from '@/services/employeeService'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  employee: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'edit'])

const alertStore = useAlertStore()
const isGeneratingContract = ref(false)
const isCvPreviewOpen = ref(false)

const employeeFullName = computed(() => {
  if (!props.employee) return ''
  return `${props.employee.firstName || ''} ${props.employee.lastName || ''}`.trim()
})

watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) {
      isGeneratingContract.value = false
      isCvPreviewOpen.value = false
    }
  }
)

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

const handleGenerateContract = async () => {
  if (!props.employee?.id || isGeneratingContract.value) return

  isGeneratingContract.value = true
  try {
    const blob = await employeeService.getContract(props.employee.id)

    const fileBlob =
      blob instanceof Blob
        ? (blob.type ? blob : new Blob([blob], { type: 'application/pdf' }))
        : new Blob([blob], { type: 'application/pdf' })

    const downloadUrl = window.URL.createObjectURL(fileBlob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.setAttribute('download', `employee-contract-${props.employee.id}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl)
    }, 1000)

    alertStore.showToast('Contract generated successfully.', 'success')
  } catch (err) {
    let errorMessage = ''
    if (err && typeof err === 'object') {
      const maybeAxiosErr = err
      if (maybeAxiosErr.response?.data instanceof Blob) {
        try {
          const text = await maybeAxiosErr.response.data.text()
          const parsed = JSON.parse(text)
          if (parsed && typeof parsed === 'object' && parsed.message) {
            errorMessage = parsed.message
          }
        } catch {
          // Fallback to toApiError
        }
      }
    }

    if (!errorMessage) {
      const apiError = toApiError(err)
      errorMessage = apiError.message || 'Failed to generate contract.'
    }

    alertStore.showToast(errorMessage, 'error')
  } finally {
    isGeneratingContract.value = false
  }
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    title="Employee Details"
    subtitle="Full professional profile of the employee"
    max-width="540px"
    @close="emit('close')"
  >
    <div v-if="employee" class="details-content">
      <div class="employee-profile-header">
        <div v-if="employee.photoUrl" class="avatar-large avatar-has-image">
          <img :src="employee.photoUrl" :alt="employee.firstName" class="avatar-large-img" />
        </div>
        <div v-else class="avatar-large">
          {{ (employee.firstName?.[0] || 'E').toUpperCase() }}
        </div>
        <div class="employee-header-text">
          <h4>{{ employee.firstName }} {{ employee.lastName }}</h4>
          <span class="job-title-sub">{{ employee.jobTitle }} • {{ employee.department }}</span>
        </div>
      </div>

      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Employee ID</span>
          <span class="detail-val">#{{ employee.id }}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Department</span>
          <span class="detail-val">
            <span class="badge badge-primary">
              {{ employee.department || 'General' }}
            </span>
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Email Address</span>
          <span class="detail-val">{{ employee.email }}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Phone Number</span>
          <span class="detail-val">{{ employee.phone || 'Not provided' }}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Hire Date</span>
          <span class="detail-val">{{ formatDate(employee.hireDate) }}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Annual Salary</span>
          <span class="detail-val salary-highlight">
            {{ formatSalary(employee.salary) }}
          </span>
        </div>

        <div v-if="employee.createdAt" class="detail-item">
          <span class="detail-label">Registered On</span>
          <span class="detail-val">{{ formatDate(employee.createdAt) }}</span>
        </div>

        <!-- Curriculum Vitae Document Link -->
        <div class="detail-item detail-full-width">
          <span class="detail-label">Curriculum Vitae (CV)</span>
          <div v-if="employee.cvUrl" class="cv-detail-card">
            <span class="cv-detail-icon">📄</span>
            <div class="cv-detail-info">
              <span class="cv-detail-name">Curriculum Vitae Document</span>
              <span class="cv-detail-sub">PDF/Document on file</span>
            </div>
            <button
              type="button"
              class="btn-view-cv-link"
              :disabled="!employee.id"
              @click="isCvPreviewOpen = true"
            >
              View CV
            </button>
          </div>
          <span v-else class="detail-val cv-none">No CV uploaded</span>
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
        v-if="employee"
        id="btn-generate-contract"
        type="button"
        class="btn btn-contract"
        :disabled="isGeneratingContract"
        @click="handleGenerateContract"
      >
        <span v-if="isGeneratingContract" class="btn-spinner"></span>
        <span v-else class="btn-contract-icon">📄</span>
        <span>{{ isGeneratingContract ? 'Generating...' : 'Generate Contract' }}</span>
      </button>

      <button
        v-if="hasPermission('UPDATE')"
        type="button"
        class="btn btn-primary"
        @click="emit('edit', employee)"
      >
        ✏ Edit Employee
      </button>
    </template>
  </BaseModal>

  <CvPreviewModal
    :is-open="isCvPreviewOpen"
    :employee-id="employee?.id"
    :employee-name="employeeFullName"
    @close="isCvPreviewOpen = false"
  />
</template>

<style scoped>
.details-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.employee-profile-header {
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
  background: linear-gradient(135deg, #0284c7, #0369a1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.25);
}

.employee-header-text h4 {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-main);
}

.job-title-sub {
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

.salary-highlight {
  color: #059669;
  font-weight: 600;
}

.avatar-has-image {
  overflow: hidden;
  background: transparent;
  border: 2px solid var(--border-light);
}

.avatar-large-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.detail-full-width {
  grid-column: 1 / -1;
}

.cv-detail-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background-color: var(--bg-subtle);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  margin-top: 4px;
}

.cv-detail-icon {
  font-size: 24px;
}

.cv-detail-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.cv-detail-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-main);
}

.cv-detail-sub {
  font-size: 11.5px;
  color: var(--text-muted);
}

.btn-view-cv-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--primary);
  background-color: var(--primary-light);
  border: 1px solid var(--primary-border);
  border-radius: var(--radius-sm);
  text-decoration: none;
  cursor: pointer;
  transition: var(--transition);
}

.btn-view-cv-link:hover:not(:disabled) {
  background-color: #dbeafe;
}

.btn-view-cv-link:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.cv-none {
  color: var(--text-subtle);
  font-style: italic;
  font-size: 13px;
}

.btn-contract {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 500;
  color: var(--primary);
  background-color: var(--primary-light);
  border: 1px solid var(--primary-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
}

.btn-contract:hover:not(:disabled) {
  background-color: #dbeafe;
  border-color: #93c5fd;
  color: var(--primary-hover);
  transform: translateY(-1px);
}

.btn-contract:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.btn-contract-icon {
  font-size: 15px;
  line-height: 1;
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(37, 99, 235, 0.3);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
