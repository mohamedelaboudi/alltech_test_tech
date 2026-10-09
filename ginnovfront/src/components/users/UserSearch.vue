<script setup>
import { reactive, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { UserType, USER_TYPE_LABELS } from '@/models/user'

const userStore = useUserStore()

// Local form state
const form = reactive({
  firstName: userStore.filters.firstName || '',
  lastName: userStore.filters.lastName || '',
  email: userStore.filters.email || '',
  userType: userStore.filters.userType || undefined
})

// Keep local form in sync if store filters are reset externally
watch(
  () => userStore.filters,
  (newFilters) => {
    form.firstName = newFilters.firstName || ''
    form.lastName = newFilters.lastName || ''
    form.email = newFilters.email || ''
    form.userType = newFilters.userType || undefined
  },
  { deep: true }
)

const userTypeOptions = Array.from(new Set(Object.values(UserType)))

const handleSearch = async () => {
  await userStore.applyUserFilters({
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    userType: form.userType || undefined
  })
}

const handleReset = async () => {
  form.firstName = ''
  form.lastName = ''
  form.email = ''
  form.userType = undefined
  await userStore.resetUserFilters()
}
</script>

<template>
  <div class="search-form-card">
    <div class="search-card-header">
      <div class="search-header-title">
        <h3 class="search-title">User Search</h3>
      </div>
      <span class="search-subtitle">Filter users across system credentials</span>
    </div>

    <form class="search-form" @submit.prevent="handleSearch">
      <!-- Row 1: First Name, Last Name, Email -->
      <div class="form-grid-3">
        <div class="form-field">
          <label for="user-search-firstName" class="field-label">First Name</label>
          <input
            id="user-search-firstName"
            v-model="form.firstName"
            type="text"
            class="field-input"
            placeholder="e.g. John"
            autocomplete="off"
          />
        </div>

        <div class="form-field">
          <label for="user-search-lastName" class="field-label">Last Name</label>
          <input
            id="user-search-lastName"
            v-model="form.lastName"
            type="text"
            class="field-input"
            placeholder="e.g. Doe"
            autocomplete="off"
          />
        </div>

        <div class="form-field">
          <label for="user-search-email" class="field-label">Email</label>
          <input
            id="user-search-email"
            v-model="form.email"
            type="text"
            class="field-input"
            placeholder="e.g. john@example.com"
            autocomplete="off"
          />
        </div>
      </div>

      <!-- Row 2: User Type (Dropdown) -->
      <div class="form-grid-3">
        <div class="form-field">
          <label for="user-search-userType" class="field-label">User Type</label>
          <select
            id="user-search-userType"
            v-model="form.userType"
            class="field-input field-select"
          >
            <option :value="undefined">All User Types</option>
            <option
              v-for="type in userTypeOptions"
              :key="type"
              :value="type"
            >
              {{ USER_TYPE_LABELS[type] || type }}
            </option>
          </select>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-secondary action-btn reset-btn"
          :disabled="userStore.loading"
          @click="handleReset"
        >
          <span class="btn-icon">↺</span>
          <span>Reset</span>
        </button>

        <button
          type="submit"
          class="btn btn-primary action-btn search-btn"
          :disabled="userStore.loading"
        >
          <span v-if="userStore.loading" class="spinner-sm"></span>
          <span>{{ userStore.loading ? 'Searching...' : 'Search' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.search-form-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: var(--transition);
}

.search-form-card:focus-within {
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.search-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 12px;
}

.search-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-title-icon {
  font-size: 16px;
}

.search-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
  letter-spacing: -0.01em;
}

.search-subtitle {
  font-size: 12.5px;
  color: var(--text-muted);
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 900px) {
  .form-grid-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .form-grid-3 {
    grid-template-columns: 1fr;
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-muted);
}

.field-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  font-size: 13.5px;
  color: var(--text-main);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: var(--transition);
}

.field-input::placeholder {
  color: var(--text-subtle);
}

.field-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.field-select {
  cursor: pointer;
  appearance: auto;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 6px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 38px;
  padding: 0 18px;
  font-size: 13.5px;
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: var(--transition);
}

.reset-btn {
  background-color: var(--bg-subtle);
  border: 1px solid var(--border-medium);
  color: var(--text-main);
}

.reset-btn:hover:not(:disabled) {
  background-color: var(--border-light);
  border-color: var(--border-dark);
}

.search-btn {
  min-width: 110px;
}

.btn-icon {
  font-size: 13px;
}

.spinner-sm {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
