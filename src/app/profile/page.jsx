"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { LoadingSpinner } from '../../components/ui/loading'
import { Button } from '../../components/ui/button'
import { User, Mail, Shield, Calendar } from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, loading, isAdmin } = useAuth()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/profile')
    }
  }, [user, loading, router])

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, don't show profile
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-indigo-50/30 to-blue-50/50 dark:from-purple-950/20 dark:via-indigo-950/10 dark:to-blue-950/20">
      <div className="container mx-auto p-4 max-w-2xl pt-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground">Manage your account information</p>
          </div>

          {/* Profile Information Card */}
          <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {/* Full Name */}
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                    <p className="font-medium">
                      {profile?.full_name || user.user_metadata?.full_name || 'Not provided'}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                {/* Account Type */}
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                    <p className="font-medium">
                      {isAdmin ? (
                        <span className="text-purple-600 dark:text-purple-400">Administrator</span>
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400">Customer</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Account Created */}
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300">
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/reset-password')}
              >
                Change Password
              </Button>
              
              {isAdmin && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/admin-dashboard')}
                >
                  Go to Admin Dashboard
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/')}
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
