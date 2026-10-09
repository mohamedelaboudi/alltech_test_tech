import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/authStore'
import { setRouter } from './services/api/axios'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Initialize router reference in axios interceptors
setRouter(router)

// Restore auth state before mounting router
const authStore = useAuthStore()
await authStore.initializeAuth()

app.use(router)

app.mount('#app')
