<script setup>
import { ref, watch, onUnmounted } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import employeeService from '@/services/employeeService'
import { toApiError } from '@/models/apiError'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  employeeId: {
    type: [Number, String],
    default: null
  },
  employeeName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const isLoading = ref(false)
const errorMessage = ref('')
const objectUrl = ref('')
const isPdf = ref(false)
const fileName = ref('employee-cv.pdf')

const revokeObjectUrl = () => {
  if (objectUrl.value) {
    window.URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = ''
  }
}

const sniffPdfHeader = async (blob) => {
  try {
    const headerBytes = new Uint8Array(await blob.slice(0, 5).arrayBuffer())
    const header = String.fromCharCode(...headerBytes)
    return header.startsWith('%PDF')
  } catch {
    return false
  }
}

const isWordDocument = (blob) => {
  const type = (blob.type || '').toLowerCase()
  return (
    type.includes('msword') ||
    type.includes('wordprocessingml') ||
    type.includes('officedocument.wordprocessing')
  )
}

const loadCv = async () => {
  if (!props.employeeId) {
    errorMessage.value = 'Unable to load CV: missing employee.'
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  isPdf.value = false
  revokeObjectUrl()

  try {
    const blob = await employeeService.getCv(props.employeeId)

    if (!(blob instanceof Blob) || blob.size === 0) {
      errorMessage.value = 'The CV file could not be loaded.'
      return
    }

    const looksLikePdf = (blob.type || '').toLowerCase().includes('pdf') || (await sniffPdfHeader(blob))

    if (looksLikePdf) {
      const pdfBlob =
        blob.type && blob.type.toLowerCase().includes('pdf')
          ? blob
          : new Blob([blob], { type: 'application/pdf' })
      objectUrl.value = window.URL.createObjectURL(pdfBlob)
      isPdf.value = true
      fileName.value = `employee-cv-${props.employeeId}.pdf`
      return
    }

    if (isWordDocument(blob)) {
      objectUrl.value = window.URL.createObjectURL(blob)
      isPdf.value = false
      const ext = blob.type.toLowerCase().includes('wordprocessingml') ? 'docx' : 'doc'
      fileName.value = `employee-cv-${props.employeeId}.${ext}`
      return
    }

    objectUrl.value = window.URL.createObjectURL(blob)
    isPdf.value = false
    fileName.value = `employee-cv-${props.employeeId}`
  } catch (err) {
    const apiError = toApiError(err)
    errorMessage.value = apiError.message || 'Failed to load the CV document.'
  } finally {
    isLoading.value = false
  }
}

const handleDownload = () => {
  if (!objectUrl.value) return
  const link = document.createElement('a')
  link.href = objectUrl.value
  link.setAttribute('download', fileName.value)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleClose = () => {
  emit('close')
}

watch(
  () => [props.isOpen, props.employeeId],
  ([open]) => {
    if (open) {
      loadCv()
    } else {
      revokeObjectUrl()
      errorMessage.value = ''
      isLoading.value = false
      isPdf.value = false
    }
  }
)

onUnmounted(() => {
  revokeObjectUrl()
})
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    :title="employeeName ? `CV — ${employeeName}` : 'Curriculum Vitae'"
    subtitle="Preview the employee CV without leaving the application"
    max-width="960px"
    :z-index="1160"
    trap-escape
    flush-body
    @close="handleClose"
  >
    <div class="cv-preview-shell">
      <div v-if="isLoading" class="cv-preview-state">
        <span class="cv-preview-spinner"></span>
        <p>Loading CV…</p>
      </div>

      <div v-else-if="errorMessage" class="cv-preview-state cv-preview-error">
        <p>{{ errorMessage }}</p>
        <button type="button" class="btn btn-secondary" @click="loadCv">
          Try again
        </button>
      </div>

      <iframe
        v-else-if="objectUrl && isPdf"
        :src="objectUrl"
        class="cv-preview-frame"
        title="Employee CV preview"
      />

      <div v-else-if="objectUrl" class="cv-preview-state">
        <p>
          This CV is not a PDF, so it cannot be previewed in the browser.
          You can download it to open it locally.
        </p>
        <button type="button" class="btn btn-primary" @click="handleDownload">
          Download CV
        </button>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn-secondary" @click="handleClose">
        Close
      </button>
      <button
        v-if="objectUrl && !isLoading && !errorMessage"
        type="button"
        class="btn btn-primary"
        @click="handleDownload"
      >
        Download
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.cv-preview-shell {
  display: flex;
  flex-direction: column;
  min-height: min(78vh, 820px);
  background: #e2e8f0;
}

.cv-preview-frame {
  width: 100%;
  flex: 1;
  min-height: min(78vh, 820px);
  border: none;
  background: #525659;
}

.cv-preview-state {
  flex: 1;
  min-height: min(78vh, 820px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 32px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  background: var(--bg-surface);
}

.cv-preview-error {
  color: var(--danger);
}

.cv-preview-spinner {
  display: inline-block;
  width: 28px;
  height: 28px;
  border: 3px solid rgba(37, 99, 235, 0.2);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: cv-spin 0.8s linear infinite;
}

@keyframes cv-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
