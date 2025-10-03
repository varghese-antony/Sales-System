import { NextResponse } from 'next/server'
import { createDirectServerClient } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const body = await request.json()
    const customerId = body?.customerId
    const rawDiscount = body?.discount

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    let normalizedDiscount = null
    if (rawDiscount !== null && rawDiscount !== undefined && rawDiscount !== '') {
      const discountNumber = Number(rawDiscount)
      if (!Number.isFinite(discountNumber) || !Number.isInteger(discountNumber)) {
        return NextResponse.json(
          { error: 'Discount must be an integer' },
          { status: 400 }
        )
      }
      normalizedDiscount = discountNumber
    }

    const supabase = createDirectServerClient()

    const { data, error } = await supabase
      .from('profiles')
      .update({ discount_percentage: normalizedDiscount })
      .eq('id', customerId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Database error updating discount:', error)
      throw error
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Failed to update customer discount:', error)
    return NextResponse.json(
      { error: 'Failed to update customer discount', message: error.message },
      { status: 500 }
    )
  }
}
