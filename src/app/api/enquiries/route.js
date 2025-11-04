import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { customerDetails, cartItems } = body;

    // Validate required fields
    if (!customerDetails || !customerDetails.name || !customerDetails.email) {
      return NextResponse.json(
        { error: 'Missing required customer details' },
        { status: 400 }
      );
    }

    // Insert enquiry into Supabase
    const { data, error } = await supabase
      .from('enquiries')
      .insert([
        {
          customer_details: customerDetails,
          cart_items: cartItems || [],
          status: 'new',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save enquiry' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        enquiry: data,
        message: 'Enquiry saved successfully' 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    let query = supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch enquiries' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enquiries: data || []
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Enquiry ID is required' },
        { status: 400 }
      );
    }

    // First delete related notes
    const { error: notesError } = await supabase
      .from('enquiry_notes')
      .delete()
      .eq('enquiry_id', id);

    // Don't throw if notes deletion fails (notes might not exist)
    if (notesError) {
      console.warn('Warning deleting enquiry notes:', notesError);
    }

    // Then delete the enquiry
    const { error } = await supabase
      .from('enquiries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete enquiry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enquiry deleted successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
