import { supabase } from '../supabase'

// Get user profile by ID
export async function getProfile(userId) {
  try {
    if (!userId) {
      return { data: null, error: 'User ID is required', notFound: false }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Database error in getProfile:', error)
      throw error
    }

    if (!data) {
      return { data: null, error: null, notFound: true }
    }

    return { data, error: null, notFound: false }
  } catch (error) {
    console.error('Error fetching profile:', error)
    return { data: null, error: error.message, notFound: false }
  }
}

// Update user profile
export async function updateProfile(userId, updateData) {
  try {
    if (!userId) {
      return { data: null, error: 'User ID is required' }
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return { data: null, error: 'Update data is required' }
    }

    // Validate user_type if provided
    if (updateData.user_type && !['customer', 'admin', 'super_admin'].includes(updateData.user_type)) {
      return { data: null, error: 'Invalid user_type. Must be "customer", "admin", or "super_admin"' }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Database error in updateProfile:', error)
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { data: null, error: error.message }
  }
}

// Create new profile (fallback if trigger fails)
export async function createProfile(profileData) {
  try {
    if (!profileData || !profileData.id || !profileData.email || !profileData.full_name) {
      return { data: null, error: 'Profile data with id, email, and full_name is required' }
    }

    // Validate user_type if provided
    if (profileData.user_type && !['customer', 'admin', 'super_admin'].includes(profileData.user_type)) {
      return { data: null, error: 'Invalid user_type. Must be "customer", "admin", or "super_admin"' }
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single()

    if (error) {
      console.error('Database error in createProfile:', error)
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error creating profile:', error)
    return { data: null, error: error.message }
  }
}

// Get all profiles (admin function) with pagination support
export async function getAllProfiles(options = {}) {
  try {
    const { limit = null, offset = 0, searchTerm = null } = options

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply search filter if provided
    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    }

    // Apply pagination
    if (limit) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Database error in getAllProfiles:', error)
      throw error
    }

    return { data, count, error: null }
  } catch (error) {
    console.error('Error fetching all profiles:', error)
    return { data: null, count: 0, error: error.message }
  }
}

// Admin version that accepts a custom supabase client (for server-side with service role)
export async function getCustomersWithEnquiriesAdmin(supabaseClient, options = {}) {
  try {
    const {
      limit = null,
      offset = 0,
      searchTerm = null,
      hasDiscount = null,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options

    let query = supabaseClient
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('user_type', 'customer')

    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    }

    if (hasDiscount === true) {
      query = query.filter('discount_percentage', 'is.not', null)
    } else if (hasDiscount === false) {
      query = query.is('discount_percentage', null)
    }

    if (sortBy !== 'enquiry_count') {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    if (limit) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data: customers, error: customersError, count } = await query

    if (customersError) {
      console.error('Database error in getCustomersWithEnquiriesAdmin:', customersError)
      throw customersError
    }

    const { data: enquiries, error: enquiriesError } = await supabaseClient
      .from('enquiries')
      .select('customerDetails')

    if (enquiriesError) {
      console.error('Error fetching enquiries:', enquiriesError)
    }

    const enquiryCounts = {}
    if (enquiries) {
      enquiries.forEach(enquiry => {
        const email = enquiry.customerDetails?.email
        if (email) {
          enquiryCounts[email.toLowerCase()] = (enquiryCounts[email.toLowerCase()] || 0) + 1
        }
      })
    }

    let customersWithEnquiries = (customers || []).map(customer => ({
      ...customer,
      enquiry_count: enquiryCounts[customer.email.toLowerCase()] || 0
    }))

    if (sortBy === 'enquiry_count') {
      customersWithEnquiries.sort((a, b) => {
        return sortOrder === 'asc'
          ? a.enquiry_count - b.enquiry_count
          : b.enquiry_count - a.enquiry_count
      })
    }

    return { data: customersWithEnquiries, count, error: null }
  } catch (error) {
    console.error('Error in getCustomersWithEnquiriesAdmin:', error)
    return { data: null, count: 0, error: error.message }
  }
}

// Update user type (admin function)
export async function updateUserType(userId, userType) {
  try {
    if (!userId) {
      return { data: null, error: 'User ID is required' }
    }

    if (!['customer', 'admin', 'super_admin'].includes(userType)) {
      return { data: null, error: 'Invalid user_type. Must be "customer", "admin", or "super_admin"' }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ user_type: userType })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Database error in updateUserType:', error)
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error updating user type:', error)
    return { data: null, error: error.message }
  }
}

