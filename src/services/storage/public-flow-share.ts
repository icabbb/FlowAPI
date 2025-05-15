import { createClient as createServerClient, SupabaseClient } from '@supabase/supabase-js';
import type { PublicFlowShare, PublicShareData, SavedFlow } from '@/contracts/types/flow.types';
import { createActionClient, clerkSession } from '@/store/utils/supabase';

// Usar una función para obtener el cliente, ya que clerkSession podría inicializarse más tarde
const getAuthenticatedSupabaseClient = () => {
  if (!clerkSession) {
    // Esto podría pasar si setClerkSession no se ha llamado o se llamó con null.
    // Considera un mejor manejo de errores o un estado de carga aquí.

    // Devolver un cliente anónimo como fallback o lanzar un error.
    // Por ahora, devolvemos un cliente que podría fallar en RLS si se requiere autenticación.
    return createServerClient( // Usamos createServerClient para coherencia con getServiceClient
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } } // Cliente anónimo
    );
  }
  return createActionClient();
};

// Crear cliente con rol de servicio si está disponible la clave
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
 * Creates a new public sharing link for a flow
 * @param shareData The data needed to create a new public share
 * @param userId The ID of the user creating the share
 * @param providedSupabaseClient Optional Supabase client instance (for server-side calls)
 * @returns The created public share
 */
