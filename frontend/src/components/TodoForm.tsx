import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import api from '../api/client'
import { useTodos } from '../contexts/TodoContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'
import { Button } from './ui/Button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { DateTimePicker } from './ui/date-time-picker'
import { Plus, Calendar, FileText, Tag } from 'lucide-react'

const todoSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(100, 'Task name is too long'),
  shortDescription: z.string().min(1, 'Description is required').max(500, 'Description is too long'),
  dateTime: z.string().nonempty('Date and time is required'),
})

type TodoFormValues = z.infer<typeof todoSchema>

export default function TodoForm() {
  const { refetch } = useTodos()
  const form = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      name: '',
      shortDescription: '',
      dateTime: '',
    },
  })

  const onSubmit = async (data: TodoFormValues) => {
    await api.post('/todos', data)
    form.reset()
    await refetch()
  }

  return (
    <Card className="h-fit">
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-xl">Add New Task</CardTitle>
        </div>
        <CardDescription>
          Create a new task to stay organized and productive.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Tag className="h-4 w-4" />
                    <span>Task Name</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Finish project report" 
                      className="h-11"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Description</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Outline key sections, gather data, and write summary..."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Due Date & Time</span>
                  </FormLabel>
                  <FormControl>
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select due date and time"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Adding Task...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 