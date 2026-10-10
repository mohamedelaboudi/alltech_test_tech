<script setup>
import { reactive, watch } from 'vue'
import { useEmployeeStore } from '@/stores/employeeStore'
import { DEPARTMENTS } from '@/models/employee'

const employeeStore = useEmployeeStore()

// Local form state
const form = reactive({
  firstName: employeeStore.filters.firstName || '',
  lastName: employeeStore.filters.lastName || '',
  email: employeeStore.filters.email || '',
  phone: employeeStore.filters.phone || '',
  jobTitle: employeeStore.filters.jobTitle || '',
  department: employeeStore.filters.department || '',
  hireDate: employeeStore.filters.hireDate || '',
  salary: employeeStore.filters.salary
})

// Keep local form in sync if store filters are reset externally
watch(
  () => employeeStore.filters,
  (newFilters) => {
    form.firstName = newFilters.firstName || ''
    form.lastName = newFilters.lastName || ''
    form.email = newFilters.email || ''
    form.phone = newFilters.phone || ''
    form.jobTitle = newFilters.jobTitle || ''
    form.department = newFilters.department || ''
    form.hireDate = newFilters.hireDate || ''
    form.salary = newFilters.salary
  },
  { deep: true }
)

const handleSearch = async () => {
  const salaryValue =
    form.salary !== undefined && form.salary !== null && form.salary !== '' && !Number.isNaN(Number(form.salary))
      ? Number(form.salary)
      : undefined

  const payload = {
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    phone: form.phone,
    jobTitle: form.jobTitle,
    department: form.department,
    hireDate: form.hireDate,
    salary: salaryValue
  }

  await employeeStore.applyEmployeeFilters(payload)
}

const handleReset = async () => {
  form.firstName = ''
  form.lastName = ''
  form.email = ''
  form.phone = ''
  form.jobTitle = ''
  form.department = ''
  form.hireDate = ''
  form.salary = undefined
  await employeeStore.resetEmployeeFilters()
}
</script>

<template>
  <div class="search-form-card">
    <div class="search-card-header">
      <div class="search-header-title">
        <h3 class="search-title">Employee Search</h3>
      </div>
      <span class="search-subtitle">Filter company personnel by detailed criteria</span>
    </div>

    <form class="search-form" @submit.prevent="handleSearch">
      <!-- Row 1: First Name, Last Name, Email -->
      <div class="form-grid-3">
        <div class="form-field">
          <label for="emp-search-firstName" class="field-label">First Name</label>
          <input
            id="emp-search-firstName"
            v-model="form.firstName"
            type="text"
            class="field-input"
            placeholder="e.g. John"
            autocomplete="off"
          />
        </div>

        <div class="form-field">
          <label for="emp-search-lastName" class="field-label">Last Name</label>
          <input
            id="emp-search-lastName"
            v-model="form.lastName"
            type="text"
            class="field-input"
            placeholder="e.g. Doe"
            autocomplete="off"
          />
        </div>

        <div class="form-field">
          <label for="emp-search-email" class="field-label">Email</label>
          <input
            id="emp-search-email"
            v-model="form.email"
            type="text"
            class="field-input"
            placeholder="e.g. john@example.com"
            autocomplete="off"
          />
        </div>
      </div>

      <!-- Row 2: Phone, Job Title, Department -->
      <div class="form-grid-3">
        <div class="form-field">
          <label for="emp-search-phone" class="field-label">Phone</label>
          <input
            id="emp-search-phone"
            v-model="form.phone"
            type="text"
            class="field-input"
            placeholder="e.g. +1 555-0199"
            autocomplete="off"
          />
        </div>

        <div class="form-field">
          <label for="emp-search-jobTitle" class="field-label">Job Title</label>
          <input
            id="emp-search-jobTitle"
            v-model="form.jobTitle"
            type="text"
            class="field-input"
            placeholder="e.g. Software Engineer"
            autocomplete="off"
          />
        </div>

        <div class="form-field">
          <label for="emp-search-department" class="field-label">Department</label>
          <input
            id="emp-search-department"
            v-model="form.department"
            type="text"
            class="field-input"
            placeholder="e.g. Engineering"
            list="department-options"
            autocomplete="off"
          />
          <datalist id="department-options">
            <option v-for="dept in DEPARTMENTS" :key="dept" :value="dept" />
          </datalist>
        </div>
      </div>

      <!-- Row 3: Hire Date, Salary -->
      <div class="form-grid-3">
        <div class="form-field">
          <label for="emp-search-hireDate" class="field-label">Hire Date</label>
          <input
            id="emp-search-hireDate"
            v-model="form.hireDate"
            type="date"
            class="field-input field-date"
          />
        </div>

        <div class="form-field">
          <label for="emp-search-salary" class="field-label">Salary</label>
          <input
            id="emp-search-salary"
            v-model="form.salary"
            type="number"
            class="field-input"
            placeholder="e.g. 75000"
            min="0"
            step="any"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-secondary action-btn reset-btn"
          :disabled="employeeStore.loading"
          @click="handleReset"
        >
          <span class="btn-icon">↺</span>
          <span>Reset</span>
        </button>

        <button
          type="submit"
          class="btn btn-primary action-btn search-btn"
          :disabled="employeeStore.loading"
        >
          <span v-if="employeeStore.loading" class="spinner-sm"></span>
          <span>{{ employeeStore.loading ? 'Searching...' : 'Search' }}</span>
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

.field-date {
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
