import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { TrendingUp } from 'lucide-react'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
            <TrendingUp className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
