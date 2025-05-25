import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../components/ui/form'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card'

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('') // Added error state for token validation

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.')
      // Optionally redirect or show a more prominent error
      // navigate('/forgot-password', { replace: true })
    }
  }, [token, navigate])

  async function onSubmit(values: ResetPasswordFormValues) {
    if (!token) {
      setError('Cannot reset password without a valid token.');
      return;
    }
    setIsSuccess(false)
    setMessage('')
    setError('')

    try {
      await api.post('/auth/reset-password', { token, newPassword: values.newPassword })
      setMessage('Your password has been successfully reset. You can now login.')
      setIsSuccess(true)
      form.reset()
    } catch (err) {
      console.error('Password reset failed:', err)
      setError('Failed to reset password. The link may be expired or invalid.')
      setIsSuccess(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh_-_theme(spacing.24))] items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && !isSuccess && (
             <div className="text-sm font-medium text-destructive bg-destructive/10 border border-destructive/30 p-3 rounded-md">
               {error}
             </div>
          )}
          {!isSuccess && !error && token && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                </Button>
              </form>
            </Form>
          )}
          {isSuccess && (
            <div className="text-sm font-medium text-green-600 bg-green-50 border border-green-300 p-3 rounded-md">
              {message}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild variant="link" className="text-sm">
            <Link to="/login">Back to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 