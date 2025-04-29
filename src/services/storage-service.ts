// IMPORTANT: This file uses a basic Supabase client.
// Authentication MUST be handled by the caller (e.g., by creating an authenticated client there).

import { Node, Edge } from '@xyflow/react';
// Use the *basic* browser client creator from Supabase SSR helpers
// OR directly use createClient from '@supabase/supabase-js' if preferred.
// Let's use the basic SSR helper for consistency with potential anon usage.
import { createBrowserClient } from '@supabase/ssr';

// --- Flow Types (Keep as is, but match DB columns) ---
export interface SavedFlow {
  collections: any;
  id: string;         // uuid in DB
  user_id: string;    // text in DB
  name: string;       // text in DB
  description?: string | null; // text in DB (nullable)
  nodes: Node[];      // jsonb in DB
  edges: Edge[];      // jsonb in DB
  created_at: string; // timestamptz in DB
  updated_at: string; // timestamptz in DB
}

export type FlowSaveData = Pick<SavedFlow, 'name' | 'nodes' | 'edges'> & { 
  description?: string | null; 
  collections?: string | null;
  id?: string; 
}

// --- Environment Types (Keep as is, but match DB columns) ---
export interface EnvironmentVariable {
  id: string; 
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;         // uuid in DB
  user_id: string;    // text in DB
  name: string;       // text in DB
  variables: EnvironmentVariable[]; // jsonb in DB
  created_at: string; // timestamptz in DB
  updated_at: string; // timestamptz in DB
}

export type EnvironmentSaveData = Pick<Environment, 'name' | 'variables'> & { 
  id?: string; 
}

// --- Initialize a BASIC, potentially anonymous client --- 
// This client should ONLY be used for calls that DO NOT require user auth
// or if the caller guarantees RLS is sufficient via the anon key.
// Authenticated calls MUST create their own client with a token.
const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- Flow Management Functions (USING THE BASIC CLIENT) ---
// These functions now assume the caller handles authentication/RLS.

/**
 * Fetches saved flows for the currently authenticated user from Supabase.
 * Requires the user ID obtained from Clerk.
 */
export async function getSavedFlows(userId: string): Promise<SavedFlow[]> {
  // Note: RLS must be set up correctly for this to work securely based on userId and anon key
  if (!userId) {
    console.warn('[StorageService] User ID not provided for getSavedFlows. Relying on RLS.');
    // Decide if you want to proceed or return []
  }
  try {
    // Using the basic client - RLS based on anon key + user_id must secure this
    const { data, error } = await supabase 
      .from('flows')
      .select('*')
      .eq('user_id', userId) // Still good practice to include userId if possible for RLS
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((flow: any) => ({ ...flow, nodes: flow.nodes ?? [], edges: flow.edges ?? [] })) as SavedFlow[];
  } catch (error) {
    console.error('Error loading saved flows from Supabase:', error);
    return [];
  }
}

/**
 * Saves or updates a flow for the user in Supabase.
 * Requires the user ID.
 */
export async function saveFlow(
  flowData: FlowSaveData, 
  userId: string
): Promise<SavedFlow> {
   // Caller MUST use an authenticated client for this operation.
   // This implementation using the basic client is likely INSECURE without proper RLS
   // and might fail if inserts/updates are restricted.
   // It's kept here structurally but should ideally be called via an authenticated client created in the store.
  if (!userId) {
    throw new Error('[StorageService] User ID is required to save flow.');
  }
 
  const timestamp = new Date().toISOString();
  const dataToSave = {
    ...flowData,
    user_id: userId,
    nodes: flowData.nodes || [],
    edges: flowData.edges || [],
    updated_at: timestamp,
  };

  try {
    if (flowData.id) {
      console.warn(`[StorageService] Attempting UPDATE flow ${flowData.id} using potentially unauthenticated client. RLS must protect this.`);
      const { data, error } = await supabase
        .from('flows')
        .update(dataToSave)
        .eq('id', flowData.id)
        .eq('user_id', userId) // Keep for RLS check
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error('Failed to update flow or flow not found.');
      return { ...data, nodes: data.nodes ?? [], edges: data.edges ?? [] } as SavedFlow;
    } else {
      console.warn(`[StorageService] Attempting INSERT flow for user ${userId} using potentially unauthenticated client. RLS must protect this.`);
      const { data, error } = await supabase
        .from('flows')
        .insert({ ...dataToSave, created_at: timestamp })
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error('Failed to insert new flow.');
      return { ...data, nodes: data.nodes ?? [], edges: data.edges ?? [] } as SavedFlow;
    }
  } catch (error: any) {
    console.error('[StorageService] Error saving flow to Supabase (basic client):', error.message);
    throw error;
  }
}

