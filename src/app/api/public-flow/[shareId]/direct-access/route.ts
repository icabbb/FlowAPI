import { NextRequest, NextResponse } from 'next/server';
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
 * POST /api/public-flow/[shareId]/direct-access
 * 
 * Incrementa directamente el contador de accesos para un flujo compartido.
 * Esta es una implementación alternativa que no depende de triggers en la base de datos.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> },
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


    
    // Usaremos exclusivamente el cliente con rol de servicio para esta operación
    const serviceClient = getServiceClient();
    
    if (!serviceClient) {

      return NextResponse.json(
        { error: 'Service role not available' },
        { status: 500 }
      );
    }
    
    // Primero recuperamos la información actual
    const { data: shareData, error: shareError } = await serviceClient
      .from('public_flow_shares')
      .select('id, flow_id, access_count, last_accessed')
      .eq('id', shareId)
      .eq('is_active', true)
      .maybeSingle();
      
    if (shareError) {

      return NextResponse.json(
        { error: 'Error checking share status' },
        { status: 500 }
      );
    }
    
    if (!shareData) {

      return NextResponse.json(
        { error: 'Share not found or not active' },
        { status: 404 }
      );
    }
    
    // Mostrar dato actual para depuración
    console.log('[API DirectAccess] Current share data:', {
      shareId,
      accessCount: shareData.access_count,
      lastAccessed: shareData.last_accessed
    });
    
    // Actualizar directamente ambos valores sin confiar en el trigger
    const currentTime = new Date().toISOString();
    const newAccessCount = (shareData.access_count || 0) + 1;
    
    console.log('[API DirectAccess] Updating directly:', {
      accessCount: newAccessCount,
      lastAccessed: currentTime
    });
    
    // Realizamos la actualización directa
    const { data: updateResult, error: updateError } = await serviceClient
      .from('public_flow_shares')
      .update({
        access_count: newAccessCount,
        last_accessed: currentTime
      })
      .eq('id', shareId)
      .select();
      
    if (updateError) {

      return NextResponse.json(
        { success: false, error: 'Could not update access count', details: updateError.message },
        { status: 500 }
      );
    }
    
    // Verificamos el resultado

    
    if (!updateResult || updateResult.length === 0) {

      return NextResponse.json({
        success: true,
        access_count: newAccessCount,
        previousCount: shareData.access_count,
        timestamp: currentTime,
        warning: 'Update succeeded but no updated data was returned'
      });
    }
    
    // Retornamos el resultado completo
    return NextResponse.json({
      success: true,
      access_count: updateResult[0].access_count,
      previousCount: shareData.access_count,
      timestamp: currentTime,
      updated: updateResult[0]
    });
    
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 