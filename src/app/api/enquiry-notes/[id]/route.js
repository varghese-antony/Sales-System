import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const { id } = params;
  
  try {
    const { content } = await request.json();
    
    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // First, check if the note exists and belongs to the user
    const { data: existingNote, error: fetchError } = await supabase
      .from('enquiry_notes')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    if (existingNote.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this note' },
        { status: 403 }
      );
    }

    // Update the note
    const { data: note, error: updateError } = await supabase
      .from('enquiry_notes')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id,
        profiles (id, full_name, email)
      `)
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating enquiry note:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // First, check if the note exists and belongs to the user
    const { data: existingNote, error: fetchError } = await supabase
      .from('enquiry_notes')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    if (existingNote.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this note' },
        { status: 403 }
      );
    }

    // Delete the note
    const { error: deleteError } = await supabase
      .from('enquiry_notes')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting enquiry note:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
