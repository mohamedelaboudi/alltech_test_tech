<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
    default: 0
  },
  totalPages: {
    type: Number,
    required: true,
    default: 0
  },
  totalItems: {
    type: Number,
    required: true,
    default: 0
  },
  pageSize: {
    type: Number,
    default: 10
  },
  pageSizeOptions: {
    type: Array,
    default: () => [5, 10, 20, 50]
  }
})

const emit = defineEmits(['page-change', 'update:pageSize'])

const fromItem = computed(() => {
  if (props.totalItems === 0) return 0
  return props.currentPage * props.pageSize + 1
})

const toItem = computed(() => {
  if (props.totalItems === 0) return 0
  return Math.min((props.currentPage + 1) * props.pageSize, props.totalItems)
})

const displayedPages = computed(() => {
  if (props.totalPages <= 0) return []
  const pages = []
  const maxButtons = 5
  let start = Math.max(0, props.currentPage - Math.floor(maxButtons / 2))
  let end = Math.min(props.totalPages - 1, start + maxButtons - 1)

  if (end - start + 1 < maxButtons) {
    start = Math.max(0, end - maxButtons + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const onPageChange = (page) => {
  if (page >= 0 && page < props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}

const onPageSizeChange = (event) => {
  emit('update:pageSize', Number(event.target.value))
}
</script>

<template>
  <div class="pagination-wrapper">
    <div class="pagination-info">
      <span>
        Showing <strong class="highlight">{{ fromItem }}</strong> to
        <strong class="highlight">{{ toItem }}</strong> of
        <strong class="highlight">{{ totalItems }}</strong> entries
      </span>

      <div class="page-size-selector">
        <label for="page-size-select">Per page:</label>
        <select
          id="page-size-select"
          :value="pageSize"
          class="page-size-select"
          @change="onPageSizeChange"
        >
          <option v-for="size in pageSizeOptions" :key="size" :value="size">
            {{ size }}
          </option>
        </select>
      </div>
    </div>

    <div class="pagination-controls">
      <!-- First page -->
      <button
        type="button"
        class="pagination-btn"
        :disabled="currentPage <= 0 || totalPages <= 0"
        title="First page"
        @click="onPageChange(0)"
      >
        «
      </button>

      <!-- Previous page -->
      <button
        type="button"
        class="pagination-btn"
        :disabled="currentPage <= 0 || totalPages <= 0"
        title="Previous page"
        @click="onPageChange(currentPage - 1)"
      >
        ‹ Prev
      </button>

      <!-- Page Numbers (0-indexed internally, displayed as 1-based) -->
      <button
        v-for="page in displayedPages"
        :key="page"
        type="button"
        class="pagination-btn page-number"
        :class="{ active: page === currentPage }"
        @click="onPageChange(page)"
      >
        {{ page + 1 }}
      </button>

      <!-- Next page -->
      <button
        type="button"
        class="pagination-btn"
        :disabled="currentPage >= totalPages - 1 || totalPages <= 0"
        title="Next page"
        @click="onPageChange(currentPage + 1)"
      >
        Next ›
      </button>

      <!-- Last page -->
      <button
        type="button"
        class="pagination-btn"
        :disabled="currentPage >= totalPages - 1 || totalPages <= 0"
        title="Last page"
        @click="onPageChange(totalPages - 1)"
      >
        »
      </button>
    </div>
  </div>
</template>

<style scoped>
.pagination-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 4px 4px 4px;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: var(--text-muted);
}

.highlight {
  color: var(--text-main);
  font-weight: 600;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
}

.page-size-select {
  padding: 4px 8px;
  font-size: 13px;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  color: var(--text-main);
  cursor: pointer;
}

.page-size-select:focus {
  outline: none;
  border-color: var(--primary);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
  background-color: var(--bg-surface);
  color: var(--text-main);
  cursor: pointer;
  transition: var(--transition);
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
  background-color: var(--primary-light);
}

.pagination-btn.active {
  background-color: var(--primary);
  border-color: var(--primary);
  color: var(--text-inverse);
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: var(--border-light);
}
</style>
