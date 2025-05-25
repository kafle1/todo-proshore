import { useTodos } from '../contexts/TodoContext'
import TodoItem from './TodoItem'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckSquare, Clock, List } from 'lucide-react'

export default function TodoList() {
  const { todos, filter, setFilter } = useTodos()
  
  const filterOptions = [
    { key: 'ALL', label: 'All', shortLabel: 'All', icon: List },
    { key: 'UPCOMING', label: 'Pending', shortLabel: 'Pending', icon: Clock },
    { key: 'COMPLETED', label: 'Completed', shortLabel: 'Done', icon: CheckSquare },
  ]

  const getTaskCount = () => {
    switch (filter) {
      case 'COMPLETED':
        return todos.filter(todo => todo.isDone).length
      case 'UPCOMING':
        return todos.filter(todo => !todo.isDone).length
      default:
        return todos.length
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <List className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Your Tasks</CardTitle>
              <CardDescription className="mt-1">
                Manage and track your progress across all your tasks.
              </CardDescription>
            </div>
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {getTaskCount()} {getTaskCount() === 1 ? 'task' : 'tasks'}
          </div>
        </div>
        
        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(value) => setFilter(value as 'ALL' | 'COMPLETED' | 'UPCOMING')} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-11">
            {filterOptions.map(({ key, label, shortLabel, icon: Icon }) => (
              <TabsTrigger key={key} value={key} className="flex items-center justify-center px-2 space-x-1 text-xs sm:space-x-2 sm:text-sm">
                <Icon className="flex-shrink-0 w-3 h-3 sm:h-4 sm:w-4" />
                <span className="hidden truncate sm:inline">{label}</span>
                <span className="truncate sm:hidden">{shortLabel}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4 sm:p-6">
        {todos.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {todos.map(todo => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center sm:py-16">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full sm:h-16 sm:w-16 bg-muted">
              <List className="w-6 h-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-medium sm:text-xl">
              {filter === 'ALL'
                ? "No tasks yet"
                : `No ${filter.toLowerCase()} tasks`}
            </h3>
            <p className="max-w-md mx-auto text-sm sm:text-base text-muted-foreground">
              {filter === 'ALL'
                ? "Add your first task to get started!"
                : `You don't have any ${filter.toLowerCase()} tasks right now.`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 