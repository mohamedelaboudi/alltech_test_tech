<script setup>
import { ref, reactive, watch, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseMultiSelect from '@/components/common/BaseMultiSelect.vue'
import { isPermissionType } from '@/stores/authStore'
import { useFormValidation } from '@/composables/useFormValidation'

const PERMISSION_OPTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE']
const ALL_PERMISSIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE']

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])

const isEdit = ref(false)

const {
  generalError,
  hasError,
  getFieldError,
  clearFieldError,
  clearErrors,
  setFieldErrors,
  handleApiError
} = useFormValidation()

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  userType: 'NORMAL_USER',
  enabled: true,
  permissions: []
})

const isSuperAdmin = computed(() => form.userType === 'SUPER_ADMIN')

// Safely normalize permissions coming from user object
const parseExistingPermissions = (perms) => {
  if (!perms) return []
  const list = Array.isArray(perms) ? perms : Array.from(perms)
  return list
    .map((p) => (typeof p === 'string' ? p : p?.name || p?.permission || p?.permissionType || ''))
    .filter(isPermissionType)
}

// Watch userType to auto-grant all permissions if SUPER_ADMIN
watch(
  () => form.userType,
  (newType) => {
    if (newType === 'SUPER_ADMIN') {
      form.permissions = [...ALL_PERMISSIONS]
    } else if (newType === 'NORMAL_USER') {
      // If switching back to NORMAL_USER in edit mode, restore original user permissions if present
      if (isEdit.value && props.user?.userType !== 'SUPER_ADMIN' && props.user?.permissions) {
        form.permissions = parseExistingPermissions(props.user.permissions)
      }
    }
  }
)

// Synchronize form when user prop changes or modal opens
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      clearErrors()
      if (props.user) {
        isEdit.value = true
        form.firstName = props.user.firstName || ''
        form.lastName = props.user.lastName || ''
        form.email = props.user.email || ''
        form.password = ''
        form.userType = props.user.userType || 'NORMAL_USER'
        form.enabled = props.user.enabled !== false

        if (form.userType === 'SUPER_ADMIN') {
          form.permissions = [...ALL_PERMISSIONS]
        } else {
          form.permissions = parseExistingPermissions(props.user.permissions)
        }
      } else {
        isEdit.value = false
        form.firstName = ''
        form.lastName = ''
        form.email = ''
        form.password = ''
        form.userType = 'NORMAL_USER'
        form.enabled = true
        form.permissions = []
      }
    } else {
      clearErrors()
    }
  },
  { immediate: true }
)

const handleSubmit = () => {
  if (props.loading) return
  clearErrors()

  const selectedPermissions =
    form.userType === 'SUPER_ADMIN' ? [...ALL_PERMISSIONS] : [...form.permissions]

  if (isEdit.value) {
    const updateData = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      userType: form.userType,
      enabled: form.enabled,
      permissions: selectedPermissions
    }

    // Only include password if entered
    if (form.password && form.password.trim()) {
      updateData.password = form.password.trim()
    }

    emit('submit', {
      isEdit: true,
      id: props.user?.id,
      data: updateData,
      onError: (err) => handleApiError(err, 'email'),
      onSuccess: () => clearErrors()
    })
  } else {
    emit('submit', {
      isEdit: false,
      data: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        userType: form.userType,
        permissions: selectedPermissions
      },
      onError: (err) => handleApiError(err, 'email'),
      onSuccess: () => clearErrors()
    })
  }
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
    :title="isEdit ? 'Edit User' : 'Create New User'"
    :subtitle="isEdit ? 'Update existing user profile and permissions' : 'Fill in the information to add a user'"
    max-width="520px"
    @close="emit('close')"
  >
    <form id="userForm" novalidate @submit.prevent="handleSubmit">
      <div v-if="generalError" class="alert-error">
        {{ generalError }}
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label class="form-label" for="userFirstName">
            First Name <span class="required">*</span>
          </label>
          <input
            id="userFirstName"
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
          <label class="form-label" for="userLastName">
            Last Name <span class="required">*</span>
          </label>
          <input
            id="userLastName"
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

      <div class="form-group">
        <label class="form-label" for="userEmail">
          Email Address <span class="required">*</span>
        </label>
        <input
          id="userEmail"
          v-model="form.email"
          type="text"
          class="form-input"
          :class="{ 'input-invalid': hasError('email') }"
          placeholder="e.g. user@example.com"
          @input="clearFieldError('email')"
        />
        <span v-if="hasError('email')" class="field-error-message">
          {{ getFieldError('email') }}
        </span>
      </div>

      <div class="form-group">
        <label class="form-label" for="userPassword">
          Password <span v-if="!isEdit" class="required">*</span>
          <span v-if="isEdit" class="text-hint">(Leave blank to keep current password)</span>
        </label>
        <input
          id="userPassword"
          v-model="form.password"
          type="password"
          class="form-input"
          :class="{ 'input-invalid': hasError('password') }"
          :placeholder="isEdit ? 'Leave blank to keep unchanged' : 'Enter secure password'"
          @input="clearFieldError('password')"
        />
        <span v-if="hasError('password')" class="field-error-message">
          {{ getFieldError('password') }}
        </span>
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label class="form-label" for="userType">
            User Type / Role <span class="required">*</span>
          </label>
          <select
            id="userType"
            v-model="form.userType"
            class="form-select"
            :class="{ 'input-invalid': hasError('userType') }"
            @change="clearFieldError('userType')"
          >
            <option value="NORMAL_USER">Normal User</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
          <span v-if="hasError('userType')" class="field-error-message">
            {{ getFieldError('userType') }}
          </span>
        </div>

        <div v-if="isEdit" class="form-group flex-1 check-group-container">
          <label class="form-label">Account Status</label>
          <label class="checkbox-label">
            <input
              v-model="form.enabled"
              type="checkbox"
              class="custom-checkbox"
              @change="clearFieldError('enabled')"
            />
            <span>Active Account</span>
          </label>
          <span v-if="hasError('enabled')" class="field-error-message">
            {{ getFieldError('enabled') }}
          </span>
        </div>
      </div>

      <!-- Single Permissions Multi-Select Field with Chips -->
      <div class="form-group">
        <label class="form-label" for="userPermissions">
          Permissions
          <span v-if="isSuperAdmin" class="text-hint">(All permissions automatically granted for Super Admin)</span>
        </label>
        <BaseMultiSelect
          id="userPermissions"
          v-model="form.permissions"
          :options="PERMISSION_OPTIONS"
          :disabled="isSuperAdmin"
          placeholder="Select permissions..."
          @change="clearFieldError('permissions')"
        />
        <span v-if="hasError('permissions')" class="field-error-message">
          {{ getFieldError('permissions') }}
        </span>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="loading"
        @click="emit('close')"
      >
        Cancel
      </button>

      <button
        type="submit"
        form="userForm"
        class="btn btn-primary"
        :disabled="loading"
      >
        <span v-if="loading" class="btn-spinner"></span>
        {{ loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User' }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.form-row {
  display: flex;
  gap: 16px;
}

.flex-1 {
  flex: 1;
}

.text-hint {
  font-weight: normal;
  font-size: 12px;
  color: var(--text-subtle);
  margin-left: 6px;
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

.check-group-container {
  justify-content: flex-end;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-main);
  user-select: none;
}

.custom-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--primary);
  cursor: pointer;
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

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
