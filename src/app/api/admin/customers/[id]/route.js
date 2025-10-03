import { NextResponse } from 'next/server'
import { createDirectServerClient } from '@/lib/supabase-server'

export async function GET(request, { params }) {
  try {
    const customerId = params?.id

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    const supabase = createDirectServerClient()

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', customerId)
      .maybeSingle()

    if (profileError) {
      throw profileError
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const { data: enquiries, error: enquiriesError } = await supabase
      .from('enquiries')
      .select('*')
      .ilike('customerDetails->>email', profile.email)
      .order('created_at', { ascending: false })

    if (enquiriesError) {
      throw enquiriesError
    }

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

    return NextResponse.json({ profile, enquiries: transformedEnquiries })
  } catch (error) {
    console.error('Failed to fetch customer details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer details', message: error.message },
      { status: 500 }
    )
  }
}
