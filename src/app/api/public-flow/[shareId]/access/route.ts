import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/* ---------- helpers ---------- */
const createServiceClient = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
      )
    : null;

const createAnonClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );

/* ---------- route ---------- */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }, // 👈 Promise
) {
  try {
    /* ----- segmento dinámico ----- */
    const { shareId } = await params;                   // 👈 await
    if (!shareId)
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });

    const service = createServiceClient();
    const supabase = service ?? createAnonClient();

    /* ----- comprobar share ----- */
    const { data: share, error: shareErr } = await supabase
      .from('public_flow_shares')
      .select('id, access_count, last_accessed')
      .eq('id', shareId)
      .eq('is_active', true)
      .maybeSingle();

    if (shareErr)
      return NextResponse.json(
        { error: 'Database error', details: shareErr.message },
        { status: 500 },
      );

    if (!share)
      return NextResponse.json({ error: 'Share not found or not active' }, { status: 404 });

    /* ----- actualizar acceso ----- */
    const now = new Date().toISOString();

    const { data: updated, error: updErr } = await supabase
      .from('public_flow_shares')
      .update({ last_accessed: now }) // trigger incrementa access_count
      .eq('id', shareId)
      .select();

    if (updErr)
      return NextResponse.json(
        { success: false, error: 'Could not update access count', details: updErr.message },
        { status: 500 },
      );

    /* ----- respuesta OK ----- */
    const newCount =
      updated && updated[0] ? updated[0].access_count : share.access_count + 1;

    return NextResponse.json({
      success: true,
      access_count: newCount,
      previous_count: share.access_count,
      timestamp: now,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: e.message },
      { status: 500 },
    );
  }
}
