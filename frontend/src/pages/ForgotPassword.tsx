import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import api from '@/api/client'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import { Link } from 'react-router-dom'

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPassword() {
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsSuccess(false)
    setMessage('')
    try {
      await api.post('/auth/forgot-password', { email: values.email })
      setMessage('If an account with that email exists, a password reset link has been sent.')
      setIsSuccess(true)
      form.reset()
    } catch (error) {
      console.error('Forgot password failed:', error)
      setMessage('An error occurred. Please try again.')
      setIsSuccess(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh_-_theme(spacing.24))] items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {!isSuccess ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="text-sm font-medium text-green-600 bg-green-50 border border-green-300 p-3 rounded-md">
              {message}
            </div>
          )}
          {message && !isSuccess && (
            <div className="text-sm font-medium text-destructive bg-destructive/10 border border-destructive/30 p-3 rounded-md">
              {message}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center text-sm">
          Remember your password?
          <Link to="/login" className="ml-1 underline">
            Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
} 