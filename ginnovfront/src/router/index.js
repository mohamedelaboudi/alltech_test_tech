import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useAlertStore } from '@/stores/alertStore'
import UsersView from '@/views/users/UsersView.vue'
import EmployeesView from '@/views/employees/EmployeesView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        public: true,
        layout: 'blank',
        title: 'Sign In'
      }
    },
    {
      path: '/users',
      name: 'users',
      component: UsersView,
      meta: {
        requiresAuth: true,
        title: 'Users Management'
      }
    },
    {
      path: '/employees',
      name: 'employees',
      component: EmployeesView,
      meta: {
        requiresAuth: true,
        title: 'Employees Management'
      }
    },
    {
      path: '/',
      name: 'root',
      redirect: () => {
        const authStore = useAuthStore()
        if (!authStore.isInitialized) {
          authStore.initializeAuth()
        }
        if (!authStore.isAuthenticated) {
          return '/login'
        }
        return '/users'
      }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  // Set document title
  document.title = to.meta.title ? `${to.meta.title} - AllTech` : 'AllTech Management'

  const authStore = useAuthStore()
  if (!authStore.isInitialized) {
    await authStore.initializeAuth()
  }

  const isAuthenticated = authStore.isAuthenticated

  // 1. Public route check (e.g. /login)
  if (to.meta.public) {
    if (isAuthenticated) {
      return next('/users')
    }
    return next()
  }

  if (to.meta.requiresAuth !== false && !isAuthenticated) {
    return next({
      path: '/login',
      query: { redirect: to.fullPath !== '/' ? to.fullPath : undefined }
    })
  }

  if (to.meta.roles && Array.isArray(to.meta.roles)) {
    const userRole = authStore.userType
    const hasRole = to.meta.roles.includes(userRole)
    if (!hasRole) {
      const alertStore = useAlertStore()
      alertStore.showError('Access denied: You do not have permission to view this page.')
      if (from.name && from.path !== to.path) {
        return next(false)
      } else {
        return next('/users')
      }
    }
  }

  next()
})

export default router