"use client"

import { Component, useEffect } from "react"
import { Suspense } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { LoadingSpinner } from "@/components/ui/loading"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, Mail } from "lucide-react"

class AdminDashboardErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Admin dashboard rendering error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development'
      
      return (
        <div className="flex h-full min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 py-12 text-center sm:px-12">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Something went wrong</h1>
            <p className="max-w-lg text-muted-foreground">
              We hit a snag while loading the admin dashboard. Please try refreshing the page or contact support if the
              problem persists.
            </p>
          </div>

          {isDev && this.state.error && (
            <div className="max-w-2xl w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-left">
              <p className="text-sm font-mono text-red-900 dark:text-red-100 break-all">
                {this.state.error.toString()}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            
            <Button
              asChild
              variant="outline"
              className="border-indigo-200 dark:border-indigo-800"
            >
              <a href="mailto:support@example.com">
                <Mail className="w-4 h-4 mr-2" />
                Report Issue
              </a>
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function AdminDashboardContent({ children }) {
  const { sessionRestored, user, profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    // Show welcome back notification when session is restored
    if (sessionRestored && user && profile?.user_type === 'admin') {
      // Only show on first load, not on every navigation
      const hasShownWelcome = sessionStorage.getItem('admin_welcome_shown')
      if (!hasShownWelcome) {
        sessionStorage.setItem('admin_welcome_shown', 'true')
        
        // Show toast notification to user
        toast({
          title: 'Welcome back!',
          description: 'Your session has been restored successfully.',
          variant: 'default',
          duration: 4000
        })
      }
    }
  }, [sessionRestored, user, profile, toast])

  return (
    <div className="min-h-screen bg-background">
      <Suspense 
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-indigo-950/20 flex items-center justify-center">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">Loading admin dashboard...</p>
            </div>
          </div>
        }
      >
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </Suspense>
    </div>
  )
}

export default function AdminDashboardLayout({ children }) {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminDashboardErrorBoundary>
        <AdminDashboardContent>{children}</AdminDashboardContent>
      </AdminDashboardErrorBoundary>
    </ProtectedRoute>
  )
}
