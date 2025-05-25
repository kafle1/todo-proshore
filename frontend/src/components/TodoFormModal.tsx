import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import api from '../api/client'
import { useTodos } from '../contexts/TodoContext'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { DateTimePicker } from './ui/date-time-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { Plus, Calendar, FileText, Tag } from 'lucide-react'

const todoSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(100, 'Task name is too long'),
  shortDescription: z.string().min(1, 'Description is required').max(500, 'Description is too long'),
  dateTime: z.string().nonempty('Date and time is required'),
})

type TodoFormValues = z.infer<typeof todoSchema>

interface TodoFormModalProps {
  trigger?: React.ReactNode
}

export default function TodoFormModal({ trigger }: TodoFormModalProps) {
  const { refetch } = useTodos()
  const [open, setOpen] = useState(false)
  const form = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      name: '',
      shortDescription: '',
      dateTime: '',
    },
  })

  const onSubmit = async (data: TodoFormValues) => {
    try {
      await api.post('/todos', data)
      form.reset()
      await refetch()
      setOpen(false)
    } catch (error) {
      console.error('Failed to create todo:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-11">
            <Plus className="w-4 h-4 mr-2" />
            Add New Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <span>Add New Task</span>
          </DialogTitle>
          <DialogDescription>
            Create a new task to stay organized and productive.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Tag className="w-4 h-4" />
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
                    <FileText className="w-4 h-4" />
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
                    <Calendar className="w-4 h-4" />
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
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 rounded-full animate-spin border-background border-t-transparent" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 