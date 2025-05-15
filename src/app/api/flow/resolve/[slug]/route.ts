import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }, // 👈 Promise
) {
  /* ---------- resolver dinámico ---------- */
  const { slug } = await params;                      // 👈 await

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const { data: aliasData, error: aliasError } = await supabase
      .from('flow_aliases')
      .select(
        `
          flow_id,
          flows (
            user_id
          )
        `,
      )
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (aliasError) {
      return NextResponse.json({ error: `Database error: ${aliasError.message}` }, { status: 500 });
    }
    if (!aliasData) {
      return NextResponse.json({ error: 'Slug not found or not active' }, { status: 404 });
    }

    const ownerUserId =
      typeof aliasData.flows === 'object' && !Array.isArray(aliasData.flows)
        ? (aliasData.flows as { user_id?: string }).user_id
        : undefined;

    if (!aliasData.flow_id) {
      return NextResponse.json(
        { error: 'Associated flow ID not found for this slug' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      flow_id: aliasData.flow_id,
      owner_user_id: ownerUserId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An unexpected server error occurred' },
      { status: 500 },
    );
  }
}
