import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {user && <Header />}
      <main className={user ? "container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" : ""}>
        {children}
      </main>
    </div>
  )
} 