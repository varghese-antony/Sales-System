/*
 * TEMPORARILY DISABLED COUPON DATABASE FUNCTIONS
 *
 * This file contains coupon database functions including:
 * - getAllCoupons: Fetch all coupons from database
 * - createCoupon: Create new coupon in database
 * - deleteCoupon: Delete coupon by ID
 * - validateCoupon: Validate coupon code
 * - isCouponExpired: Check if coupon is expired
 * - applyCouponDiscount: Apply coupon discount to price
 *
 * To restore coupon functionality, uncomment the entire block below.
 * All database functions are preserved for future restoration.
 */

/*
import { supabase } from '../supabase'

// Get all coupons
export async function getAllCoupons() {
  try {
    const { data, error } = await supabase
      .from('coupon_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return { data: null, error: error.message }
  }
}

// Create new coupon
export async function createCoupon(couponData) {
  try {
    const { data, error } = await supabase
      .from('coupon_codes')
      .insert([{
        coupon_code: couponData.coupon_code,
        change: couponData.change,
        expiry: couponData.expiry
      }])
      .select()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating coupon:', error)
    return { data: null, error: error.message }
  }
}

// Delete coupon
export async function deleteCoupon(couponId) {
  try {
    const { data, error } = await supabase
      .from('coupon_codes')
      .delete()
      .eq('id', couponId)
      .select()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return { data: null, error: error.message }
  }
}

// Validate coupon code
export async function validateCoupon(code) {
  try {
    const { data, error } = await supabase
      .from('coupon_codes')
      .select('*')
      .eq('coupon_code', code.toUpperCase())
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error validating coupon:', error)
    return { data: null, error: error.message }
  }
}

// Check if coupon is expired
export function isCouponExpired(coupon) {
  if (!coupon.expiry) return false

  const now = new Date()
  const expiry = new Date(coupon.expiry)
  return now > expiry
}

// Apply coupon discount
export function applyCouponDiscount(originalPrice, coupon) {
  if (!coupon || !coupon.change) return originalPrice

  const discount = Math.abs(coupon.change)
  const isNegative = coupon.change < 0

  if (isNegative) {
    // Negative change means price increase (e.g., -10 means 10% increase)
    return originalPrice * (1 + discount / 100)
  } else {
    // Positive change means discount (e.g., 10 means 10% discount)
    return originalPrice * (1 - discount / 100)
  }
}
*/
