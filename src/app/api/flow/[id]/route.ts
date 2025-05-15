import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // 👈  Promise
) {
  try {
    /* ---------- dynamic segment ---------- */
    const { id: flowId } = await params;           // 👈  await

    const auth = getAuth(request);
    const userId = auth.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!flowId) {
      return NextResponse.json({ error: 'Flow ID is required' }, { status: 400 });
    }

    /* ---------- Supabase user-level ---------- */
    const supabase = createServerSupabaseClient();
    const { data: flow, error } = await supabase
      .from('flows')
      .select('id, user_id, name')
      .eq('id', flowId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'DB error', details: error.message }, { status: 500 });
    }
    if (flow) {
      if (flow.user_id !== userId) {
        return NextResponse.json(
          { error: 'Flow not found for this user', ownerMismatch: true, flowExists: true },
          { status: 404 },
        );
      }
      return NextResponse.json({ exists: true, id: flowId, user_id: flow.user_id });
    }

    /* ---------- service-role fallback ---------- */
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const serviceClient = createServiceRoleClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } },
      );

      const { data: serviceFlow, error: serviceError } = await serviceClient
        .from('flows')
        .select('id, user_id, name')
        .eq('id', flowId)
        .maybeSingle();

      if (serviceError) {
        return NextResponse.json({ error: 'Service DB error', details: serviceError.message }, { status: 500 });
      }
      if (serviceFlow) {
        if (serviceFlow.user_id !== userId) {
          return NextResponse.json(
            { error: 'Flow not found for this user', ownerMismatch: true, flowExists: true },
            { status: 404 },
          );
        }
        return NextResponse.json({
          exists: true,
          id: flowId,
          user_id: serviceFlow.user_id,
          method: 'service',
        });
      }
    }

    return NextResponse.json(
      { error: 'Flow not found', details: `Flow ${flowId} does not exist or cannot be accessed` },
      { status: 404 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    );
  }
}
