import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { createPublicFlowShare, deactivatePublicFlowShare, getUserPublicFlowShares } from '@/services/storage/public-flow-share';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * POST /api/public-flow
 * 
 * Creates a new public share for a flow.
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = getAuth(request);
    const userId = auth.userId;
    
    console.log('[API] POST /api/public-flow - Auth info:', { 
      userId, 
      isAuthenticated: !!userId,
      sessionId: auth.sessionId
    });
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    

    
    if (!body.flow_id) {
      return NextResponse.json(
        { error: 'Flow ID is required' },
        { status: 400 }
      );
    }

    const shareData = {
      flow_id: body.flow_id,
      expires_at: body.expires_at || null,
    };

    // Create a server-side Supabase client authenticated with Clerk token
    const supabase = createServerSupabaseClient();

    console.log('[API] Creating public flow share with data:', {
      shareData,
      userId
    });

    const share = await createPublicFlowShare(shareData, userId, supabase);



    return NextResponse.json({
      id: share.id,
      flow_id: share.flow_id,
      created_at: share.created_at,
      expires_at: share.expires_at,
      is_active: share.is_active,
    });
  } catch (error: any) {

    
    // Mensaje de error amigable para el usuario
    let userMessage = 'Failed to create share link. Please try again.';
    let statusCode = 500;
    
    if (error.message.includes('not found')) {
      userMessage = 'Flow not found. Please verify the flow ID.';
      statusCode = 404;
    } else if (error.message.includes('permission') || error.message.includes('ownership')) {
      userMessage = 'You do not have permission to share this flow.';
      statusCode = 403;
    }
    
    return NextResponse.json(
      { error: userMessage, details: error.message },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/public-flow
 * 
 * Gets all public shares for the authenticated user's flows.
 * Requires authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create a server-side Supabase client authenticated with Clerk token
    const supabase = createServerSupabaseClient();

    const shares = await getUserPublicFlowShares(userId, supabase);

    return NextResponse.json(shares);
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/public-flow
 * 
 * Deactivates a public flow share.
 * Requires authentication.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    if (!body.share_id) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    // Create a server-side Supabase client authenticated with Clerk token
    const supabase = createServerSupabaseClient();

    try {
      await deactivatePublicFlowShare(body.share_id, userId, supabase);
      return NextResponse.json({ success: true });
    } catch (error: any) {

      
      if (error.message.includes('not found') || error.message.includes('not owned')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      
      throw error; // Relaunch for the outer catch block
    }
  } catch (error: any) {

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 