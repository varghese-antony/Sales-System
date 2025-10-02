"use client"

import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile, createProfile } from '../lib/database/profiles'

// Simple in-memory cache with TTL for profiles and sessions
const profileCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const AuthContext = createContext()

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }

    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        loading: false
      }

    case 'SET_PROFILE':
      return {
        ...state,
        profile: action.payload
      }

    case 'SET_SESSION_RESTORED':
      return {
        ...state,
        sessionRestored: action.payload
      }

    case 'SET_AUTH_STATE_CHANGE':
      return {
        ...state,
        authStateChange: action.payload
      }

    case 'SET_OPERATION_LOADING':
      return {
        ...state,
        [action.operation]: action.payload
      }

    case 'SIGN_OUT':
      return {
        user: null,
        profile: null,
        loading: false,
        error: null,
        sessionRestored: false,
        authStateChange: null,
        signingIn: false,
        signingUp: false,
        signingOut: false
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      }

    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    profile: null,
    loading: true,
    error: null,
    sessionRestored: false,
    authStateChange: null,
    signingIn: false,
    signingUp: false,
    signingOut: false
  })

  // Memoized computed property for admin status
  const isAdmin = useMemo(() => state.profile?.user_type === 'admin', [state.profile])

  // Initialize auth state and set up listeners
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
          dispatch({ type: 'SET_LOADING', payload: false })
          return
        }

        if (session?.user) {
          dispatch({ type: 'SET_USER', payload: session.user })
          // Mark session as restored from cookies
          dispatch({ type: 'SET_SESSION_RESTORED', payload: true })
          // Fetch profile after setting user (with caching)
          await fetchProfileCached(session.user.id)
        } else {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize authentication' })
      }
    }

    getInitialSession()

    // Set up auth state change listener with debouncing
    let debounceTimer = null
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Clear existing debounce timer
        if (debounceTimer) {
          clearTimeout(debounceTimer)
        }

        // Debounce auth state changes to prevent rapid successive calls
        debounceTimer = setTimeout(async () => {
          console.log('Auth state changed:', event, session?.user?.id)
          
          // Track auth state change event
          dispatch({ type: 'SET_AUTH_STATE_CHANGE', payload: event })

          if (event === 'SIGNED_IN' && session?.user) {
            dispatch({ type: 'SET_USER', payload: session.user })
            await fetchProfileCached(session.user.id)
          } else if (event === 'SIGNED_OUT') {
            dispatch({ type: 'SIGN_OUT' })
            clearProfileCache()
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            dispatch({ type: 'SET_USER', payload: session.user })
            // Only refetch profile if it's been more than 2 minutes since last fetch
            const cached = profileCache.get(session.user.id)
            if (!cached || (Date.now() - cached.timestamp) > 2 * 60 * 1000) {
              await fetchProfileCached(session.user.id)
            }
          }
          
          // Clear auth state change after a short delay
          setTimeout(() => {
            dispatch({ type: 'SET_AUTH_STATE_CHANGE', payload: null })
          }, 1000)
        }, 100) // 100ms debounce
      }
    )

    // Cleanup subscription on unmount
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      subscription.unsubscribe()
    }
  }, [])

  // Cached profile fetching function
  const fetchProfileCached = useCallback(async (userId) => {
    try {
      // Check cache first
      const cached = profileCache.get(userId)
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        dispatch({ type: 'SET_PROFILE', payload: cached.data })
        return
      }

      const { data: profile, error, notFound } = await getProfile(userId)

      if (error) {
        console.error('Error fetching profile:', error)
        dispatch({ type: 'SET_PROFILE', payload: null })
        return
      }

      if (notFound) {
        console.log('Profile not found, attempting to create profile...')
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: newProfile, error: createError } = await createProfile({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User'
          })

          if (!createError && newProfile) {
            // Cache the new profile
            profileCache.set(userId, {
              data: newProfile,
              timestamp: Date.now()
            })
            dispatch({ type: 'SET_PROFILE', payload: newProfile })
            return
          }

          if (createError) {
            console.error('Error creating profile fallback:', createError)
          }
        }

        dispatch({ type: 'SET_PROFILE', payload: null })
        return
      }

      // Cache the profile
      profileCache.set(userId, {
        data: profile,
        timestamp: Date.now()
      })
      dispatch({ type: 'SET_PROFILE', payload: profile })
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      dispatch({ type: 'SET_PROFILE', payload: null })
    }
  }, [])

  // Clear profile cache function
  const clearProfileCache = useCallback(() => {
    profileCache.clear()
  }, [])

  // Refresh profile function (force refetch)
  const refreshProfile = useCallback(async () => {
    if (!state.user?.id) return
    
    // Clear cache for this user
    profileCache.delete(state.user.id)
    
    // Fetch fresh profile
    await fetchProfileCached(state.user.id)
  }, [state.user, fetchProfileCached])

  // Authentication functions
  const signIn = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_OPERATION_LOADING', operation: 'signingIn', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        let errorMessage = error.message
        
        // Provide more specific error messages
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email before signing in'
        } else if (error.message.includes('network')) {
          errorMessage = 'Unable to connect. Check your internet connection.'
        }
        
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
        return { success: false, error: errorMessage }
      }

      // Profile will be fetched via the auth state change listener
      return { success: true, user: data.user }
    } catch (error) {
      console.error('Error in signIn:', error)
      const errorMessage = error.message?.includes('network') 
        ? 'Unable to connect. Check your internet connection.'
        : 'An unexpected error occurred during sign in'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return { success: false, error: errorMessage }
    } finally {
      dispatch({ type: 'SET_OPERATION_LOADING', operation: 'signingIn', payload: false })
    }
  }

  const signUp = async (email, password, fullName) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_OPERATION_LOADING', operation: 'signingUp', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) {
        let errorMessage = error.message
        
        // Provide more specific error messages
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          errorMessage = 'Email already registered. Try signing in instead.'
        } else if (error.message.includes('Password')) {
          errorMessage = 'Password too weak. Please use a stronger password.'
        } else if (error.message.includes('network')) {
          errorMessage = 'Unable to connect. Check your internet connection.'
        }
        
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
        return { success: false, error: errorMessage }
      }

      // Profile will be created automatically by the database trigger
      // and fetched via the auth state change listener
      return { success: true, user: data.user }
    } catch (error) {
      console.error('Error in signUp:', error)
      const errorMessage = error.message?.includes('network')
        ? 'Unable to connect. Check your internet connection.'
        : 'An unexpected error occurred during sign up'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return { success: false, error: errorMessage }
    } finally {
      dispatch({ type: 'SET_OPERATION_LOADING', operation: 'signingUp', payload: false })
    }
  }

  const signOut = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_OPERATION_LOADING', operation: 'signingOut', payload: true })

      const { error } = await supabase.auth.signOut()

      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
        return { success: false, error: error.message }
      }

      // State will be cleared via the auth state change listener
      // Cache will be cleared when SIGNED_OUT event fires
      return { success: true }
    } catch (error) {
      console.error('Error in signOut:', error)
      const errorMessage = error.message?.includes('network')
        ? 'Unable to connect. Check your internet connection.'
        : 'An unexpected error occurred during sign out'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return { success: false, error: errorMessage }
    } finally {
      dispatch({ type: 'SET_OPERATION_LOADING', operation: 'signingOut', payload: false })
    }
  }

  const resetPassword = async (email) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null })

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in resetPassword:', error)
      dispatch({ type: 'SET_ERROR', payload: 'An unexpected error occurred during password reset' })
      return { success: false, error: 'An unexpected error occurred during password reset' }
    }
  }

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user: state.user,
    profile: state.profile,
    isAdmin,
    loading: state.loading,
    error: state.error,
    sessionRestored: state.sessionRestored,
    authStateChange: state.authStateChange,
    signingIn: state.signingIn,
    signingUp: state.signingUp,
    signingOut: state.signingOut,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearProfileCache,
    refreshProfile
  }), [
    state.user, 
    state.profile, 
    isAdmin, 
    state.loading, 
    state.error,
    state.sessionRestored,
    state.authStateChange,
    state.signingIn,
    state.signingUp,
    state.signingOut,
    refreshProfile
  ])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}