import { currentUser } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient as createServiceRoleSupabaseClient } from '@supabase/supabase-js';

/**
 * Obtiene un cliente Supabase con rol de servicio
 * Este cliente puede saltarse las políticas RLS
 */
const getServiceClient = () => {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createServiceRoleSupabaseClient(
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
 * Sincroniza el perfil del usuario actual desde Clerk con la tabla profiles de Supabase
 * Esta función debe ser llamada desde una ruta del servidor o una acción del servidor
 * cuando un usuario inicia sesión por primera vez o actualiza su perfil
 */
export async function syncUserProfile() {
  // Obtener el usuario actual de Clerk
  const user = await currentUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  (`[ProfileSync] Synchronizing profile for user: ${user.id}`);

  // Primero intentar con el cliente de servicio para saltarse RLS
  const serviceClient = getServiceClient();
  let supabase;

  if (serviceClient) {
    ('[ProfileSync] Using service client to bypass RLS');
    supabase = serviceClient;
  } else {
    ('[ProfileSync] Service client not available, falling back to standard server client (with Clerk auth)');
    // Crear un cliente Supabase del lado del servidor si no hay cliente de servicio
    supabase = createServerSupabaseClient();
  }
  
  // Extraer datos relevantes del perfil de Clerk
  const profile = {
    id: user.id, // El ID de Clerk como clave primaria
    display_name: user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.firstName || user.username || 'Usuario',
    username: user.username || null,
    email: user.emailAddresses[0].emailAddress || null,
    avatar_url: user.imageUrl || null,
    updated_at: new Date().toISOString()
  };

  (`[ProfileSync] Profile data: ${JSON.stringify({ id: profile.id, display_name: profile.display_name })}`);

  // Insertar o actualizar el perfil en Supabase usando upsert
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { 
      onConflict: 'id',
      ignoreDuplicates: false
    })
    .select();

  if (error) {

    throw new Error(`Failed to sync user profile: ${error.message}`);
  }

  (`[ProfileSync] Profile synchronized successfully for user: ${user.id}`);
  return data ? data[0] : profile;
}

/**
 * Obtiene el perfil del usuario por ID
 * Esta función puede ser usada para obtener un perfil público, por lo que
 * puede ser llamada desde el cliente o el servidor
 */
export async function getUserProfile(userId: string) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, email')
    .eq('id', userId)
    .single();

  if (error) {

    return null;
  }

  return data;
} 