import { NextRequest, NextResponse } from 'next/server';
import { getPublicFlow } from '@/services/storage/public-flow-share';

/**
 * GET /api/public-flow/[shareId]
 * 
 * Fetches a publicly shared flow by its share ID.
 * This endpoint is not authenticated and available to anyone with the share ID.
 */
export async function GET(
  request: NextRequest,
  { params } : { params: Promise<{ shareId: string }> },  
) {
  try {
    // Obtener shareId de los parámetros de contexto
    const { shareId } = await params;
    
    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    const flow = await getPublicFlow(shareId);

    if (!flow) {
      return NextResponse.json(
        { error: 'Flow not found or share is no longer active' },
        { status: 404 }
      );
    }

    // Remove sensitive information from the flow
    const sanitizedFlow = {
      id: flow.id,
      name: flow.name,
      description: flow.description,
      nodes: flow.nodes,
      edges: flow.edges,
      created_at: flow.created_at,
      updated_at: flow.updated_at,
    };

    return NextResponse.json(sanitizedFlow);
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 