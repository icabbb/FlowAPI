import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { createClient as createServerClient } from '@supabase/supabase-js';

/**
 * Endpoint de emergencia que permite guardar un flujo directamente utilizando
 * el rol de servicio de Supabase, saltándose las políticas RLS.
 * Solo debe usarse cuando la función saveCurrentFlow normal falla.
 */

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

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const auth = getAuth(request);
    const userId = auth.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Obtener los datos del flujo del cuerpo de la petición
    const body = await request.json();

    // Verificar datos mínimos necesarios
    if (!body.name) {
      return NextResponse.json(
        { error: 'Flow name is required' },
        { status: 400 }
      );
    }

    if (!body.nodes || !Array.isArray(body.nodes)) {
      return NextResponse.json(
        { error: 'Nodes array is required' },
        { status: 400 }
      );
    }

    if (!body.edges || !Array.isArray(body.edges)) {
      return NextResponse.json(
        { error: 'Edges array is required' },
        { status: 400 }
      );
    }

    console.log('[API ForceUpsert] Attempting to save flow with service role client:', {
      flowId: body.id || 'new flow',
      name: body.name,
      userId
    });

    // Obtener cliente de Supabase con rol de servicio
    const serviceClient = getServiceClient();
    if (!serviceClient) {

      return NextResponse.json(
        { error: 'Service role not available for emergency save' },
        { status: 500 }
      );
    }

    // Preparar los datos para guardar
    const timestamp = new Date().toISOString();
    const payload = {
      id: body.id, // undefined para inserción, con valor para actualización
      user_id: userId,
      name: body.name,
      description: body.description || null,
      collections: body.collections || body.collection || null,
      nodes: body.nodes,
      edges: body.edges,
      updated_at: timestamp,
      created_at: body.id ? undefined : timestamp, // Solo establecer para nuevos flujos
    };

    // Imprimir el payload para propósitos de depuración
    console.log('[API ForceUpsert] Payload structure:', {
      id: payload.id,
      user_id: payload.user_id,
      name: payload.name,
      description: payload.description,
      collections: payload.collections,
      nodesCount: payload.nodes.length,
      edgesCount: payload.edges.length,
    });

    // Intentar guardar el flujo
    const { data, error } = await serviceClient
      .from('flows')
      .upsert(payload)
      .select()
      .single();

    if (error) {


      // Proporcionar detalles específicos para diferentes tipos de errores
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          {
            error: 'A flow with this ID already exists but belongs to another user',
            details: error.message,
            code: error.code
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to save flow',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    if (!data) {

      return NextResponse.json(
        { error: 'Failed to save flow: No data returned' },
        { status: 500 }
      );
    }

    console.log('[API ForceUpsert] Flow saved successfully:', {
      id: data.id,
      name: data.name,
      collections: data.collections
    });

    // Devolver el flujo guardado
    return NextResponse.json({
      success: true,
      flow: {
        id: data.id,
        name: data.name,
        description: data.description,
        collections: data.collections,
        nodes: data.nodes,
        edges: data.edges,
        created_at: data.created_at,
        updated_at: data.updated_at,
        share_id: data.share_id,
        user_id: data.user_id
      }
    });

  } catch (error: any) {

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}
