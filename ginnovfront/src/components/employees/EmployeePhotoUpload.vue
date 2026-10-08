<script setup>
import { ref, watch, onUnmounted, computed } from 'vue'
import { validatePhotoFile, formatFileSize } from '@/utils/fileValidation'

const props = defineProps({
  modelValue: {
    type: Object, // File
    default: null
  },
  currentPhotoUrl: {
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
const previewUrl = ref('')
const errorMessage = ref('')
const isDragOver = ref(false)

// Cleanup object URL to prevent memory leaks
const revokePreview = () => {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
}

onUnmounted(() => {
  revokePreview()
})

watch(
  () => props.modelValue,
  (newFile) => {
    revokePreview()
    if (newFile instanceof File) {
      previewUrl.value = URL.createObjectURL(newFile)
    } else {
      previewUrl.value = ''
    }
  },
  { immediate: true }
)

// Active display image: newly selected preview > existing photo URL > empty
const activeImageSrc = computed(() => {
  if (previewUrl.value) return previewUrl.value
  if (props.currentPhotoUrl) return props.currentPhotoUrl
  return ''
})

const hasExistingPhoto = computed(() => {
  return Boolean(props.currentPhotoUrl && !props.modelValue)
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
  // Reset input so re-selecting same file triggers change
  if (e.target) {
    e.target.value = ''
  }
}

const processFile = (file) => {
  errorMessage.value = ''
  const result = validatePhotoFile(file)
  if (!result.valid) {
    errorMessage.value = result.error || 'Invalid file.'
    return
  }
  emit('update:modelValue', file)
}

const handleRemoveSelection = () => {
  revokePreview()
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
  <div class="photo-upload-card" :class="{ 'drag-over': isDragOver }">
    <div class="upload-header">
      <span class="upload-title">Profile Picture</span>
      <span class="upload-badge">JPG, PNG, WEBP</span>
    </div>

    <!-- Hidden native file input -->
    <input
      ref="fileInputRef"
      type="file"
      class="hidden-file-input"
      accept="image/jpeg,image/png,image/webp"
      @change="handleFileChange"
    />

    <!-- Main Content Area -->
    <div
      class="photo-content"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- Preview Circle -->
      <div class="avatar-preview-container">
        <div v-if="activeImageSrc" class="avatar-preview-frame">
          <img
            :src="activeImageSrc"
            alt="Profile Preview"
            class="avatar-image"
          />
          <div v-if="isUploading || isDeleting" class="avatar-overlay">
            <span class="spinner-small"></span>
          </div>
        </div>

        <div v-else class="avatar-placeholder">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      </div>

      <!-- Details & Actions -->
      <div class="upload-body">
        <!-- 1. Existing picture on backend -->
        <div v-if="hasExistingPhoto" class="state-existing">
          <div class="status-indicator">
            <span class="status-dot success"></span>
            <span class="status-text">Current picture saved</span>
          </div>

          <div class="actions-row">
            <button
              type="button"
              class="btn-subtle"
              :disabled="disabled || isUploading || isDeleting"
              @click="triggerFileInput"
            >
              <span class="btn-icon-symbol">📷</span>
              Change Picture
            </button>

            <button
              type="button"
              class="btn-subtle btn-danger-subtle"
              :disabled="disabled || isUploading || isDeleting"
              @click="emit('delete-existing')"
            >
              <span v-if="isDeleting" class="spinner-inline"></span>
              <span v-else class="btn-icon-symbol">🗑</span>
              {{ isDeleting ? 'Removing...' : 'Remove' }}
            </button>
          </div>
        </div>

        <!-- 2. Newly selected file (pending submission/upload) -->
        <div v-else-if="hasPendingSelection" class="state-selected">
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

        <!-- 3. No file selected -->
        <div v-else class="state-empty">
          <p class="drop-hint">Drop image here or click browse</p>
          <button
            type="button"
            class="btn-choose"
            :disabled="disabled"
            @click="triggerFileInput"
          >
            <span class="btn-icon-symbol">📁</span>
            Choose Picture
          </button>
          <span class="format-help">Max size: 5 MB</span>
        </div>

        <!-- Validation Error Message -->
        <div v-if="errorMessage" class="error-text">
          ⚠️ {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.photo-upload-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  transition: var(--transition);
}

.photo-upload-card.drag-over {
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

.photo-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-preview-container {
  flex-shrink: 0;
}

.avatar-preview-frame {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  background-color: var(--bg-subtle);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background-color: var(--bg-subtle);
  border: 2px dashed var(--border-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-subtle);
  transition: var(--transition);
}

.photo-upload-card.drag-over .avatar-placeholder {
  border-color: var(--primary);
  color: var(--primary);
}

.upload-body {
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
}

.btn-subtle:hover:not(:disabled) {
  background-color: var(--border-light);
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

.actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
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
  margin-top: 2px;
}

.spinner-inline, .spinner-small {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 4px;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border-width: 2px;
  border-color: white;
  border-top-color: transparent;
  margin-right: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
