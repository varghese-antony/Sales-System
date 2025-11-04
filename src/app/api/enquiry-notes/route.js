import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const enquiryId = searchParams.get('enquiryId');
  
  if (!enquiryId) {
    return NextResponse.json(
      { error: 'Enquiry ID is required' },
      { status: 400 }
    );
  }

  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { data: notes, error } = await supabase
      .from('enquiry_notes')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id,
        profiles (id, full_name, email)
      `)
      .eq('enquiry_id', enquiryId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(notes || []);
  } catch (error) {
    console.error('Error fetching enquiry notes:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { enquiryId, content } = await request.json();
    
    if (!enquiryId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Enquiry ID and content are required' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { data: note, error } = await supabase
      .from('enquiry_notes')
      .insert([
        {
          enquiry_id: enquiryId,
          user_id: session.user.id,
          content: content.trim()
        }
      ])
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id,
        profiles (id, full_name, email)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating enquiry note:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
