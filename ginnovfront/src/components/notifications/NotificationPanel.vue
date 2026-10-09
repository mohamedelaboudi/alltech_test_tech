<script setup>
import { computed } from 'vue'
import { useNotificationStore } from '@/stores/notificationStore'

const notificationStore = useNotificationStore()

const activities = computed(() => notificationStore.activities)
const isConnected = computed(() => notificationStore.isConnected)
const unreadCount = computed(() => notificationStore.unreadCount)

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffSec < 5) return 'Just now'
    if (diffSec < 60) return `${diffSec}s ago`
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

const getActionClass = (action) => {
  switch ((action || '').toUpperCase()) {
    case 'CREATE':
      return 'action-create'
    case 'UPDATE':
      return 'action-update'
    case 'DELETE':
      return 'action-delete'
    case 'UPLOAD':
      return 'action-upload'
    case 'GENERATE':
      return 'action-generate'
    default:
      return 'action-default'
  }
}

const handleItemClick = (activity) => {
  notificationStore.markAsRead(activity.id)
}
</script>

<template>
  <div class="notification-panel" @click.stop>
    <!-- Header -->
    <div class="panel-header">
      <div class="header-title-row">
        <div class="title-with-badge">
          <h3 class="panel-title">Activity Stream</h3>
          <span
            class="connection-badge"
            :class="{ 'badge-live': isConnected, 'badge-offline': !isConnected }"
            :title="isConnected ? 'Live WebSocket Connected' : 'Disconnected / Reconnecting'"
          >
            <span class="status-dot"></span>
            {{ isConnected ? 'LIVE' : 'OFFLINE' }}
          </span>
        </div>

        <div class="header-actions">
          <button
            v-if="unreadCount > 0"
            type="button"
            class="action-btn"
            title="Mark all as read"
            @click="notificationStore.markAllAsRead"
          >
            Mark all read
          </button>
          <button
            v-if="activities.length > 0"
            type="button"
            class="action-btn text-muted"
            title="Clear list"
            @click="notificationStore.clearAll"
          >
            Clear
          </button>
        </div>
      </div>

      <div class="header-sub">
        <span v-if="unreadCount > 0" class="unread-summary">
          {{ unreadCount }} unread {{ unreadCount === 1 ? 'notification' : 'notifications' }}
        </span>
        <span v-else class="unread-summary all-read">
          All caught up
        </span>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="panel-body">
      <div v-if="activities.length === 0" class="empty-state">
        <div class="empty-icon-wrap">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </div>
        <p class="empty-title">No recent activity</p>
        <p class="empty-sub">Real-time user actions will appear here immediately</p>
      </div>

      <div v-else class="activity-list">
        <div
          v-for="item in activities"
          :key="item.id"
          class="activity-item"
          :class="{ 'is-unread': !item.read }"
          @click="handleItemClick(item)"
        >
          <!-- Unread Dot Indicator -->
          <div class="unread-indicator">
            <span v-if="!item.read" class="dot"></span>
          </div>

          <!-- Main Content -->
          <div class="item-content">
            <div class="item-meta">
              <span class="action-tag" :class="getActionClass(item.action)">
                {{ item.action }}
              </span>
              <span class="entity-tag">{{ item.entityType }}</span>
              <span class="item-time">{{ formatTimeAgo(item.createdAt) }}</span>
            </div>

            <p class="item-desc">{{ item.description }}</p>

            <div class="item-actor">
              <span class="actor-icon">👤</span>
              <span class="actor-name">{{ item.username || 'System' }}</span>
              <span v-if="item.entityId" class="actor-entity-id">ID: #{{ item.entityId }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notification-panel {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 410px;
  max-width: 92vw;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 16px 36px -4px rgba(15, 23, 42, 0.16), 0 6px 16px -2px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  animation: panelSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes panelSlideIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.panel-header {
  padding: 16px 18px 12px 18px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.header-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.connection-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 7px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.badge-live {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.badge-live .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
  animation: pulseLive 2s infinite;
}

@keyframes pulseLive {
  0% { transform: scale(0.9); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.8; }
}

.badge-offline {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.badge-offline .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  background: transparent;
  border: none;
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: #eff6ff;
}

.action-btn.text-muted {
  color: #64748b;
}

.action-btn.text-muted:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.header-sub {
  margin-top: 4px;
  font-size: 12px;
}

.unread-summary {
  color: #2563eb;
  font-weight: 600;
}

.unread-summary.all-read {
  color: #64748b;
  font-weight: 500;
}

.panel-body {
  max-height: 420px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.panel-body::-webkit-scrollbar {
  width: 6px;
}

.panel-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 42px 24px;
  text-align: center;
}

.empty-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.empty-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.empty-sub {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.activity-list {
  display: flex;
  flex-direction: column;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 13px 18px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background-color 0.15s ease;
  position: relative;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background-color: #f8fafc;
}

.activity-item.is-unread {
  background-color: #f0f7ff;
}

.activity-item.is-unread:hover {
  background-color: #e5f0ff;
}

.unread-indicator {
  width: 8px;
  display: flex;
  align-items: flex-start;
  padding-top: 6px;
  flex-shrink: 0;
}

.unread-indicator .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2563eb;
  box-shadow: 0 0 6px rgba(37, 99, 235, 0.5);
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 4px;
}

.action-tag {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.03em;
}

.action-create {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.action-update {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.action-delete {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.action-upload {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.action-generate {
  background: #f5f3ff;
  color: #6d28d9;
  border: 1px solid #ddd6fe;
}

.action-default {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.entity-tag {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.item-time {
  margin-left: auto;
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
}

.item-desc {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
  word-break: break-word;
}

.item-actor {
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: #64748b;
}

.actor-icon {
  font-size: 10px;
}

.actor-name {
  font-weight: 500;
  color: #475569;
}

.actor-entity-id {
  margin-left: auto;
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}
</style>
