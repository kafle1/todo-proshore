import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { GoogleLogin } from '@react-oauth/google'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password cannot be empty.' }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, googleLogin } = useAuth()
  const [successMessage, setSuccessMessage] = useState('')
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccessMessage('Email verified successfully! You can now log in.')
    }
  }, [searchParams])

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values.email, values.password)
      navigate('/')
    } catch (error: unknown) {
      console.error('Login failed:', error)
      
      // Check if it's an email verification error
      const errorData = error && typeof error === 'object' && 'response' in error && 
                       error.response && typeof error.response === 'object' && 'data' in error.response ?
                       error.response.data as any : null
      
      if (errorData?.requiresVerification) {
        const email = errorData.email || values.email
        navigate(`/verify-email?email=${encodeURIComponent(email)}`)
        return
      }
      
      form.setError('root', { 
        type: 'manual', 
        message: errorData?.message || 'Invalid email or password. Please try again.' 
      })
    }
  }

  async function handleGoogleLogin(credential: string) {
    console.log('🔍 Google OAuth callback received')
    console.log('- Credential length:', credential.length)
    console.log('- Current origin:', window.location.origin)
    console.log('- Google Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID?.substring(0, 20) + '...')
    
    try {
      await googleLogin(credential)
      console.log('✅ Google login completed successfully')
      navigate('/')
    } catch (error) {
      console.error('❌ Google login failed in component:', error)
      
      // More specific error messages based on the error type
      let errorMessage = 'Google login failed. Please try again.'
      
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 'status' in error.response) {
        const status = error.response.status
        if (status === 401) {
          errorMessage = 'Google authentication failed. Please check your Google account.'
        } else if (status === 403) {
          errorMessage = 'Google login is not properly configured. Please contact support.'
        } else if (status === 500) {
          errorMessage = 'Server error during Google login. Please try again later.'
        }
      }
      
      form.setError('root', { type: 'manual', message: errorMessage })
    }
  }

  return (
    <div className="flex min-h-[calc(100vh_-_theme(spacing.24))] items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              {successMessage && (
                <div className="p-3 text-sm font-medium text-green-600 border border-green-300 rounded-md bg-green-50">
                  {successMessage}
                </div>
              )}
              {form.formState.errors.root && (
                <div className="p-3 text-sm font-medium border rounded-md text-destructive bg-destructive/10 border-destructive/30">
                  {form.formState.errors.root.message}
                </div>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      <span>Password</span>
                      <Link to="/forgot-password" className="inline-block ml-auto text-xs underline">
                        Forgot your password?
                      </Link>
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
            </div>
          </div>
          {import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your-development-client-id-here' ? (
            <div className="w-full">
              <GoogleLogin
                onSuccess={credentialResponse => {
                  console.log('🎉 Google OAuth success callback triggered')
                  if (credentialResponse.credential) {
                    handleGoogleLogin(credentialResponse.credential)
                  } else {
                    console.error('❌ No credential received from Google')
                    form.setError('root', { type: 'manual', message: 'No credential received from Google. Please try again.' })
                  }
                }}
                onError={() => {
                  console.error('❌ Google OAuth error callback triggered')
                  console.error('❌ This usually means:')
                  console.error('   1. The origin is not authorized for this client ID')
                  console.error('   2. The client ID is invalid')
                  console.error('   3. Network connectivity issues')
                  console.error('❌ Current origin:', window.location.origin)
                  console.error('❌ Add this origin to your Google OAuth client configuration')
                  
                  form.setError('root', { 
                    type: 'manual', 
                    message: `Google login failed. The origin ${window.location.origin} is not authorized for this Google Client ID. Please add it to your Google OAuth configuration.` 
                  })
                }}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                useOneTap={false}
                auto_select={false}
              />
            </div>
          ) : (
            <div className="space-y-2 text-sm text-center text-muted-foreground">
              <p>Google login is not configured</p>
              <p className="text-xs">
                To enable Google login, configure a Google OAuth client ID in your .env file
              </p>
              <p className="text-xs text-blue-600">
                Current origin: {window.location.origin}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center text-sm">
          Don't have an account?
          <Link to="/register" className="ml-1 underline">
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
} 