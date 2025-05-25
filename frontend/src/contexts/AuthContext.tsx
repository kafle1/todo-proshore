import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client'

interface User {
  id: string
  email: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  googleLogin: (token: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Token management
const TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

const getToken = () => localStorage.getItem(TOKEN_KEY)
const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)
const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}
const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = async () => {
    try {
      console.log('🔍 Fetching user profile...')
      const token = getToken()
      if (!token) {
        console.log('ℹ️ No access token found')
        setUser(null)
        setLoading(false)
        return
      }

      // Set Authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      const res = await api.get('/auth/me')
      console.log('✅ User profile fetched successfully:', res.data)
      setUser(res.data)
    } catch (error) {
      console.log('❌ Failed to fetch user profile, attempting token refresh...')
      
      // Check if it's a 401 error (token expired)
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 'status' in error.response &&
          error.response.status === 401) {
        console.log('🔄 Token appears to be expired, attempting refresh...')
        
        // Try to refresh token
        const refreshToken = getRefreshToken()
        if (refreshToken) {
          try {
            await refreshTokens()
            // Retry fetching user after refresh
            const res = await api.get('/auth/me')
            console.log('✅ User profile fetched after token refresh:', res.data)
            setUser(res.data)
            return
          } catch {
            console.log('❌ Token refresh failed, clearing tokens')
          }
        } else {
          console.log('ℹ️ No refresh token available')
        }
      } else {
        console.log('❌ Network or other error fetching user profile')
      }
      
      // Clear tokens and reset state
      clearTokens()
      delete api.defaults.headers.common['Authorization']
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshTokens = async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token')

    console.log('🔄 Refreshing tokens...')
    
    // Use a direct axios call to avoid interceptor loops
    const response = await fetch(`${api.defaults.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })
    
    if (!response.ok) {
      throw new Error('Token refresh failed')
    }
    
    const data = await response.json()
    const { accessToken, refreshToken: newRefreshToken } = data
    
    setTokens(accessToken, newRefreshToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    console.log('✅ Tokens refreshed successfully')
  }

  useEffect(() => { 
    // Set up token from localStorage on app start
    const token = getToken()
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    fetchMe() 
  }, [])

  const login = async (email: string, password: string) => {
    console.log('🔐 Attempting login for:', email)
    try {
      const response = await api.post('/auth/login', { email, password })
      const { user, accessToken, refreshToken } = response.data
      
      setTokens(accessToken, refreshToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      
      console.log('✅ Login successful')
      setUser(user)
    } catch (error) {
      console.error('❌ Login failed:', error)
      throw error
    }
  }

  const register = async (email: string, password: string) => {
    console.log('📝 Attempting registration for:', email)
    try {
      const response = await api.post('/auth/register', { email, password })
      const { user, accessToken, refreshToken } = response.data
      
      setTokens(accessToken, refreshToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      
      console.log('✅ Registration successful')
      setUser(user)
    } catch (error) {
      console.error('❌ Registration failed:', error)
      throw error
    }
  }

  const logout = async () => {
    console.log('🚪 Logging out...')
    try {
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
      console.log('✅ Logout successful')
    } catch (error) {
      console.error('❌ Logout failed:', error)
      // Continue with logout even if server request fails
    } finally {
      clearTokens()
      delete api.defaults.headers.common['Authorization']
      setUser(null)
    }
  }

  const googleLogin = async (token: string) => {
    console.log('🔍 Google OAuth token received, length:', token.length)
    console.log('🌐 Attempting Google login...')
    try {
      const response = await api.post('/auth/google', { token })
      const { user, accessToken, refreshToken } = response.data
      
      setTokens(accessToken, refreshToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      
      console.log('✅ Google login successful:', response.data)
      setUser(user)
    } catch (error) {
      console.error('❌ Google login failed:', error)
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 
          'status' in error.response && 'data' in error.response) {
        console.error('❌ Response status:', error.response.status)
        console.error('❌ Response data:', error.response.data)
      }
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, googleLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
} 