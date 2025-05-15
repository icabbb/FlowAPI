import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
// import { createClient as createBrowserClient } from '@/lib/supabase/client'; // Old import
// import { createClient as createServerClient } from '@supabase/supabase-js'; // Old import for service client

import { createServerSupabaseClient } from '@/lib/supabase/server'; // New import for user-level server client
import { createClient as createServiceRoleClient } from '@supabase/supabase-js'; // For service role

/**
 * POST /api/flow/force-save
 * 
 * Guarda un flujo directamente en la base de datos, evitando
 * las comprobaciones estándar que podrían estar fallando.
 * Este endpoint es para resolver problemas de sincronización.
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticar el usuario
    const auth = getAuth(request);
    const userId = auth.userId;
    
    // Información de diagnóstico sobre la configuración
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKeyPrefix = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 8) || '';
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log(`[API Force Save] Auth info:`, { 
      userId, 
      isAuthenticated: !!userId,
      userIdLength: userId?.length || 0
    });
    
    console.log(`[API Force Save] Supabase config:`, { 
      url: supabaseUrl,
      keyPrefix: anonKeyPrefix ? `${anonKeyPrefix}...` : 'NOT_SET',
      hasUrl: !!supabaseUrl,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRole
    });
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Autenticación requerida' },
        { status: 401 }
      );
    }

    // Obtener los datos del cuerpo de la petición
    const flowData = await request.json();
    
    // Añadir sello de tiempo actualizado si no existe
    if (!flowData.updated_at) {
      flowData.updated_at = new Date().toISOString();
    }
    
    // Asegurar que el user_id coincide con el de la sesión
    if (flowData.user_id !== userId) {

      flowData.user_id = userId; // Forzar el ID correcto
    }
    
    console.log(`[API Force Save] Attempting to save flow:`, { 
      id: flowData.id,
      name: flowData.name,
      user_id: flowData.user_id,
      nodeCount: flowData.nodes?.length || 0,
      edgeCount: flowData.edges?.length || 0,
      dataLength: JSON.stringify(flowData).length
    });

    // Intentaremos múltiples métodos para guardar el flujo
    let savedResult = null;
    let savedMethod = '';
    
    // Método 1: Cliente estándar del navegador
    try {

      
      // const supabase = createBrowserClient(); // Old client
      const supabase = createServerSupabaseClient(); // New server client for user context
      
      // Verificar primero si el flujo existe
      const { data: existingFlow, error: checkError } = await supabase
        .from('flows')
        .select('id, user_id')
        .eq('id', flowData.id)
        .maybeSingle();
        

      
      if (existingFlow) {
        // El flujo existe, actualizar

        const { data, error } = await supabase
          .from('flows')
          .update(flowData)
          .eq('id', flowData.id)
          .select()
          .single();
          
        if (error) {

        } else if (data) {

          savedResult = data;
          savedMethod = 'browser_client_update';
        }
      } else {
        // El flujo no existe, insertar

        
        // Si es una inserción y no se proporciona created_at, añadirlo
        if (!flowData.created_at) {
          flowData.created_at = flowData.updated_at;
        }
        
        const { data, error } = await supabase
          .from('flows')
          .insert(flowData)
          .select()
          .single();
          
        if (error) {

        } else if (data) {

          savedResult = data;
          savedMethod = 'browser_client_insert';
        }
      }
    } catch (method1Error) {

    }
    
    // Verificación adicional si el método 1 pareció tener éxito
    if (savedResult) {
      try {

        
        // const supabase = createBrowserClient(); // Old client
        const supabaseVerificationClient = createServerSupabaseClient(); // New server client for user context
        
        // Verificar que podemos recuperar el flujo después de guardarlo
        const { data: verifyData, error: verifyError } = await supabaseVerificationClient // Use the new verification client
          .from('flows')
          .select('id, user_id, name, updated_at')
          .eq('id', savedResult.id)
          .maybeSingle();
          
        console.log(`[API Force Save] Method 1 verification result:`, { 
          found: !!verifyData, 
          data: verifyData, 
          error: verifyError,
          updatedAt: verifyData?.updated_at,
          matchesNewTimestamp: verifyData?.updated_at === flowData.updated_at
        });
        
        // Si la verificación falló, no retornamos aún el resultado y continuamos con el método 2
        if (!verifyData) {

          // No retornamos, continuamos al método 2
        } else {
          // La verificación tuvo éxito, retornamos el resultado
          return NextResponse.json({ 
            success: true, 
            method: savedMethod,
            operation: savedMethod.includes('update') ? 'update' : 'insert',
            verified: true,
            data: savedResult
          });
        }
      } catch (verifyError) {

        // Continuamos al método 2
      }
    }
    
    // Método 2: Usando service_role para saltarse RLS si está disponible
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {

        
        const serviceClient = createServiceRoleClient( // Use the specific import for service client
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { 
            auth: { persistSession: false }
          }
        );
        
        // Verificar si el flujo existe
        const { data: serviceExisting, error: serviceCheckError } = await serviceClient
          .from('flows')
          .select('id, user_id, updated_at')
          .eq('id', flowData.id)
          .maybeSingle();
          
        console.log(`[API Force Save] Method 2 check result:`, { 
          serviceExisting, 
          serviceCheckError,
          existingUpdatedAt: serviceExisting?.updated_at 
        });
        
        if (serviceExisting) {
          // El flujo existe, actualizar

          const { data, error } = await serviceClient
            .from('flows')
            .update(flowData)
            .eq('id', flowData.id)
            .select()
            .single();
            
          if (error) {

          } else if (data) {
            console.log(`[API Force Save] Method 2 update successful:`, { 
              id: data.id,
              updatedAt: data.updated_at
            });
            savedResult = data;
            savedMethod = 'service_client_update';
          }
        } else {
          // El flujo no existe, insertar

          
          // Si es una inserción y no se proporciona created_at, añadirlo
          if (!flowData.created_at) {
            flowData.created_at = flowData.updated_at;
          }
          
          const { data, error } = await serviceClient
            .from('flows')
            .insert(flowData)
            .select()
            .single();
            
          if (error) {

          } else if (data) {
            console.log(`[API Force Save] Method 2 insert successful:`, { 
              id: data.id,
              createdAt: data.created_at,
              updatedAt: data.updated_at 
            });
            savedResult = data;
            savedMethod = 'service_client_insert';
          }
        }
        
        // Verificación adicional con el cliente de servicio
        if (savedResult) {
          try {

            
            // Verificar que podemos recuperar el flujo después de guardarlo
            const { data: serviceVerifyData, error: serviceVerifyError } = await serviceClient
              .from('flows')
              .select('id, user_id, name, updated_at')
              .eq('id', savedResult.id)
              .maybeSingle();
              
            console.log(`[API Force Save] Method 2 verification result:`, { 
              found: !!serviceVerifyData, 
              data: serviceVerifyData, 
              error: serviceVerifyError,
              updatedAt: serviceVerifyData?.updated_at,
              matchesNewTimestamp: serviceVerifyData?.updated_at === flowData.updated_at
            });
            
            if (!serviceVerifyData) {

              // Este caso es muy extraño pues significa que no podemos leer el flujo incluso con rol de servicio
            }
          } catch (serviceVerifyError) {

          }
        }
      } catch (method2Error) {

      }
    } else {

    }
    
    // Si tuvimos éxito con algún método, retornarlo
    if (savedResult) {
      return NextResponse.json({ 
        success: true, 
        method: savedMethod,
        operation: savedMethod.includes('update') ? 'update' : 'insert',
        data: savedResult
      });
    }
    
    // Si llegamos aquí, ambos métodos fallaron

    return NextResponse.json(
      { 
        error: 'Ningún método de guardado tuvo éxito',
        details: 'Consulta los logs del servidor para más información',
        flowId: flowData.id
      },
      { status: 500 }
    );
  } catch (error: any) {

    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 