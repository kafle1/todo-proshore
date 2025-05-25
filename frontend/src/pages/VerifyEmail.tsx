import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/Input'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { Mail, RefreshCw } from 'lucide-react'

const verifyEmailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  otp: z.string().min(6, { message: 'OTP must be 6 digits.' }).max(6, { message: 'OTP must be 6 digits.' }),
})

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  
  const emailFromParams = searchParams.get('email') || ''
  
  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { 
      email: emailFromParams, 
      otp: '' 
    },
  })

  async function onSubmit(values: VerifyEmailFormValues) {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (response.ok) {
        // Verification successful, redirect to login
        navigate('/login?verified=true')
      } else {
        form.setError('root', {
          type: 'manual',
          message: data.error || 'Verification failed. Please try again.',
        })
      }
    } catch (error) {
      console.error('Verification failed:', error)
      form.setError('root', {
        type: 'manual',
        message: 'Verification failed. Please try again.',
      })
    }
  }

  async function handleResendOtp() {
    if (!form.getValues('email')) {
      form.setError('email', {
        type: 'manual',
        message: 'Please enter your email address first.',
      })
      return
    }

    setIsResending(true)
    setResendMessage('')

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.getValues('email') }),
      })

      const data = await response.json()

      if (response.ok) {
        setResendMessage('OTP resent successfully! Check your email.')
      } else {
        setResendMessage(data.error || 'Failed to resend OTP. Please try again.')
      }
    } catch (error) {
      console.error('Resend OTP failed:', error)
      setResendMessage('Failed to resend OTP. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh_-_theme(spacing.24))] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a 6-digit verification code to your email address. Please enter it below to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your email" 
                        type="email" 
                        {...field} 
                        disabled={!!emailFromParams}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter 6-digit code" 
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <div className="text-sm text-red-600">
                  {form.formState.errors.root.message}
                </div>
              )}
              {resendMessage && (
                <div className={`text-sm ${resendMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                  {resendMessage}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Verifying...' : 'Verify Email'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResendOtp}
              disabled={isResending}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
              {isResending ? 'Resending...' : 'Resend Code'}
            </Button>
          </div>
          <div className="text-center text-sm text-gray-600">
            Already verified?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 