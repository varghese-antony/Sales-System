"use client"

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ShieldAlert, Home, Mail, LogIn } from 'lucide-react'

function UnauthorizedPageContent() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const attemptedUrl = searchParams?.get('attempted') || '/admin-dashboard'

  // If user is admin, redirect them away (they shouldn't be here)
  useEffect(() => {
    if (!loading && profile?.user_type === 'admin') {
      router.replace(attemptedUrl)
    }
  }, [loading, profile, router, attemptedUrl])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-orange-50/30 to-yellow-50/50 dark:from-red-950/20 dark:via-orange-950/10 dark:to-yellow-950/20 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="unauthorized-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#unauthorized-grid)" />
        </svg>
      </div>

      <div className="container mx-auto p-4 max-w-2xl relative z-10 flex items-center justify-center min-h-screen">
        <Card className="w-full border border-border/50 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <ShieldAlert className="w-16 h-16 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-foreground mb-2">
              Access Denied
            </CardTitle>
            <p className="text-lg text-muted-foreground">
              You don't have permission to access this page
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Main Error Alert */}
            <Alert variant="destructive" className="border-red-200 dark:border-red-800">
              <ShieldAlert className="h-5 w-5" />
              <AlertTitle className="font-semibold">Admin Access Required</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-2">
                  You are not an Admin. Please contact the tech team if you think this is a mistake!
                </p>
                {attemptedUrl && attemptedUrl !== '/admin-dashboard' && (
                  <p className="text-sm mt-2 opacity-80">
                    Attempted to access: <code className="bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded text-xs">{attemptedUrl}</code>
                  </p>
                )}
              </AlertDescription>
            </Alert>

            {/* User Info */}
            {user && profile && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Your Account Information
                </h3>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Account Type:</span>{' '}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {profile.user_type === 'customer' ? 'Customer' : profile.user_type}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Not Logged In Message */}
            {!user && !loading && (
              <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
                <LogIn className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-900 dark:text-blue-100">Not Signed In</AlertTitle>
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  You need to sign in with an admin account to access this section.
                </AlertDescription>
              </Alert>
            )}

            {/* Help Text */}
            <div className="bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-2">
                Need Admin Access?
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Admin privileges are granted by the technical team. If you believe you should have admin access, 
                please contact support with your account details.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                asChild
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              
              {!user ? (
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 border-indigo-200 dark:border-indigo-800"
                >
                  <Link href="/login">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
              ) : (
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
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md border border-border/50 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-semibold text-foreground">
                Loading access details...
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Please wait while we verify your permissions.
            </CardContent>
          </Card>
        </div>
      }
    >
      <UnauthorizedPageContent />
    </Suspense>
  )
}
