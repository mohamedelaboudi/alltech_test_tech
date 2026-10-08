<script setup>
import { ref, computed } from 'vue'
import { validateCvFile, formatFileSize } from '@/utils/fileValidation'

const props = defineProps({
  modelValue: {
    type: Object, // File
    default: null
  },
  currentCvUrl: {
    type: String,
    default: ''
  },
  isUploading: {
    type: Boolean,
    default: false
  },
  isDeleting: {
    type: Boolean,
    default: false
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'delete-existing', 'upload-now'])

const fileInputRef = ref(null)
const errorMessage = ref('')
const isDragOver = ref(false)

const hasExistingCv = computed(() => {
  return Boolean(props.currentCvUrl && !props.modelValue)
})

const hasPendingSelection = computed(() => {
  return Boolean(props.modelValue)
})

const triggerFileInput = () => {
  if (props.disabled || props.isUploading || props.isDeleting) return
  errorMessage.value = ''
  fileInputRef.value?.click()
}

const handleFileChange = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    processFile(file)
  }
  if (e.target) {
    e.target.value = ''
  }
}

const processFile = (file) => {
  errorMessage.value = ''
  const result = validateCvFile(file)
  if (!result.valid) {
    errorMessage.value = result.error || 'Invalid document.'
    return
  }
  emit('update:modelValue', file)
}

const handleRemoveSelection = () => {
  errorMessage.value = ''
  emit('update:modelValue', null)
}

