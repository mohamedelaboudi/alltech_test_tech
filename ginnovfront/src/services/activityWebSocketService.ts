import { Client, type IMessage } from '@stomp/stompjs'
import type { ActivityLog } from '@/models/activityLog'

export type ActivityCallback = (activity: ActivityLog) => void
export type ConnectionStatusCallback = (connected: boolean) => void

class ActivityWebSocketService {
  private client: Client | null = null
  private subscribers: Set<ActivityCallback> = new Set()
  private statusListeners: Set<ConnectionStatusCallback> = new Set()
  private isConnected: boolean = false
  private activitySubscription: { unsubscribe: () => void } | null = null

  private getBrokerUrl(): string {
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/ws`
  }

  /**
   * Connect to WebSocket STOMP broker if not already connected.
   * Authentication uses the HttpOnly access_token cookie on the handshake;
   * the JWT is never read or sent from JavaScript.
   */
  public connect(_token?: string): void {
    if (this.client && this.client.active) {
      return
    }

    if (this.client) {
      this.disconnect()
    }

    const brokerUrl = this.getBrokerUrl()

    this.client = new Client({
      brokerURL: brokerUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (_msg: string) => {
        if (import.meta.env.DEV) {
          // console.debug('[STOMP]', _msg)
        }
      },
      onConnect: () => {
        this.isConnected = true
        this.notifyStatus(true)
        console.log('[ActivityWS] Connected to STOMP broker successfully.')
        this.subscribeToActivity()
      },
      onStompError: (frame) => {
        console.error('[ActivityWS] STOMP broker reported error:', frame.headers['message'], frame.body)
        this.isConnected = false
        this.notifyStatus(false)
      },
      onWebSocketClose: () => {
        this.isConnected = false
        this.notifyStatus(false)
      },
      onWebSocketError: (event) => {
        console.error('[ActivityWS] WebSocket transport error:', event)
        this.isConnected = false
        this.notifyStatus(false)
      }
    })

    this.client.activate()
  }

  private subscribeToActivity(): void {
    if (!this.client?.connected) {
      return
    }

    if (this.activitySubscription) {
      try {
        this.activitySubscription.unsubscribe()
      } catch {
        // Subscription may already be gone after a reconnect
      }
      this.activitySubscription = null
    }

    this.activitySubscription = this.client.subscribe(
      '/topic/admin/activity',
      (message: IMessage) => {
        try {
          const data: ActivityLog = JSON.parse(message.body)
          this.notifySubscribers(data)
        } catch (err) {
          console.error('[ActivityWS] Failed to parse incoming activity payload:', err, message.body)
        }
      }
    )
  }

  /**
   * Disconnect STOMP client
   */
  public disconnect(): void {
    this.activitySubscription = null
    if (this.client) {
      try {
        this.client.deactivate()
      } catch (e) {
        console.warn('[ActivityWS] Error deactivating STOMP client:', e)
      }
      this.client = null
    }
    this.isConnected = false
    this.notifyStatus(false)
  }

  /**
   * Subscribe to incoming real-time activity events
   */
  public onActivity(callback: ActivityCallback): () => void {
    this.subscribers.add(callback)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  /**
   * Subscribe to connection status changes
   */
  public onConnectionChange(callback: ConnectionStatusCallback): () => void {
    this.statusListeners.add(callback)
    callback(this.isConnected)
    return () => {
      this.statusListeners.delete(callback)
    }
  }

  private notifySubscribers(activity: ActivityLog): void {
    this.subscribers.forEach((cb) => {
      try {
        cb(activity)
      } catch (err) {
        console.error('[ActivityWS] Error in activity listener:', err)
      }
    })
  }

  private notifyStatus(connected: boolean): void {
    this.statusListeners.forEach((cb) => {
      try {
        cb(connected)
      } catch (err) {
        console.error('[ActivityWS] Error in status listener:', err)
      }
    })
  }

  public getConnected(): boolean {
    return this.isConnected
  }
}

export const activityWebSocketService = new ActivityWebSocketService()
export default activityWebSocketService