export async function createPublicFlowShare(
  shareData: PublicShareData,
  userId: string,
  providedSupabaseClient?: SupabaseClient
): Promise<PublicFlowShare> {
  // Obtener el cliente Supabase autenticado
  const supabase = providedSupabaseClient || getAuthenticatedSupabaseClient();

  if (!userId) {
    throw new Error('[PublicFlowShare] User ID is required to create public share.');
  }

  // Información de diagnóstico sobre la configuración
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKeyPrefix = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 8) || '';
  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('[PublicFlowShare] Supabase config:', { 
    url: supabaseUrl,
    keyPrefix: anonKeyPrefix ? `${anonKeyPrefix}...` : 'NOT_SET',
    hasUrl: !!supabaseUrl,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRole
  });

  console.log('[PublicFlowShare] Creating share with params:', { 
    flowId: shareData.flow_id, 
    userId: userId,
    expiresAt: shareData.expires_at 
  });

  try {
    // First verify that the user owns the flow
    console.log('[PublicFlowShare] Verifying flow ownership:', { 
      flowId: shareData.flow_id, 
      userId: userId 
    });

    // Método 1: Usar el cliente estándar del navegador

    let flowData = null;
    let flowError = null;
    
    try {
      const result = await supabase
        .from('flows')
        .select('id, user_id')
        .eq('id', shareData.flow_id)
        .maybeSingle();
        
      flowData = result.data;
      flowError = result.error;
    } catch (error) {

    }

    console.log('[PublicFlowShare] Flow verification result (browser client):', { 
      flowData, 
      flowError, 
      found: !!flowData 
    });

    // Si no se encontró el flujo con el cliente estándar, probar con el cliente de servicio
    if (!flowData && hasServiceRole) {

      
      const serviceClient = getServiceClient();
      if (serviceClient) {
        try {
          const serviceResult = await serviceClient
            .from('flows')
            .select('id, user_id')
            .eq('id', shareData.flow_id)
            .maybeSingle();
            
          flowData = serviceResult.data;
          flowError = serviceResult.error;
          
          console.log('[PublicFlowShare] Flow verification result (service client):', { 
            flowData, 
            flowError, 
            found: !!flowData 
          });
        } catch (serviceError) {

        }
      }
    }
    
    if (flowError && flowError.code !== 'PGRST116') {

      throw new Error(`Database error: ${flowError.message}`);
    }
    
    if (!flowData) {
      // Realizar una consulta adicional para ver si el flujo existe pero no pertenece al usuario
      let anyFlowData = null;
      
      // Intentar con el cliente de servicio si está disponible
      if (hasServiceRole) {
        const serviceClient = getServiceClient();
        if (serviceClient) {
          try {
            const anyFlowResult = await serviceClient
              .from('flows')
              .select('id, user_id')
              .eq('id', shareData.flow_id)
              .maybeSingle();
              
            anyFlowData = anyFlowResult.data;
            
            console.log('[PublicFlowShare] Additional flow check (service client):', { 
              anyFlowData,
              found: !!anyFlowData 
            });
          } catch (anyFlowError) {

          }
        }
      }
      
      // Si aún no se encontró, intentar con el cliente estándar
      if (!anyFlowData) {
        const anyFlowResult = await supabase
          .from('flows')
          .select('id, user_id')
          .eq('id', shareData.flow_id)
          .maybeSingle();
        
        anyFlowData = anyFlowResult.data;
      }
      
      if (anyFlowData) {
        console.error('[PublicFlowShare] Flow exists but belongs to another user:', {
          flowId: shareData.flow_id,
          flowUserId: anyFlowData.user_id,
          requestUserId: userId
        });
        throw new Error('Flow exists but you do not have permission to share it.');
      } else {
        console.error('[PublicFlowShare] Flow not found:', {
          flowId: shareData.flow_id
        });
        throw new Error('Flow not found with the specified ID.');
      }
    }

    // Verificación adicional para asegurarnos que los IDs coinciden
    if (flowData.user_id !== userId) {
      console.error('[PublicFlowShare] User ID mismatch:', {
        flowUserId: flowData.user_id,
        requestUserId: userId
      });
      throw new Error('Flow ownership verification failed: User ID mismatch.');
    }

    const timestamp = new Date().toISOString();
    const newShareData = {
      flow_id: shareData.flow_id,
      created_at: timestamp,
      expires_at: shareData.expires_at || null,
      is_active: true,
      access_count: 0,
    };

    // Intentar la inserción con el cliente estándar primero
    let insertedData = null;
    let insertError = null;
    

    
    try {
      const result = await supabase
        .from('public_flow_shares')
        .insert(newShareData)
        .select();
        
      insertedData = result.data;
      insertError = result.error;
    } catch (error) {

    }

    // Si falla, intentar con el cliente de servicio
    if ((insertError || !insertedData) && hasServiceRole) {

      
      const serviceClient = getServiceClient();
      if (serviceClient) {
        try {
          const serviceResult = await serviceClient
            .from('public_flow_shares')
            .insert(newShareData)
            .select();
            
          insertedData = serviceResult.data;
          insertError = serviceResult.error;
          
          console.log('[PublicFlowShare] Service client insert result:', { 
            success: !!insertedData && insertedData.length > 0,
            error: insertError
          });
        } catch (serviceInsertError) {

        }
      }
    }

    if (insertError) {

      throw new Error(`Failed to create share record: ${insertError.message}`);
    }
    
    if (!insertedData || insertedData.length === 0) {
      throw new Error('Share record created but no data returned.');
    }
    
    const createdShare = insertedData[0] as PublicFlowShare;

    // Actualizar el flujo con el share_id, intentando con ambos clientes
    let updateError = null;

    
    try {
      const updateResult = await supabase
        .from('flows')
        .update({ share_id: createdShare.id })
        .eq('id', shareData.flow_id)
        .eq('user_id', userId);
        
      updateError = updateResult.error;
      
      if (updateError) {

        
        if (hasServiceRole) {
          const serviceClient = getServiceClient();
          if (serviceClient) {
            const serviceUpdateResult = await serviceClient
              .from('flows')
              .update({ share_id: createdShare.id })
              .eq('id', shareData.flow_id)
              .eq('user_id', userId);
              
            if (!serviceUpdateResult.error) {
              updateError = null;

            }
          }
        }
      }
    } catch (error) {

    }

    if (updateError) {

      // No lanzamos error aquí para no interrumpir el flujo si la actualización falla
      // pero el registro ya fue creado
    }

    console.log('[PublicFlowShare] Share creation successful:', { 
      shareId: createdShare.id,
      flowId: createdShare.flow_id
    });
    
    return createdShare;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Deactivates a public flow share
 * @param shareId The ID of the public share to deactivate
 * @param userId The ID of the user deactivating the share
 * @param providedSupabaseClient Optional Supabase client instance (for server-side calls)
 * @returns Boolean indicating success
 */
export async function deactivatePublicFlowShare(
  shareId: string,
  userId: string,
  providedSupabaseClient?: SupabaseClient
): Promise<boolean> {
  // Obtener el cliente Supabase autenticado
  const supabase = providedSupabaseClient || getAuthenticatedSupabaseClient();

  if (!userId) {
    throw new Error('[PublicFlowShare] User ID is required to deactivate public share.');
  }

  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  try {
    // First verify that the share exists
    let shareData = null;
    let shareError = null;
    

    
    try {
      const result = await supabase
        .from('public_flow_shares')
        .select('flow_id, is_active')
        .eq('id', shareId)
        .maybeSingle();
        
      shareData = result.data;
      shareError = result.error;
    } catch (error) {

    }

    // Si no se encontró con el cliente estándar, probar con el cliente de servicio
    if (!shareData && hasServiceRole) {

      
      const serviceClient = getServiceClient();
      if (serviceClient) {
        try {
          const serviceResult = await serviceClient
            .from('public_flow_shares')
            .select('flow_id, is_active')
            .eq('id', shareId)
            .maybeSingle();
            
          shareData = serviceResult.data;
          shareError = serviceResult.error;
        } catch (serviceError) {

        }
      }
    }

    if (shareError) {

      throw new Error(`Could not verify share: ${shareError.message}`);
    }
    
    if (!shareData) {
      throw new Error('Public share not found.');
    }
    
    if (!shareData.is_active) {
      // Si ya está desactivado, consideramos la operación como exitosa
      return true;
    }

    // Verify that the user owns the flow associated with this share
    let flowData = null;
    let flowError = null;
    
    try {
      const result = await supabase
        .from('flows')
        .select('id')
        .eq('id', shareData.flow_id)
        .eq('user_id', userId)
        .maybeSingle();
        
      flowData = result.data;
      flowError = result.error;
    } catch (error) {

    }
    
    // Si no se encontró con el cliente estándar, probar con el cliente de servicio
    if (!flowData && hasServiceRole) {

      
      const serviceClient = getServiceClient();
      if (serviceClient) {
        try {
          const serviceResult = await serviceClient
            .from('flows')
            .select('id')
            .eq('id', shareData.flow_id)
            .eq('user_id', userId)
            .maybeSingle();
            
          flowData = serviceResult.data;
          flowError = serviceResult.error;
        } catch (serviceError) {

        }
      }
    }

    if (flowError) {

      throw new Error(`Could not verify flow ownership: ${flowError.message}`);
    }
    
    if (!flowData) {
      throw new Error('Flow not found or not owned by the user.');
    }

    // Deactivate the share - usar ambos clientes si es necesario
    let deactivateError = null;
    
    try {
      const result = await supabase
        .from('public_flow_shares')
        .update({ is_active: false })
        .eq('id', shareId);
        
      deactivateError = result.error;
    } catch (error) {

    }
    
    // Si falla con el cliente estándar, probar con el cliente de servicio
    if (deactivateError && hasServiceRole) {

      
      const serviceClient = getServiceClient();
      if (serviceClient) {
        try {
          const serviceResult = await serviceClient
            .from('public_flow_shares')
            .update({ is_active: false })
            .eq('id', shareId);
            
          if (!serviceResult.error) {
            deactivateError = null;
          }
        } catch (serviceError) {

        }
      }
    }

    if (deactivateError) {

      throw new Error(`Failed to deactivate share: ${deactivateError.message}`);
    }

    // Remove the share_id from the flow - usar ambos clientes si es necesario
    let updateError = null;
    
    try {
      const result = await supabase
        .from('flows')
        .update({ share_id: null })
        .eq('id', shareData.flow_id)
        .eq('user_id', userId);
        
      updateError = result.error;
    } catch (error) {

    }
    
    // Si falla con el cliente estándar, probar con el cliente de servicio
    if (updateError && hasServiceRole) {

      
      const serviceClient = getServiceClient();
      if (serviceClient) {
        try {
          const serviceResult = await serviceClient
            .from('flows')
            .update({ share_id: null })
            .eq('id', shareData.flow_id)
            .eq('user_id', userId);
            
          if (!serviceResult.error) {
            updateError = null;
          }
        } catch (serviceError) {

        }
      }
    }

    if (updateError) {

      // No interrumpimos el flujo si el actualizar el flujo falla
    }

    return true;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Gets information about a public flow share
 * @param shareId The ID of the public share to get
 * @param providedSupabaseClient Optional Supabase client instance (for server-side calls)
 * @returns The public share information
 */
export async function getPublicFlowShareInfo(
  shareId: string,
  providedSupabaseClient?: SupabaseClient
): Promise<PublicFlowShare | null> {
  // Obtener el cliente Supabase autenticado (o anónimo si la sesión no está lista)
  const supabase = providedSupabaseClient || getAuthenticatedSupabaseClient();

  try {

    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Método 1: Cliente estándar
    let data = null;
    let error = null;
    
    try {
      const result = await supabase
        .from('public_flow_shares')
        .select('*')
        .eq('id', shareId)
        .eq('is_active', true)
        .maybeSingle();
        
      data = result.data;
      error = result.error;
      
      console.log('[PublicFlowShare] Share info result (browser client):', { 
        found: !!data,
        error
      });
    } catch (browserError) {

    }
    
    // Método 2: Cliente con rol de servicio si el primer método falló
    if (!data && hasServiceRole) {

      
      const serviceClient = getServiceClient();
      if (serviceClient) {
        try {
          const serviceResult = await serviceClient
            .from('public_flow_shares')
            .select('*')
            .eq('id', shareId)
            .eq('is_active', true)
            .maybeSingle();
            
          data = serviceResult.data;
          error = serviceResult.error;
          
          console.log('[PublicFlowShare] Share info result (service client):', { 
            found: !!data,
            error
          });
        } catch (serviceError) {

        }
      }
    }

    if (error && error.code !== 'PGRST116') {

      throw error;
    }

    return data as PublicFlowShare;
  } catch (error: any) {

    return null;
  }
}

/**
 * Gets a public flow by its share ID
 * @param shareId The ID of the public share
 * @param providedSupabaseClient Optional Supabase client instance (for server-side calls)
 * @returns The flow data or null if not found or inactive
 */
export async function getPublicFlow(
  shareId: string,
  providedSupabaseClient?: SupabaseClient
): Promise<SavedFlow | null> {
  // Obtener el cliente Supabase autenticado (o anónimo si la sesión no está lista)
  const supabase = providedSupabaseClient || getAuthenticatedSupabaseClient();

  try {

    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // First get the share record
    let shareData = null;
    let shareError = null;
    
    // Método 1: Cliente estándar
    try {
      const result = await supabase
        .from('public_flow_shares')
        .select('*')
        .eq('id', shareId)
        .eq('is_active', true)
        .maybeSingle();
        
      shareData = result.data;
      shareError = result.error;
      
      console.log('[PublicFlowShare] Share record result (browser client):', { 
        found: !!shareData,
        error: shareError
      });
    } catch (browserError) {

    }
    
    // Método 2: Cliente con rol de servicio si el primer método falló
    if (!shareData && hasServiceRole) {

      
      const serviceClient = getServiceClient();
      if (serviceClient) {
        try {
          const serviceResult = await serviceClient
            .from('public_flow_shares')
            .select('*')
            .eq('id', shareId)
            .eq('is_active', true)
            .maybeSingle();
            
          shareData = serviceResult.data;
          shareError = serviceResult.error;
          
          console.log('[PublicFlowShare] Share record result (service client):', { 
            found: !!shareData,
            error: shareError
          });
        } catch (serviceError) {

        }
      }
    }

    if (shareError && shareError.code !== 'PGRST116') {

      throw shareError;
    }

    if (!shareData) {
      return null; // No share found or inactive
    }

    // Check if share has expired
    if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
      console.log('[PublicFlowShare] Share has expired:', { 
        shareId, 
        expiresAt: shareData.expires_at 
      });
      
      // Try to deactivate the expired share with both clients
      try {
        const deactivateResult = await supabase
          .from('public_flow_shares')
          .update({ is_active: false })
          .eq('id', shareId);
          
        if (deactivateResult.error && hasServiceRole) {
          const serviceClient = getServiceClient();
          if (serviceClient) {
            await serviceClient
              .from('public_flow_shares')
              .update({ is_active: false })
              .eq('id', shareId);
          }
        }
      } catch (deactivateError) {

      }
      
      return null;
    }

    // Increment access count and update last_accessed
    // Try with both clients
    try {
      const updateResult = await supabase
        .from('public_flow_shares')
        .update({
          access_count: shareData.access_count + 1,
          last_accessed: new Date().toISOString(),
        })
        .eq('id', shareId);
        
      if (updateResult.error && hasServiceRole) {

        
        const serviceClient = getServiceClient();
        if (serviceClient) {
          await serviceClient
            .from('public_flow_shares')
            .update({
              access_count: shareData.access_count + 1,
              last_accessed: new Date().toISOString(),
            })
            .eq('id', shareId);
        }
      }
    } catch (updateError) {

      // Continue anyway since this is not critical
    }

    // Get the flow data
    let flowData = null;
    let flowError = null;
    
    // Método 1: Cliente estándar
    try {
      const result = await supabase
        .from('flows')
        .select('*')
        .eq('id', shareData.flow_id)
        .maybeSingle();
        
      flowData = result.data;
      flowError = result.error;
      
      console.log('[PublicFlowShare] Flow data result (browser client):', { 
        found: !!flowData,
        error: flowError
      });
    } catch (browserError) {

    }
    
    // Método 2: Cliente con rol de servicio si el primer método falló
    if (!flowData && hasServiceRole) {

      
      const serviceClient = getServiceClient();
      if (serviceClient) {
        try {
          const serviceResult = await serviceClient
            .from('flows')
            .select('*')
            .eq('id', shareData.flow_id)
            .maybeSingle();
            
          flowData = serviceResult.data;
          flowError = serviceResult.error;
          
          console.log('[PublicFlowShare] Flow data result (service client):', { 
            found: !!flowData,
            error: flowError
          });
        } catch (serviceError) {

        }
      }
    }

    if (flowError && flowError.code !== 'PGRST116') {

      throw flowError;
    }

    if (!flowData) {
      return null;
    }

    return {
      ...flowData,
      nodes: flowData.nodes ?? [],
      edges: flowData.edges ?? [],
    } as SavedFlow;
  } catch (error: any) {

    return null;
  }
}

/**
 * Gets all public shares for a user's flows
 * @param userId The ID of the user
 * @param providedSupabaseClient Optional Supabase client instance (for server-side calls)
 * @returns Array of public shares
 */
export async function getUserPublicFlowShares(
  userId: string,
  providedSupabaseClient?: SupabaseClient
): Promise<PublicFlowShare[]> {
  // Obtener el cliente Supabase autenticado
  const supabase = providedSupabaseClient || getAuthenticatedSupabaseClient();

  if (!userId) {

    return [];
  }

  try {

    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Get all flows for this user that have public shares
    let flows = null;
    let flowsError = null;
    
    // Método 1: Cliente estándar
    try {
      const result = await supabase
        .from('flows')
        .select('id, share_id')
        .eq('user_id', userId)
        .not('share_id', 'is', null);
        
      flows = result.data;
      flowsError = result.error;
      
      console.log('[PublicFlowShare] User flows result (browser client):', { 
        count: flows?.length || 0,
        error: flowsError
      });
    } catch (browserError) {

    }
    
    // Método 2: Cliente con rol de servicio si el primer método falló
    if ((!flows || flows.length === 0) && hasServiceRole) {

      
      const serviceClient = getServiceClient();
      if (serviceClient) {
        try {
          const serviceResult = await serviceClient
            .from('flows')
            .select('id, share_id')
            .eq('user_id', userId)
            .not('share_id', 'is', null);
            
          flows = serviceResult.data;
          flowsError = serviceResult.error;
          
          console.log('[PublicFlowShare] User flows result (service client):', { 
            count: flows?.length || 0,
            error: flowsError
          });
        } catch (serviceError) {

        }
      }
    }

    if (flowsError) {

      throw new Error(`Failed to get user flows: ${flowsError.message}`);
    }

    if (!flows || flows.length === 0) {
      return []; // Usuario no tiene flujos compartidos
    }

    // Get all share IDs, filtrando valores nulos
    const shareIds = flows.map(flow => flow.share_id).filter(Boolean);
    
    if (shareIds.length === 0) {
      return []; // Ningún ID de compartir válido encontrado
    }

    // Get all public shares
    let data = null;
    let error = null;
    
    // Método 1: Cliente estándar
    try {
      const result = await supabase
        .from('public_flow_shares')
        .select('*')
        .in('id', shareIds)
        .order('created_at', { ascending: false });
        
      data = result.data;
      error = result.error;
      
      console.log('[PublicFlowShare] Public shares result (browser client):', { 
        count: data?.length || 0,
        error
      });
    } catch (browserError) {

    }
    
    // Método 2: Cliente con rol de servicio si el primer método falló
    if ((!data || data.length === 0) && hasServiceRole) {

      
      const serviceClient = getServiceClient();
      if (serviceClient) {
        try {
          const serviceResult = await serviceClient
            .from('public_flow_shares')
            .select('*')
            .in('id', shareIds)
            .order('created_at', { ascending: false });
            
          data = serviceResult.data;
          error = serviceResult.error;
          
          console.log('[PublicFlowShare] Public shares result (service client):', { 
            count: data?.length || 0,
            error
          });
        } catch (serviceError) {

        }
      }
    }

    if (error) {

      throw new Error(`Failed to get public shares: ${error.message}`);
    }

    return data as PublicFlowShare[] || [];
  } catch (error: any) {

    // No propagamos el error para no romper la UI, devolvemos lista vacía
    return [];
  }
}

export interface PublicFlowListItem {
  share_id: string; // ID del registro en public_flow_shares
  flow_id: string;  // ID del flujo original en la tabla flows
  flow_name: string;
  flow_description?: string | null;
  shared_at: string; // created_at de public_flow_shares
  access_count: number;
  author_display_name?: string | null;
  avatar_url?: string | null; // URL de la imagen de perfil del autor
  user_id?: string; // ID del usuario que creó el flujo
}

/**
 * Obtiene una lista de flujos compartidos públicamente activos con sus detalles básicos.
 * Esta función está pensada para ser llamada desde el backend (API route)
 * usando el service_role para poder leer detalles de flujos de cualquier usuario.
 * @param limit - Número de flujos a devolver.
 * @param offset - Desplazamiento para paginación.
 * @returns Array de PublicFlowListItem.
 */
export async function getActivePublicFlowsWithDetails(
  limit: number = 20, // Un límite por defecto razonable
  offset: number = 0
): Promise<PublicFlowListItem[]> {

  const serviceClient = getServiceClient(); 

  if (!serviceClient) {

    return [];
  }

  try {
    // Paso 1: Obtener shares activos y no expirados
    const { data: shares, error: sharesError } = await serviceClient
      .from('public_flow_shares')
      .select('id, flow_id, created_at, access_count, expires_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (sharesError) {

      throw sharesError;
    }

    if (!shares || shares.length === 0) {

      return [];
    }

    const validShares = shares.filter(share => {
      if (share.expires_at) {
        return new Date(share.expires_at) > new Date();
      }
      return true;
    });

    if (validShares.length === 0) {

      return [];
    }

    const flowIds = validShares.map(s => s.flow_id);
    if (flowIds.length === 0) {

        return [];
    }
    
    // Paso 2: Obtener detalles de los flujos (incluyendo user_id del propietario)
    const { data: flowsData, error: flowsError } = await serviceClient
      .from('flows')
      .select('id, name, description, user_id') // Asegurar que user_id se selecciona
      .in('id', flowIds);

    if (flowsError) {

      throw flowsError;
    }

    if (!flowsData || flowsData.length === 0) { // Comprobar si flowsData es vacío también

        return [];
    }    
    const flowMap = new Map(flowsData.map(f => [f.id, f]));
    
    // Obtener IDs únicos de propietarios de los flujos recuperados
    const ownerUserIds = Array.from(new Set(flowsData.map(f => f.user_id).filter(id => !!id) as string[]));


    // Paso 3: Comprobar si existe la tabla profiles
    let profilesTableExists = false;
    try {
      const { error: tableCheckError } = await serviceClient
        .from('profiles')
        .select('id')
        .limit(1);
      
      profilesTableExists = !tableCheckError || !tableCheckError.message.includes('does not exist');

    } catch (tableCheckError) {

      profilesTableExists = false;
    }

    // Paso 4: Obtener nombres de los perfiles de los propietarios si la tabla existe
    let profileMap = new Map<string, { display_name?: string | null, avatar_url?: string | null }>();
    if (profilesTableExists && ownerUserIds.length > 0) {

      const { data: profilesData, error: profilesError } = await serviceClient
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', ownerUserIds);

      if (profilesError) {

        // Continuar sin nombres de perfil si hay un error, no es fatal.
      } else if (profilesData) {
        profileMap = new Map(profilesData.map(p => [p.id, { 
          display_name: p.display_name,
          avatar_url: p.avatar_url
        }]));

      }
    } else if (!profilesTableExists) {

    }

    // Paso 5: Combinar los datos
    const resultList = validShares.map(share => {
      const flowDetails = flowMap.get(share.flow_id);
      if (!flowDetails) {

        return null;
      }

      // Si tenemos el user_id y existe la tabla profiles, intentar obtener el display_name
      const authorProfile = flowDetails.user_id && profilesTableExists 
        ? profileMap.get(flowDetails.user_id) 
        : null;

      return {
        share_id: share.id,
        flow_id: share.flow_id,
        flow_name: flowDetails.name || 'Untitled Flow',
        flow_description: flowDetails.description || null,
        author_display_name: authorProfile?.display_name || null, // Añadir nombre del autor o null si no existe
        avatar_url: authorProfile?.avatar_url || null, // Añadir avatar del autor o null si no existe
        shared_at: share.created_at,
        access_count: share.access_count,
        user_id: flowDetails.user_id // Para debugging
      };
    }).filter(item => item !== null) as PublicFlowListItem[];


    return resultList;

  } catch (error: any) {

    return [];
  }
} 