const handleDragOver = (e) => {
  e.preventDefault()
  if (!props.disabled) isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (e) => {
  e.preventDefault()
  isDragOver.value = false
  if (props.disabled || props.isUploading || props.isDeleting) return

  const file = e.dataTransfer?.files?.[0]
  if (file) {
    processFile(file)
  }
}
</script>

<template>
  <div class="cv-upload-card" :class="{ 'drag-over': isDragOver }">
    <div class="upload-header">
      <span class="upload-title">CV / Resume</span>
      <span class="upload-badge">PDF, DOC, DOCX</span>
    </div>

    <!-- Hidden native file input -->
    <input
      ref="fileInputRef"
      type="file"
      class="hidden-file-input"
      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      @change="handleFileChange"
    />

    <!-- Main Content Area -->
    <div
      class="cv-content"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- 1. Existing CV on backend -->
      <div v-if="hasExistingCv" class="cv-existing-box">
        <div class="cv-doc-icon-wrapper">
          <span class="doc-icon">📄</span>
        </div>

        <div class="cv-existing-info">
          <div class="status-indicator">
            <span class="status-dot success"></span>
            <span class="status-text">CV document on file</span>
          </div>

          <div class="cv-actions">
            <!-- View CV in new tab -->
            <a
              :href="currentCvUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-subtle btn-view-cv"
              title="View CV in new tab"
            >
              <span class="btn-icon-symbol">👁</span>
              View CV
            </a>

            <!-- Replace CV -->
            <button
              type="button"
              class="btn-subtle"
              :disabled="disabled || isUploading || isDeleting"
              @click="triggerFileInput"
            >
              <span class="btn-icon-symbol">🔄</span>
              Replace
            </button>

            <!-- Delete CV -->
            <button
              type="button"
              class="btn-subtle btn-danger-subtle"
              :disabled="disabled || isUploading || isDeleting"
              @click="emit('delete-existing')"
            >
              <span v-if="isDeleting" class="spinner-inline"></span>
              <span v-else class="btn-icon-symbol">🗑</span>
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 2. Newly selected CV file (pending upload/save) -->
      <div v-else-if="hasPendingSelection" class="cv-selected-box">
        <div class="cv-doc-icon-wrapper active">
          <span class="doc-icon">📄</span>
        </div>

        <div class="cv-selected-info">
          <div class="file-info-badge">
            <span class="file-name" :title="modelValue?.name">{{ modelValue?.name }}</span>
            <span class="file-meta">({{ formatFileSize(modelValue?.size || 0) }})</span>
          </div>

          <div class="actions-row">
            <button
              v-if="isEdit"
              type="button"
              class="btn-subtle btn-upload-now"
              :disabled="disabled || isUploading"
              @click="emit('upload-now')"
            >
              <span v-if="isUploading" class="spinner-inline"></span>
              <span v-else class="btn-icon-symbol">⬆</span>
              {{ isUploading ? 'Uploading...' : 'Upload Now' }}
            </button>

            <button
              type="button"
              class="btn-subtle"
              :disabled="disabled || isUploading"
              @click="triggerFileInput"
            >
              Change
            </button>

            <button
              type="button"
              class="btn-subtle btn-danger-subtle"
              :disabled="disabled || isUploading"
              @click="handleRemoveSelection"
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      <!-- 3. Empty state: no file selected -->
      <div v-else class="cv-empty-box">
        <div class="cv-empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>

        <div class="cv-empty-content">
          <p class="drop-hint">Drop CV here or click browse</p>
          <button
            type="button"
            class="btn-choose"
            :disabled="disabled"
            @click="triggerFileInput"
          >
            <span class="btn-icon-symbol">📄</span>
            Choose CV
          </button>
          <span class="format-help">Max size: 10 MB</span>
        </div>
      </div>

      <!-- Validation Error -->
      <div v-if="errorMessage" class="error-text">
        ⚠️ {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.cv-upload-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  transition: var(--transition);
}

.cv-upload-card.drag-over {
  border-color: var(--primary);
  background-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.upload-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.upload-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.upload-badge {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-subtle);
  background-color: var(--bg-subtle);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.hidden-file-input {
  display: none;
}

.cv-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cv-existing-box,
.cv-selected-box {
  display: flex;
  align-items: center;
  gap: 14px;
}

.cv-empty-box {
  display: flex;
  align-items: center;
  gap: 14px;
}

.cv-doc-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: #f1f5f9;
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cv-doc-icon-wrapper.active {
  background-color: #eff6ff;
  border-color: #bfdbfe;
}

.doc-icon {
  font-size: 24px;
}

.cv-empty-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: var(--bg-subtle);
  border: 2px dashed var(--border-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-subtle);
  flex-shrink: 0;
  transition: var(--transition);
}

.cv-upload-card.drag-over .cv-empty-icon {
  border-color: var(--primary);
  color: var(--primary);
}

.cv-empty-content,
.cv-existing-info,
.cv-selected-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.drop-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.format-help {
  font-size: 11px;
  color: var(--text-subtle);
}

.btn-choose {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--primary);
  background-color: var(--primary-light);
  border: 1px solid var(--primary-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  width: fit-content;
}

.btn-choose:hover:not(:disabled) {
  background-color: #dbeafe;
  border-color: #93c5fd;
}

.btn-subtle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-main);
  background-color: var(--bg-subtle);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  text-decoration: none;
}

.btn-subtle:hover:not(:disabled) {
  background-color: var(--border-light);
}

.btn-view-cv {
  color: #0284c7;
  background-color: #f0f9ff;
  border-color: #bae6fd;
}

.btn-view-cv:hover {
  background-color: #e0f2fe;
}

.btn-upload-now {
  color: var(--primary);
  background-color: var(--primary-light);
  border-color: var(--primary-border);
}

.btn-upload-now:hover:not(:disabled) {
  background-color: #dbeafe;
}

.btn-danger-subtle {
  color: var(--danger);
  border-color: var(--danger-border);
  background-color: var(--danger-light);
}

.btn-danger-subtle:hover:not(:disabled) {
  background-color: #fee2e2;
  border-color: #fca5a5;
}

.btn-icon-symbol {
  font-size: 13px;
  line-height: 1;
}

.actions-row,
.cv-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #94a3b8;
}

.status-dot.success {
  background-color: var(--success);
}

.status-text {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}

.file-info-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-name {
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 11.5px;
  color: var(--text-muted);
}

.error-text {
  font-size: 11.5px;
  color: var(--danger);
  font-weight: 500;
  margin-top: 4px;
}

.spinner-inline {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 4px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
