import { NextRequest, NextResponse } from 'next/server';
import { getPublicFlow } from '@/services/storage/public-flow-share';

/**
 * GET /api/public-flow/[shareId]/export
 * 
 * Exports a publicly shared flow as a JSON file.
 * Not authenticated - available to anyone with the share ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> },
) {
  try {
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

    // Prepare the data for export
    const exportData = {
      name: flow.name,
      description: flow.description,
      nodes: flow.nodes,
      edges: flow.edges,
      exportedAt: new Date().toISOString(),
    };

    // Return the data as a downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${flow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json"`,
      },
    });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 