/**
 * Deletes a specific flow for the user from Supabase.
 * Requires the user ID.
 */
export async function deleteFlow(id: string, userId: string): Promise<boolean> {
  // Caller MUST use an authenticated client.
  console.warn(`[StorageService] Attempting DELETE flow ${id} using potentially unauthenticated client. RLS must protect this.`);
   if (!userId) {
    console.error('[StorageService] User ID is required to delete flow.');
    return false;
  }
  try {
    const { error } = await supabase
      .from('flows')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Keep for RLS check

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting flow from Supabase (basic client):', error);
    return false;
  }
}

/**
 * Fetches a single flow by its ID for the user from Supabase.
 * Requires the user ID.
 */
export async function getFlowById(id: string, userId: string): Promise<SavedFlow | null> {
  // RLS must protect this if using basic client
  if (!userId) {
    console.warn('[StorageService] User ID not provided for getFlowById. Relying on RLS.');
  }
  try {
    const { data, error } = await supabase
      .from('flows')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId) // Keep for RLS check
      .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found is not an error
        throw error;
    }
    return data ? { ...data, nodes: data.nodes ?? [], edges: data.edges ?? [] } as SavedFlow : null;
  } catch (error) {
    console.error('Error fetching flow by ID from Supabase (basic client):', error);
    return null;
  }
}

// FIX: Change return type from Omit to Pick for clarity and to potentially fix linter error.
export function createNewFlowData(name = 'Untitled Flow'): FlowSaveData {
  return {
    name,
    description: '',
    nodes: [],
    edges: [],
  };
}

// --- Environment Management Functions (USING THE BASIC CLIENT) ---
// Again, these assume the caller handles authentication/RLS.

/**
 * Fetches saved environments for the user from Supabase.
 * Requires the user ID.
 */
export async function getEnvironments(userId: string): Promise<Environment[]> {
  if (!userId) {
     console.warn('[StorageService] User ID not provided for getEnvironments. Relying on RLS.');
  }
  try {
    const { data, error } = await supabase
      .from('environments')
      .select('*')
      .eq('user_id', userId) // Keep for RLS
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map((env: any) => ({ ...env, variables: env.variables ?? [] })) as Environment[];
  } catch (error) {
    console.error('Error loading environments from Supabase (basic client):', error);
    return [];
  }
}

/**
 * Saves or updates an environment for the user in Supabase.
 * Requires the user ID.
 */
export async function saveEnvironment(
  envData: EnvironmentSaveData,
  userId: string
): Promise<Environment> {
  // Caller MUST use an authenticated client.
  if (!userId) {
    throw new Error('[StorageService] User ID is required to save environment.');
  }
  console.warn(`[StorageService] Attempting SAVE environment using potentially unauthenticated client. RLS must protect this.`);

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
    console.error('Error saving environment to Supabase (basic client):', error.message);
    throw error;
  }
}

/**
 * Deletes a specific environment for the user from Supabase.
 * Requires the user ID.
 */
export async function deleteEnvironment(id: string, userId: string): Promise<boolean> {
  // Caller MUST use an authenticated client.
  console.warn(`[StorageService] Attempting DELETE environment ${id} using potentially unauthenticated client. RLS must protect this.`);
  if (!userId) {
    console.error('[StorageService] User ID is required to delete environment.');
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
    console.error('Error deleting environment from Supabase (basic client):', error);
    return false;
  }
}

/**
 * Fetches a single environment by ID for the user from Supabase.
 * Requires the user ID.
 */
export async function getEnvironmentById(id: string, userId: string): Promise<Environment | null> {
  // RLS must protect this
   if (!userId) {
    console.warn('[StorageService] User ID not provided for getEnvironmentById. Relying on RLS.');
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
    console.error('Error fetching environment by ID from Supabase (basic client):', error);
    return null;
  }
}

// FIX: Change return type from Omit to Pick for clarity and to potentially fix linter error.
export function createNewEnvironmentData(name = 'New Environment'): EnvironmentSaveData {
  return {
    name,
    variables: [],
  };
}

// --- Helper Functions (Keep as is or move/remove) --- 

// Exporting/Importing flows might need reconsideration.
// Do we export/import directly to/from the DB or keep the file-based approach?
// For now, let's comment them out as they rely on the old structure.

// export function exportFlowAsJson(flow: SavedFlow): void {
//   // ... (Implementation needs review based on how flows are handled) ...
// }

// export async function importFlowFromJson(file: File): Promise<SavedFlow | null> {
//   // ... (Implementation needs review - should it call saveFlow with userId?) ...
// }