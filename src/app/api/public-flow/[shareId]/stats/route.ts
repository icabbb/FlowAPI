import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';
import { createClient as createServerClient } from '@supabase/supabase-js';

// Función auxiliar para obtener el cliente con rol de servicio
const getServiceClient = () => {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { 
        auth: { persistSession: false }
      }
    );
  }
  return null;
};

/**
 * GET /api/public-flow/[shareId]/stats
 * 
 * Obtiene estadísticas actualizadas de un flujo compartido.
 * Principalmente usado para obtener el contador de visitas actualizado.
 */
export async function GET(
  request: NextRequest,
   { params } : { params: Promise<{ shareId: string }> },
) {
  try {
    // Asegurarse de que params sea await correctamente
    const { shareId } = await params;
    
    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    // Obtener cliente de Supabase
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Obtener estadísticas del share
    let shareData = null;
    let shareError = null;
    
    try {
      const result = await supabase
        .from('public_flow_shares')
        .select('id, flow_id, access_count, last_accessed, created_at')
        .eq('id', shareId)
        .eq('is_active', true)
        .maybeSingle();
        
      shareData = result.data;
      shareError = result.error;
    } catch (error) {

    }

    // Si no se encontró con el cliente estándar, probar con el cliente de servicio
    if ((!shareData || shareError) && hasServiceRole) {
      const serviceClient = getServiceClient();
      if (serviceClient) {
        try {
          const serviceResult = await serviceClient
            .from('public_flow_shares')
            .select('id, flow_id, access_count, last_accessed, created_at')
            .eq('id', shareId)
            .eq('is_active', true)
            .maybeSingle();
            
          shareData = serviceResult.data;
          shareError = serviceResult.error;
        } catch (error) {

        }
      }
    }

    if (shareError) {

      return NextResponse.json(
        { error: 'Error fetching share statistics' },
        { status: 500 }
      );
    }

    if (!shareData) {
      return NextResponse.json(
        { error: 'Share not found or not active' },
        { status: 404 }
      );
    }

    // Devolver las estadísticas del share
    return NextResponse.json({
      share_id: shareData.id,
      flow_id: shareData.flow_id,
      access_count: shareData.access_count || 0,
      last_accessed: shareData.last_accessed,
      age: shareData.created_at ? Math.floor((Date.now() - new Date(shareData.created_at).getTime()) / (1000 * 60 * 60 * 24)) : null // Edad en días
    });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 