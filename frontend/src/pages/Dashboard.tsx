import TodoFormModal from '../components/TodoFormModal'
import TodoList from '../components/TodoList'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
            Organize your tasks, boost productivity, and achieve your goals.
          </p>
        </div>
        
        {/* Add Task Button */}
        <div className="flex-shrink-0">
          <TodoFormModal 
            trigger={
              <Button size="lg" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add New Task
              </Button>
            }
          />
        </div>
      </div>
      
      {/* Task List - Full Screen */}
      <div className="w-full">
        <TodoList />
      </div>
    </div>
  )
} 