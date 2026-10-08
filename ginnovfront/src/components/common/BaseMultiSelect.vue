<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  options: {
    type: Array,
    default: () => ['CREATE', 'READ', 'UPDATE', 'DELETE']
  },
  placeholder: {
    type: String,
    default: 'Select permissions...'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  id: {
    type: String,
    default: 'permission-select'
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const selectContainer = ref(null)

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

const isSelected = (option) => {
  return props.modelValue.includes(option)
}

const toggleOption = (option) => {
  if (props.disabled) return
  let updated
  if (isSelected(option)) {
    updated = props.modelValue.filter((item) => item !== option)
  } else {
    updated = [...props.modelValue, option]
  }
  emit('update:modelValue', updated)
}

const removeOption = (option) => {
  if (props.disabled) return
  const updated = props.modelValue.filter((item) => item !== option)
  emit('update:modelValue', updated)
}

const handleClickOutside = (event) => {
  if (selectContainer.value && !selectContainer.value.contains(event.target)) {
    isOpen.value = false
  }
}

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    :id="id"
    ref="selectContainer"
    class="base-multiselect"
    :class="{ 'is-open': isOpen, 'is-disabled': disabled }"
  >
    <!-- MultiSelect Field / Chips Container -->
    <div
      class="multiselect-field"
      tabindex="0"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-disabled="disabled"
      @click="toggleDropdown"
      @keydown.enter.prevent="toggleDropdown"
      @keydown.space.prevent="toggleDropdown"
    >
      <div class="chips-container">
        <!-- Selected Chips -->
        <span
          v-for="option in modelValue"
          :key="option"
          class="permission-chip"
          :class="`chip-${option.toLowerCase()}`"
        >
          <span class="chip-label">{{ option }}</span>
          <button
            v-if="!disabled"
            type="button"
            class="chip-remove-btn"
            title="Remove permission"
            aria-label="Remove"
            @click.stop="removeOption(option)"
          >
            &times;
          </button>
        </span>

        <!-- Placeholder when nothing is selected -->
        <span
          v-if="modelValue.length === 0"
          class="multiselect-placeholder"
        >
          {{ placeholder }}
        </span>
      </div>

      <!-- Dropdown Indicator Arrow -->
      <span class="dropdown-arrow" aria-hidden="true">
        ▼
      </span>
    </div>

    <!-- Dropdown Options Menu -->
    <div
      v-if="isOpen && !disabled"
      class="multiselect-menu"
      role="listbox"
      aria-multiselectable="true"
    >
      <div
        v-for="option in options"
        :key="option"
        class="dropdown-option"
        :class="{ 'is-selected': isSelected(option) }"
        role="option"
        :aria-selected="isSelected(option)"
        @click.stop="toggleOption(option)"
      >
        <div class="option-content">
          <span class="custom-check-box" :class="{ checked: isSelected(option) }">
            <span v-if="isSelected(option)" class="check-mark">✓</span>
          </span>
          <span class="option-name">{{ option }}</span>
        </div>
        <span v-if="isSelected(option)" class="selected-badge">Selected</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.base-multiselect {
  position: relative;
  width: 100%;
  font-family: inherit;
}

.multiselect-field {
  min-height: 44px;
  width: 100%;
  padding: 6px 36px 6px 12px;
  display: flex;
  align-items: center;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  outline: none;
  box-sizing: border-box;
}

.multiselect-field:focus,
.base-multiselect.is-open .multiselect-field {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.base-multiselect.is-disabled .multiselect-field {
  background-color: var(--bg-subtle);
  border-color: var(--border-light);
  cursor: not-allowed;
  opacity: 0.9;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  flex: 1;
}

.permission-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-radius: var(--radius-sm);
  background-color: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary-border);
  user-select: none;
  transition: all 0.15s ease;
}

.permission-chip:hover {
  background-color: #dbeafe;
}

.chip-create {
  background-color: #ecfdf5;
  color: #059669;
  border-color: #a7f3d0;
}
.chip-create:hover {
  background-color: #d1fae5;
}

.chip-read {
  background-color: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
}
.chip-read:hover {
  background-color: #dbeafe;
}

.chip-update {
  background-color: #fffbeb;
  color: #d97706;
  border-color: #fde68a;
}
.chip-update:hover {
  background-color: #fef3c7;
}

.chip-delete {
  background-color: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}
.chip-delete:hover {
  background-color: #fee2e2;
}

.chip-label {
  line-height: 1.2;
}

.chip-remove-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: currentColor;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  opacity: 0.7;
  transition: opacity 0.15s, background-color 0.15s;
}

.chip-remove-btn:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.08);
}

.multiselect-placeholder {
  color: var(--text-subtle);
  font-size: 13.5px;
  user-select: none;
}

.dropdown-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: var(--text-muted);
  transition: transform 0.2s ease;
  pointer-events: none;
}

.base-multiselect.is-open .dropdown-arrow {
  transform: translateY(-50%) rotate(180deg);
}

.multiselect-menu {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  animation: dropdownFadeIn 0.15s ease-out;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color 0.15s ease;
  user-select: none;
}

.dropdown-option:hover {
  background-color: var(--bg-subtle);
}

.dropdown-option.is-selected {
  background-color: var(--primary-light);
  color: var(--primary);
}

.option-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.custom-check-box {
  width: 17px;
  height: 17px;
  border: 1.5px solid var(--border-medium);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-surface);
  transition: all 0.15s ease;
}

.custom-check-box.checked {
  background-color: var(--primary);
  border-color: var(--primary);
}

.check-mark {
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.option-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-main);
}

.dropdown-option.is-selected .option-name {
  color: var(--primary);
  font-weight: 600;
}

.selected-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
