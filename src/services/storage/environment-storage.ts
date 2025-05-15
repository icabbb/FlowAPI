import { createBrowserClient } from '@supabase/ssr';
import type {
  Environment, EnvironmentSaveData
} from '@/contracts/types/environment.types';

// --- Initialize a BASIC, potentially anonymous client ---
const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- Environment Management Functions ---

/**
 * Fetches saved environments for the user from Supabase.
 * Requires the user ID. Relies on RLS for security.
 */
export async function getEnvironments(userId: string): Promise<Environment[]> {
  if (!userId) {

  }
  try {
    const { data, error } = await supabase
      .from('environments')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map((env: any) => ({ ...env, variables: env.variables ?? [] })) as Environment[];
  } catch (error) {

    return [];
  }
}

/**
 * Saves or updates an environment for the user in Supabase.
 * IMPORTANT: This function uses the basic Supabase client.
 * The CALLER MUST ensure it's invoked using an authenticated client.
 */
export async function saveEnvironment(
  envData: EnvironmentSaveData,
  userId: string
): Promise<Environment> {
  if (!userId) {
    throw new Error('[EnvStorage] User ID is required to save environment.');
  }


  const timestamp = new Date().toISOString();
  const variablesWithIds = (envData.variables || []).map(v => ({
      ...v,
      id: v.id || crypto.randomUUID()
  }));
  const dataToSave = {
    ...envData,
    user_id: userId,
    variables: variablesWithIds,
    updated_at: timestamp,
  };

  try {
    if (envData.id) {
      // Update
      const { data, error } = await supabase
        .from('environments')
        .update(dataToSave)
        .eq('id', envData.id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error('Failed to update environment or environment not found.');
      return { ...data, variables: data.variables ?? [] } as Environment;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('environments')
        .insert({ ...dataToSave, created_at: timestamp })
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error('Failed to insert new environment.');
      return { ...data, variables: data.variables ?? [] } as Environment;
    }
  } catch (error: any) {

    throw error;
  }
}

/**
 * Deletes a specific environment for the user from Supabase.
 * IMPORTANT: This function uses the basic Supabase client.
 * The CALLER MUST ensure it's invoked using an authenticated client.
 */
export async function deleteEnvironment(id: string, userId: string): Promise<boolean> {
  if (!userId) {

    return false;
  }

  try {
    const { error } = await supabase
      .from('environments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {

    return false;
  }
}

/**
 * Fetches a single environment by ID for the user from Supabase.
 * Requires the user ID. Relies on RLS for security.
 */
export async function getEnvironmentById(id: string, userId: string): Promise<Environment | null> {
   if (!userId) {

  }
  try {
    const { data, error } = await supabase
      .from('environments')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
       if (error.code === 'PGRST116') return null; // Not found
       throw error;
    }
    return data ? { ...data, variables: data.variables ?? [] } as Environment : null;
  } catch (error) {

    return null;
  }
}

/**
 * Creates a new, empty environment data structure.
 */
export function createNewEnvironmentData(name = 'New Environment'): EnvironmentSaveData {
  return {
    name,
    variables: [],
  };
}
