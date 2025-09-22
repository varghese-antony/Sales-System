"use client"

import { createContext, useContext, useReducer, useEffect, useState } from 'react'

const CouponContext = createContext()

const couponReducer = (state, action) => {
  switch (action.type) {
    case 'SET_COUPONS':
      return {
        ...state,
        coupons: action.payload,
        loading: false,
        error: null
      }
    case 'SET_LOADING':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'SET_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      }
    case 'APPLY_COUPON':
      return {
        ...state,
        appliedCoupon: action.payload,
        error: null
      }
    case 'REMOVE_COUPON':
      return {
        ...state,
        appliedCoupon: null,
        error: null
      }
    default:
      return state
  }
}

export function CouponProvider({ children }) {
  const [state, dispatch] = useReducer(couponReducer, {
    coupons: [],
    loading: false,
    error: null,
    appliedCoupon: null
  })

  const fetchCoupons = async () => {
    dispatch({ type: 'SET_LOADING' })
    try {
      const response = await fetch('https://n8n.werposolutions.com/webhook/get-coupon')
      if (!response.ok) {
        throw new Error('Failed to fetch coupons')
      }
      const data = await response.json()
      dispatch({ type: 'SET_COUPONS', payload: data })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
    }
  }

  const createCoupon = async (couponData) => {
    try {
      const response = await fetch('https://n8n.werposolutions.com/webhook/post-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData),
      })
      if (!response.ok) {
        throw new Error('Failed to create coupon')
      }
      await fetchCoupons() // Refresh the list
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const deleteCoupon = async (couponId) => {
    try {
      const response = await fetch(`https://n8n.werposolutions.com/webhook/delete-coupon?id=${couponId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete coupon')
      }
      await fetchCoupons() // Refresh the list
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const applyCoupon = (couponCode) => {
    const coupon = state.coupons.find(c => c.coupon_code === couponCode)
    if (!coupon) {
      dispatch({ type: 'SET_ERROR', payload: 'Invalid coupon code' })
      return false
    }

    const now = new Date()
    const expiry = new Date(coupon.expiry)
    if (now > expiry) {
      dispatch({ type: 'SET_ERROR', payload: 'Coupon has expired' })
      return false
    }

    dispatch({ type: 'APPLY_COUPON', payload: coupon })
    return true
  }

  const removeCoupon = () => {
    dispatch({ type: 'REMOVE_COUPON' })
  }

  const value = {
    coupons: state.coupons,
    loading: state.loading,
    error: state.error,
    appliedCoupon: state.appliedCoupon,
    fetchCoupons,
    createCoupon,
    deleteCoupon,
    applyCoupon,
    removeCoupon
  }

  // Fetch coupons on mount
  useEffect(() => {
    fetchCoupons()
  }, [])

  return (
    <CouponContext.Provider value={value}>
      {children}
    </CouponContext.Provider>
  )
}

export function useCoupon() {
  const context = useContext(CouponContext)
  if (!context) {
    throw new Error('useCoupon must be used within a CouponProvider')
  }
  return context
}
