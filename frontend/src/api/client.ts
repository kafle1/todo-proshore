import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL;
const api = axios.create({
  baseURL: baseURL || '/api',
  withCredentials: false, // No need for credentials with JWT tokens
});

// Token management functions (will be used by interceptor)
const getRefreshToken = () => localStorage.getItem('refreshToken')
const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
}
const clearTokens = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

// Flag to prevent multiple refresh attempts
let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        console.log('❌ No refresh token available, clearing auth state')
        clearTokens()
        delete api.defaults.headers.common['Authorization']
        processQueue(error, null)
        isRefreshing = false
        
        // Redirect to login if we're not already on an auth page
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register') &&
            !window.location.pathname.includes('/forgot-password') &&
            !window.location.pathname.includes('/reset-password')) {
          console.log('🔄 Redirecting to login page')
          window.location.href = '/login'
        }
        
        return Promise.reject(error)
      }

      try {
        console.log('🔄 Automatically refreshing token...')
        
        // Create a new axios instance without interceptors to avoid infinite loops
        const refreshResponse = await axios.post(`${api.defaults.baseURL}/auth/refresh`, 
          { refreshToken },
          { 
            headers: { 'Content-Type': 'application/json' },
            withCredentials: false
          }
        )
        
        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data
        
        setTokens(accessToken, newRefreshToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`
        
        processQueue(null, accessToken)
        console.log('✅ Token refreshed automatically')
        
        return api(originalRequest)
      } catch (refreshError) {
        console.log('❌ Automatic token refresh failed:', refreshError)
        clearTokens()
        delete api.defaults.headers.common['Authorization']
        processQueue(refreshError, null)
        
        // Redirect to login if we're not already on an auth page
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register') &&
            !window.location.pathname.includes('/forgot-password') &&
            !window.location.pathname.includes('/reset-password')) {
          console.log('🔄 Redirecting to login page')
          window.location.href = '/login'
        }
        
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api; 