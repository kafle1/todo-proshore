import api from '../api/client'
import { useTodos } from '../contexts/TodoContext'
import { Card, CardContent } from './ui/Card'
import { Button } from './ui/Button'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, Clock, Calendar } from 'lucide-react'
import { cn } from '../lib/utils'

interface Todo {
  id: string
  name: string
  shortDescription: string
  dateTime: string
  isDone: boolean
}

export default function TodoItem({ todo }: { todo: Todo }) {
  const { refetch } = useTodos()

  const toggleDone = async () => {
    try {
      await api.put(`/todos/${todo.id}`, { isDone: !todo.isDone })
      refetch()
    } catch (error) {
      console.error("Failed to toggle todo status:", error)
      // Optionally, show an error message to the user
    }
  }

  const deleteTodo = async () => {
    try {
      await api.delete(`/todos/${todo.id}`)
      refetch()
    } catch (error) {
      console.error("Failed to delete todo:", error)
      // Optionally, show an error message to the user
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const isOverdue = date < now && !todo.isDone
    
    return {
      formatted: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      isOverdue
    }
  }

  const { formatted: formattedDate, isOverdue } = formatDate(todo.dateTime)

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 hover:shadow-md border-l-4",
      todo.isDone && "bg-muted/30 border-muted border-l-muted",
      isOverdue && !todo.isDone && "border-destructive/50 bg-destructive/5 border-l-destructive",
      !todo.isDone && !isOverdue && "border-l-primary/30"
    )}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <Checkbox
            id={`todo-${todo.id}`}
            checked={todo.isDone}
            onCheckedChange={toggleDone}
            className="mt-1 shrink-0"
          />
          <div className="flex-1 space-y-2 min-w-0 text-left">
            <label
              htmlFor={`todo-${todo.id}`}
              className={cn(
                "font-medium cursor-pointer text-sm sm:text-base leading-tight block text-left",
                todo.isDone && "line-through text-muted-foreground"
              )}
            >
              {todo.name}
            </label>
            {todo.shortDescription && (
              <p
                className={cn(
                  "text-xs sm:text-sm text-muted-foreground leading-relaxed text-left",
                  todo.isDone && "line-through"
                )}
              >
                {todo.shortDescription}
              </p>
            )}
            <div className={cn(
              "flex items-center space-x-2 text-xs",
              todo.isDone ? "text-muted-foreground/80" : isOverdue ? "text-destructive" : "text-muted-foreground"
            )}>
              {isOverdue && !todo.isDone ? (
                <Clock className="h-3 w-3 shrink-0" />
              ) : (
                <Calendar className="h-3 w-3 shrink-0" />
              )}
              <span className="font-medium truncate">
                {isOverdue && !todo.isDone ? 'Overdue: ' : 'Due: '}
                <span className="hidden sm:inline">{formattedDate}</span>
                <span className="sm:hidden">
                  {new Date(todo.dateTime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={deleteTodo}
            className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-8 w-8 sm:h-9 sm:w-9 transition-colors"
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 