// Search profiles by name or email
export async function searchProfiles(searchTerm, options = {}) {
  try {
    if (!searchTerm) {
      return { data: null, error: 'Search term is required' }
    }

    const { limit = 50 } = options

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('full_name', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Database error in searchProfiles:', error)
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error searching profiles:', error)
    return { data: null, error: error.message }
  }
}

// Update customer discount percentage
export async function updateCustomerDiscount(userId, discountPercentage) {
  try {
    if (!userId) {
      return { data: null, error: 'User ID is required' }
    }

    // Validate discount percentage
    let normalizedDiscount = null
    if (discountPercentage !== null && discountPercentage !== undefined) {
      const discountNumber = Number(discountPercentage)
      if (!Number.isFinite(discountNumber) || !Number.isInteger(discountNumber)) {
        return { data: null, error: 'Discount percentage must be an integer' }
      }
      normalizedDiscount = discountNumber
    }
    const { data, error } = await supabase
      .from('profiles')
      .update({ discount_percentage: normalizedDiscount })
      .eq('id', userId)
      .select()

    if (error) {
      console.error('Database error in updateCustomerDiscount:', error)
      throw error
    }

    const updatedProfile = Array.isArray(data) ? data[0] : data

    if (!updatedProfile) {
      return { data: null, error: 'Customer not found' }
    }

    return { data: updatedProfile, error: null }
  } catch (error) {
    console.error('Error updating customer discount:', error)
    return { data: null, error: error.message }
  }
}

// Get customers with enquiry counts
export async function getCustomersWithEnquiries(options = {}) {
  try {
    const { 
      limit = null, 
      offset = 0, 
      searchTerm = null, 
      hasDiscount = null,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options

    // First, get customers
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('user_type', 'customer')

    // Apply search filter
    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    }

    // Apply discount filter
    if (hasDiscount === true) {
      query = query.filter('discount_percentage', 'is.not', null)
    } else if (hasDiscount === false) {
      query = query.is('discount_percentage', null)
    }

    // Apply sorting (handle enquiry_count separately)
    if (sortBy !== 'enquiry_count') {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    // Apply pagination
    if (limit) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data: customers, error: customersError, count } = await query

    if (customersError) {
      console.error('Database error in getCustomersWithEnquiries:', customersError)
      throw customersError
    }

    // Get enquiry counts for each customer
    const { data: enquiries, error: enquiriesError } = await supabase
      .from('enquiries')
      .select('customerDetails')

    if (enquiriesError) {
      console.error('Error fetching enquiries:', enquiriesError)
      // Continue with zero counts if enquiries fetch fails
    }

    // Count enquiries by email
    const enquiryCounts = {}
    if (enquiries) {
      enquiries.forEach(enquiry => {
        const email = enquiry.customerDetails?.email
        if (email) {
          enquiryCounts[email.toLowerCase()] = (enquiryCounts[email.toLowerCase()] || 0) + 1
        }
      })
    }

    // Merge enquiry counts with customer data
    let customersWithEnquiries = (customers || []).map(customer => ({
      ...customer,
      enquiry_count: enquiryCounts[customer.email.toLowerCase()] || 0
    }))

    // Sort by enquiry_count if requested
    if (sortBy === 'enquiry_count') {
      customersWithEnquiries.sort((a, b) => {
        return sortOrder === 'asc' 
          ? a.enquiry_count - b.enquiry_count 
          : b.enquiry_count - a.enquiry_count
      })
    }

    return { data: customersWithEnquiries, count, error: null }
  } catch (error) {
    console.error('Error in getCustomersWithEnquiries:', error)
    return { data: null, count: 0, error: error.message }
  }
}

// Get single customer with their enquiries
export async function getCustomerWithEnquiries(userId) {
  try {
    if (!userId) {
      return { data: null, error: 'User ID is required' }
    }

    // Get customer profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .limit(1)

    if (profileError) {
      console.error('Database error in getCustomerWithEnquiries:', profileError)
      throw profileError
    }

    const profile = Array.isArray(profileData) ? profileData[0] : profileData

    if (!profile) {
      return { data: null, error: 'Customer not found' }
    }

    // Get enquiries by email
    const { data: enquiries, error: enquiriesError } = await supabase
      .from('enquiries')
      .select('*')
      .ilike('customerDetails->>email', profile.email)
      .order('created_at', { ascending: false })

    if (enquiriesError) {
      console.error('Error fetching customer enquiries:', enquiriesError)
      // Continue with empty enquiries if fetch fails
    }

    // Transform enquiries to expected format
    const transformedEnquiries = (enquiries || []).map(enquiry => ({
      id: enquiry.id,
      customer_name: enquiry.customerDetails?.name || '',
      company: enquiry.customerDetails?.company || '',
      email: enquiry.customerDetails?.email || '',
      phone: enquiry.customerDetails?.phone || '',
      message: enquiry.customerDetails?.message || '',
      address: enquiry.customerDetails?.address || '',
      cart_items: enquiry.cartItems || [],
      delivery_method: null,
      status: enquiry.status || 'new',
      created_at: enquiry.created_at,
      updated_at: enquiry.created_at
    }))

    return { 
      data: { 
        profile, 
        enquiries: transformedEnquiries 
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error in getCustomerWithEnquiries:', error)
    return { data: null, error: error.message }
  }
}

// Get customer statistics
export async function getCustomerStats() {
  try {
    const { data: customers, error } = await supabase
      .from('profiles')
      .select('discount_percentage, created_at')
      .eq('user_type', 'customer')

    if (error) throw error

    return buildCustomerStats(customers)
  } catch (error) {
    console.error('Error fetching customer stats:', error)
    return { data: null, error: error.message }
  }
}

// Admin variant that accepts a custom Supabase client
export async function getCustomerStatsAdmin(supabaseClient) {
  try {
    const { data: customers, error } = await supabaseClient
      .from('profiles')
      .select('discount_percentage, created_at')
      .eq('user_type', 'customer')

    if (error) throw error

    return buildCustomerStats(customers)
  } catch (error) {
    console.error('Error fetching customer stats (admin):', error)
    return { data: null, error: error.message }
  }
}

function buildCustomerStats(customers = []) {
  const totalCustomers = customers.length

  const customersWithDiscount = customers.filter(customer => customer.discount_percentage !== null && customer.discount_percentage !== undefined)
  const customersWithDiscountCount = customersWithDiscount.length

  let averageDiscount = 0
  if (customersWithDiscountCount > 0) {
    const sum = customersWithDiscount.reduce((acc, row) => acc + (parseFloat(row.discount_percentage) || 0), 0)
    averageDiscount = parseFloat((sum / customersWithDiscountCount).toFixed(2))
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

  const recentRegistrations = customers.filter(customer => {
    const createdAt = customer.created_at ? new Date(customer.created_at).toISOString() : null
    return createdAt && createdAt >= thirtyDaysAgoISO
  }).length

  return {
    data: {
      totalCustomers,
      customersWithDiscount: customersWithDiscountCount,
      averageDiscount,
      recentRegistrations
    },
    error: null
  }
}
