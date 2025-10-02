"use client"

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from './ui/loading'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Button } from './ui/button'
import { ShieldAlert, Home, Mail } from 'lucide-react'

function ProtectedRouteContent({
  children,
  requireAdmin = false,
  redirectTo = '/login',
  showInlineError = true
}) {
  const { user, profile, isAdmin, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [redirecting, setRedirecting] = useState(false)

  const currentPath = useMemo(() => {
    if (!pathname) return '/'
    const search = searchParams?.toString()
    return search ? `${pathname}?${search}` : pathname
  }, [pathname, searchParams])

  useEffect(() => {
    if (loading) return // Still loading, don't redirect yet

    if (!user) {
      // User not authenticated, redirect to login
      setRedirecting(true)
      const hasQuery = redirectTo.includes('?')
      const separator = hasQuery ? '&' : '?'
      
      // Small delay to show loading message
      setTimeout(() => {
        router.push(`${redirectTo}${separator}redirect=${encodeURIComponent(currentPath)}`)
      }, 300)
      return
    }

    if (requireAdmin && !isAdmin) {
      // User authenticated but not admin
      if (!showInlineError) {
        // Redirect to unauthorized page
        setRedirecting(true)
        setTimeout(() => {
          router.push(`/unauthorized?attempted=${encodeURIComponent(currentPath)}`)
        }, 500)
      }
      return
    }
  }, [user, profile, isAdmin, loading, requireAdmin, redirectTo, router, currentPath, showInlineError])

  // Show loading spinner while determining auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-indigo-950/20">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            {requireAdmin ? 'Verifying admin access...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    )
  }

  // Show redirecting state
  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-indigo-950/20">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">Redirecting...</p>
        </div>
      </div>
    )
  }

  // If user is not authenticated, don't render anything (will redirect)
  if (!user) {
    return null
  }

  // If admin is required but user is not admin
  if (requireAdmin && !isAdmin) {
    // Show inline error if enabled
    if (showInlineError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-orange-50/30 to-yellow-50/50 dark:from-red-950/20 dark:via-orange-950/10 dark:to-yellow-950/20 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <ShieldAlert className="w-16 h-16 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-foreground">Access Denied</h1>
              <p className="text-lg text-muted-foreground">
                You don't have permission to access this page
              </p>
            </div>

            <Alert variant="destructive" className="border-red-200 dark:border-red-800">
              <ShieldAlert className="h-5 w-5" />
              <AlertTitle className="font-semibold">Admin Access Required</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-2">
                  You are not an Admin. Please contact the tech team if you think this is a mistake!
                </p>
                {profile && (
                  <p className="text-sm mt-2">
                    Your account type: <span className="font-semibold">{profile.user_type === 'customer' ? 'Customer' : profile.user_type}</span>
                  </p>
                )}
              </AlertDescription>
            </Alert>

            <div className="bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-2">
                Need Admin Access?
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Admin privileges are granted by the technical team. If you believe you should have admin access, 
                please contact support with your account details.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              
              <Button
                asChild
                variant="outline"
                className="flex-1 border-indigo-200 dark:border-indigo-800"
              >
                <a href="mailto:support@example.com">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </a>
              </Button>
            </div>
          </div>
        </div>
      )
    }
    
    return null
  }

  // All checks passed, render the protected content
  return children
}

export function ProtectedRoute(props) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-indigo-950/20">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 dark:text-gray-300 font-medium">Loading page...</p>
          </div>
        </div>
      }
    >
      <ProtectedRouteContent {...props} />
    </Suspense>
  )
}