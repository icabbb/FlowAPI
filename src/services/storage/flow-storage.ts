import { createBrowserClient } from '@supabase/ssr';
import type { SavedFlow, FlowSaveData } from '@/contracts/types/flow.types';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getSavedFlows(userId: string): Promise<SavedFlow[]> {
  if (!userId) {

    // Potentially return empty array or throw error depending on requirements
    return [];
  }
  try {
    const { data, error } = await supabase 
      .from('flows')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((flow: any) => ({ ...flow, nodes: flow.nodes ?? [], edges: flow.edges ?? [] })) as SavedFlow[];
  } catch (error) {

    return [];
  }
}

export async function saveFlow(
  flowData: FlowSaveData, 
  userId: string
): Promise<SavedFlow> {
  if (!userId) {
    throw new Error('[FlowStorage] User ID is required to save flow.');
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
      const { data, error } = await supabase
        .from('flows')
        .update(dataToSave)
        .eq('id', flowData.id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error('Failed to update flow or flow not found.');
      return { ...data, nodes: data.nodes ?? [], edges: data.edges ?? [] } as SavedFlow;
    } else {
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

    throw error;
  }
}


export async function deleteFlow(id: string, userId: string): Promise<boolean> {
  if (!userId) {

    return false;
  }

  try {
    const { error } = await supabase
      .from('flows')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {

    return false;
  }
}

export async function getFlowById(id: string, userId: string): Promise<SavedFlow | null> {
  if (!userId) {

  }
  try {
    const { data, error } = await supabase
      .from('flows')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found is not an error
        throw error;
    }
    return data ? { ...data, nodes: data.nodes ?? [], edges: data.edges ?? [] } as SavedFlow : null;
  } catch (error) {

    return null;
  }
}


export function createNewFlowData(name = 'Untitled Flow'): FlowSaveData {
  return {
    name,
    description: '',
    nodes: [],
    edges: [],
    collections: null, // Default collections to null or appropriate default
  };
}

