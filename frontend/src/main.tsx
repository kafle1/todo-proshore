import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'

const queryClient = new QueryClient()
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

console.log('🔧 Environment Configuration:')
console.log('- API URL:', import.meta.env.VITE_API_URL)
console.log('- Google Client ID:', googleClientId ? `${googleClientId.substring(0, 20)}...` : 'Not configured')
console.log('- Current Origin:', window.location.origin)
console.log('- Mode:', import.meta.env.MODE)
console.log('- Dev:', import.meta.env.DEV)

// Check localStorage for existing tokens
const existingToken = localStorage.getItem('accessToken')
const existingRefreshToken = localStorage.getItem('refreshToken')
console.log('🔍 Existing tokens:')
console.log('- Access token:', existingToken ? `${existingToken.substring(0, 20)}...` : 'None')
console.log('- Refresh token:', existingRefreshToken ? `${existingRefreshToken.substring(0, 20)}...` : 'None')

if (!googleClientId) {
  console.warn('⚠️ Google Client ID not found. Google authentication will not work.')
  console.log('💡 To fix this, add VITE_GOOGLE_CLIENT_ID to your .env file')
} else if (googleClientId === 'your-development-client-id-here') {
  console.warn('⚠️ Google Client ID is set to placeholder value. Please configure a real client ID.')
} else {
  console.log('✅ Google Client ID configured')
  console.log('🌐 Make sure the following origin is added to your Google OAuth client:')
  console.log(`   ${window.location.origin}`)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {googleClientId && googleClientId !== 'your-development-client-id-here' ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </GoogleOAuthProvider>
    ) : (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    )}
  </StrictMode>,
)
