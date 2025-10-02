"use client"

import { Suspense, useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { LoadingSpinner } from '../../components/ui/loading'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, user, profile, isAdmin, loading: authLoading, error: authError } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirectTo = useMemo(() => {
    const redirectParam = searchParams?.get('redirect')
    return redirectParam && redirectParam.startsWith('/') ? redirectParam : '/'
  }, [searchParams])

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && profile !== undefined) {
      // Check if trying to access admin route
      if (redirectTo.startsWith('/admin-dashboard')) {
        if (isAdmin) {
          setLoadingMessage('Already signed in. Redirecting to admin dashboard...')
          router.replace(redirectTo)
        } else {
          // Non-admin trying to access admin route - show warning and redirect home
          setFormError("You don't have admin access. Redirecting to home...")
          setLoadingMessage('Redirecting...')
          setTimeout(() => {
            router.replace('/')
          }, 1500)
        }
      } else {
        // Not an admin route, redirect normally
        setLoadingMessage('Already signed in. Redirecting...')
        router.replace(redirectTo)
      }
    }
  }, [user, authLoading, profile, isAdmin, router, redirectTo])

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // If already authenticated, don't show login form
  if (user) {
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setLoadingMessage('Signing in...')
    setFormError('')

    try {
      const result = await signIn(email, password)

      if (result.success) {
        setLoadingMessage('Verifying access...')
        
        // Wait a moment for profile to load
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Check if user is trying to access admin route but is not admin
        if (redirectTo.startsWith('/admin-dashboard')) {
          // Get the latest profile state
          const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession())
          const { data: profileData } = await import('@/lib/supabase').then(m => 
            m.supabase.from('profiles').select('user_type').eq('id', session?.user?.id).single()
          )
          
          if (profileData?.user_type !== 'admin') {
            setFormError("You don't have admin access. Redirecting to home...")
            setLoadingMessage('Redirecting...')
            setTimeout(() => {
              router.replace('/')
            }, 1500)
            return
          }
        }
        
        setLoadingMessage('Redirecting...')
        router.replace(redirectTo)
      } else {
        // Provide more specific error messages
        const errorMsg = result.error || ''
        if (errorMsg.includes('Invalid login credentials')) {
          setFormError('Invalid email or password')
        } else if (errorMsg.includes('Email not confirmed')) {
          setFormError('Please verify your email before signing in')
        } else if (errorMsg.includes('User not found')) {
          setFormError('Account not found')
        } else {
          setFormError(errorMsg || 'Unable to sign in with the provided credentials')
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setFormError('An unexpected error occurred while attempting to sign in')
    } finally {
      setLoading(false)
      if (!formError) {
        setLoadingMessage('')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-indigo-50/30 to-blue-50/50 dark:from-purple-950/20 dark:via-indigo-950/10 dark:to-blue-950/20 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="login-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-grid)" />
        </svg>
      </div>

      <div className="container mx-auto p-4 max-w-md relative z-10 flex items-center justify-center min-h-screen">
        <Card className="w-full border border-border/50 hover:border-primary/30 transition-all duration-300">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">Welcome Back</CardTitle>
            <p className="text-muted-foreground">Sign in to your account</p>
          </CardHeader>
          <CardContent>
            {/* Helper text about admin access */}
            <div className="mb-4 text-xs text-muted-foreground text-center p-3 bg-muted/30 rounded-lg">
              Admin access is granted by the tech team. Contact support if you need admin privileges.
            </div>
            {(authError || formError) && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>
                  {formError || authError}
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-background border-border"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="bg-background border-border pr-10"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    href="/reset-password"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>{loadingMessage || 'Signing in...'}</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link
                  href="/register"
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}