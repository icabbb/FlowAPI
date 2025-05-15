// src/store/Slices/flowCrudSlice.ts
/* eslint-disable @typescript-eslint/consistent-type-imports */
import { StateCreator } from 'zustand';
import { nanoid } from 'nanoid';
import { generateSlug } from '@/lib/utils';

import { createNewFlowData } from '@/services/storage/flow-storage';

import type { SavedFlow, FlowSaveData } from '@/contracts/types';

import type { FlowStore } from '../index';
import { WorkflowTemplate } from '@/config/workflow-templates';
import { createActionClient } from '../utils/supabase';
import { Edge, Node } from '@xyflow/react';

export interface FlowCrudSlice {
  /* ---------- meta ---------- */
  currentFlowId: string | null;
  currentFlowName: string;
  currentFlowDescription: string;
  currentFlowCollection: string | null;
  currentFlowSlug: string | null;

  /* ---------- flags ---------- */
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;

  /* ---------- lists ---------- */
  savedFlows: SavedFlow[];

  /* ---------- CRUD ---------- */
  loadSavedFlows(): Promise<void>;
  loadFlow(flowId: string): Promise<void>;
  setLoadedFlowData(flowData: SavedFlow, activeSlug?: string | null): void;
  saveCurrentFlow(
    name?: string,
    description?: string,
    collection?: string | null,
    nodesOverride?: Node[],
    edgesOverride?: Edge[],
    customSlug?: string | null,
  ): Promise<SavedFlow | null>;
  createNewFlow(name?: string): Promise<void>;
  deleteFlow(flowId: string): Promise<boolean>;
  exportCurrentFlow(): void;
  importFlow(file: File): Promise<SavedFlow | null>;

  /* ---------- misc ---------- */
  setCurrentFlowMetadata(data: { name?: string; description?: string }): void;
  clearCanvas(): void;
  loadWorkflow(template: WorkflowTemplate): void;
  setDirty(isDirty: boolean): void;
}

export const createFlowCrudSlice: StateCreator<
  FlowStore,
  [],
  [],
  FlowCrudSlice
> = (set, get) => ({
  /* ---------- estado inicial ---------- */
  currentFlowId: null,
  currentFlowName: 'Untitled Flow',
  currentFlowDescription: '',
  currentFlowCollection: null,
  currentFlowSlug: null,
  isLoading: false,
  isSaving: false,
  isDirty: false,
  savedFlows: [],

  /* --- Carga la lista de flujos guardados --- */
  async loadSavedFlows() {
    const { userId } = get();
    if (!userId) {

      set({ savedFlows: [] });
      return;
    }

    const supabase = createActionClient();
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('flows')
        .select('id, name, description, collections, updated_at, created_at, user_id')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      set({ savedFlows: (data as SavedFlow[]) || [] });
    } catch (err) {

      set({ savedFlows: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  /* --- Carga un flujo específico --- */
  async loadFlow(flowId) {
    const { userId, clearCanvas } = get();
    if (!userId) {

      return;
    }
    if (!flowId) {

      return;
    }

    const supabase = createActionClient();
    set({ isLoading: true });
    clearCanvas();

    try {
      const { data: flowData, error: flowError } = await supabase
        .from('flows')
        .select('*')
        .eq('id', flowId)
        .eq('user_id', userId)
        .single();

      if (flowError) {
        if (flowError.code === 'PGRST116') {

        } else {
          throw flowError;
        }
      }
      
      if (flowData) {
        let activeSlug: string | null = null;
        try {
          const { data: aliasData, error: aliasError } = await supabase
            .from('flow_aliases')
            .select('slug')
            .eq('flow_id', flowData.id)
            .eq('is_active', true)
            .maybeSingle();

          if (aliasError) {

          } else if (aliasData) {
            activeSlug = aliasData.slug;

          }
        } catch (e) {

        }
        get().setLoadedFlowData(flowData as SavedFlow, activeSlug);
      } else {

        clearCanvas();
      }
    } catch (err) {

      clearCanvas();
    } finally {
      set({ isLoading: false });
    }
  },

  /* --- Nueva acción para hidratar el store --- */
  setLoadedFlowData: (flowData, activeSlug?: string | null) => {
    if (!flowData || !flowData.id) {

      set({ isLoading: false });
      return;
    }

    set({
      nodes: flowData.nodes ?? [],
      edges: flowData.edges ?? [],
      currentFlowId: flowData.id,
      currentFlowName: flowData.name,
      currentFlowDescription: flowData.description ?? '',
      currentFlowCollection: flowData.collections ?? null,
      currentFlowSlug: activeSlug ?? null,
      nodeResults: {},
      selectedNodeId: null,
      isDirty: false,
      isLoading: false,
    });
  },

  /* --- upsert (saveCurrentFlow) --- */
  async saveCurrentFlow(
    name,
    description,
    collection,
    nodesOverride,
    edgesOverride,
    customSlug,
  ) {
    const {
      nodes,
      edges,
      currentFlowId,
      currentFlowName,
      currentFlowDescription,
      currentFlowCollection,
      currentFlowSlug: existingActiveSlug,
      userId,
      loadSavedFlows,
    } = get();

    if (!userId) {

      return null;
    }
    if (!currentFlowId) {

      return null;
    }

    const supabase = createActionClient();
    set({ isSaving: true });

    const flowNodes = nodesOverride ?? nodes;
    const flowEdges = edgesOverride ?? edges;
    const flowName = name ?? currentFlowName;
    const flowDescription = description ?? currentFlowDescription;
    const flowCollection = collection ?? currentFlowCollection;

    const payload: FlowSaveData = {
      id: currentFlowId,
      name: flowName,
      description: flowDescription,
      collections: flowCollection,
      nodes: flowNodes,
      edges: flowEdges,
    };

    console.log('[flowCrudSlice] saveCurrentFlow: Attempting to UPDATE flow', {
      id: currentFlowId,
      name: flowName,
      customSlugProvided: customSlug,
    });

    let savedFlowData: SavedFlow | null = null;
    let finalSlugForUpdate: string | null = existingActiveSlug;

    try {
      if (customSlug && customSlug.trim() !== '' && customSlug !== existingActiveSlug) {

        const newBaseSlug = generateSlug(customSlug);
        let attemptedSlug = newBaseSlug;
        let slugUpdateSuccess = false;
        const maxSlugAttempts = 5;

        if (!newBaseSlug) {

        } else {
            if (existingActiveSlug) {

                const { error: deactivateError } = await supabase
                    .from('flow_aliases')
                    .update({ is_active: false })
                    .eq('flow_id', currentFlowId)
                    .eq('is_active', true);
                if (deactivateError) {

                }
            }

            for (let attempt = 1; attempt <= maxSlugAttempts; attempt++) {
                try {
                    const { error: aliasInsertError } = await supabase
                        .from('flow_aliases')
                        .insert({ flow_id: currentFlowId, slug: attemptedSlug, is_active: true });

                    if (aliasInsertError) {
                        if (aliasInsertError.message.includes('duplicate key value')) {

                            attemptedSlug = `${newBaseSlug}-${nanoid(5)}`;
                        } else {
                            throw aliasInsertError;
                        }
                    } else {

                        finalSlugForUpdate = attemptedSlug;
                        slugUpdateSuccess = true;
                        break;
                    }
                } catch (loopError) {

                    if (attempt === maxSlugAttempts) {

                    }
                }
            }
             if (!slugUpdateSuccess) {

             }
        }
      } else if (customSlug === '' && existingActiveSlug) {

        const { error: deactivateError } = await supabase
            .from('flow_aliases')
            .update({ is_active: false })
            .eq('flow_id', currentFlowId)
            .eq('slug', existingActiveSlug)
            .eq('is_active', true);
        if (deactivateError) {

        } else {
            finalSlugForUpdate = null;
        }
      }

      const { data: flowUpdateData, error: flowUpdateError } = await supabase
        .from('flows')
        .update({
          name: payload.name,
          description: payload.description,
          collections: payload.collections,
          nodes: payload.nodes,
          edges: payload.edges,
          user_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentFlowId)
        .select()
        .single();

      if (flowUpdateError) {

        savedFlowData = await saveWithBackupMethod({ ...payload, id: currentFlowId }, userId, loadSavedFlows, set);
        if (!savedFlowData) {
            throw new Error('Both primary and backup save methods failed for flow data update.');
        }
      } else if (flowUpdateData) {
        savedFlowData = flowUpdateData as SavedFlow;
        console.log('[flowCrudSlice] saveCurrentFlow: Successfully UPDATED flow data with primary method', {
          id: savedFlowData.id,
          name: savedFlowData.name,
        });
      } else {
        throw new Error("Flow data update returned no data and no error.");
      }

      if (savedFlowData) {
        set({
          currentFlowName: savedFlowData.name,
          currentFlowDescription: savedFlowData.description ?? '',
          currentFlowCollection: savedFlowData.collections ?? null,
          currentFlowSlug: finalSlugForUpdate,
          isDirty: false,
        });
        await loadSavedFlows();
      }
      return savedFlowData;

    } catch (error) {

      if (!savedFlowData) { 
        try {

            savedFlowData = await saveWithBackupMethod({ ...payload, id: currentFlowId }, userId, loadSavedFlows, set);
             if (savedFlowData) {
      set({
                    currentFlowName: savedFlowData.name,
                    currentFlowDescription: savedFlowData.description ?? '',
                    currentFlowCollection: savedFlowData.collections ?? null,
                    currentFlowSlug: finalSlugForUpdate,
        isDirty: false,
      });
      await loadSavedFlows();
            }
      } catch (backupError) {

        }
      }
      return savedFlowData;
    } finally {
      set({ isSaving: false });
    }
  },

  /* --- create --- */
  async createNewFlow(name = 'Untitled Flow') {

    const { userId, loadSavedFlows, clearCanvas } = get();
    if (!userId) {

      return;
    }

    const supabase = createActionClient();
    set({ isLoading: true });
    clearCanvas();
    set({ currentFlowName: name, currentFlowDescription: '', currentFlowCollection: null, currentFlowSlug: null });

    try {
      const newFlowDataForTable = createNewFlowData(name);
      const ts = new Date().toISOString();


      const { data: insertedFlow, error: insertFlowError } = await supabase
        .from('flows')
        .insert({
          name: name,
          description: '',
          collections: null,
          nodes: newFlowDataForTable.nodes, 
          edges: newFlowDataForTable.edges,
          user_id: userId,
          created_at: ts,
          updated_at: ts,
        })
        .select()
        .single();


      if (insertFlowError) {

        throw insertFlowError;
      }
      if (!insertedFlow || !insertedFlow.id) {

        throw new Error('Flow insert returned null or no ID');
      }




      const newFlowId = insertedFlow.id;
      const flowNameForSlug = insertedFlow.name;
      let finalNewSlug: string | null = null;
      const baseSlug = generateSlug(flowNameForSlug);
      let attemptedSlug = baseSlug;
      let slugCreated = false;
      const maxSlugAttempts = 5;

      if (!baseSlug) {

      } else {
        for (let attempt = 1; attempt <= maxSlugAttempts; attempt++) {
            try {
            const { error: aliasInsertError } = await supabase
                .from('flow_aliases')
                .insert({ flow_id: newFlowId, slug: attemptedSlug, is_active: true });

            if (aliasInsertError) {
                if (aliasInsertError.message.includes('duplicate key value')) {

                attemptedSlug = `${baseSlug}-${nanoid(5)}`;
                } else {
                throw aliasInsertError;
                }
            } else {

                finalNewSlug = attemptedSlug;
                slugCreated = true;
                break;
            }
            } catch (slugLoopError) {

            if (attempt === maxSlugAttempts) {

            }
            }
        }
      }


      set({
        nodes: insertedFlow.nodes ?? [],
        edges: insertedFlow.edges ?? [],
        currentFlowId: newFlowId,
        currentFlowName: flowNameForSlug,
        currentFlowDescription: insertedFlow.description ?? '',
        currentFlowCollection: insertedFlow.collections ?? null,
        currentFlowSlug: finalNewSlug,
        nodeResults: {},
        selectedNodeId: null,
        isDirty: false,
      });

      await loadSavedFlows();
    } catch (err) {

    } finally {
      set({ isLoading: false });
    }
  },

  /* --- delete --- */
  async deleteFlow(flowId) {
    const { userId, currentFlowId, clearCanvas, loadSavedFlows } = get();
    if (!userId) {

      return false;
    }

    const supabase = createActionClient();
    set({ isLoading: true });

    try {

      const { error: slugDeactivateError } = await supabase
        .from('flow_aliases')
        .update({ is_active: false })
        .eq('flow_id', flowId);
      
      if (slugDeactivateError) {

      }

      const { error: flowDeleteError } = await supabase
        .from('flows')
        .delete()
        .eq('id', flowId)
        .eq('user_id', userId);

      if (flowDeleteError) throw flowDeleteError;

      if (currentFlowId === flowId) clearCanvas();
      await loadSavedFlows();
      return true;
    } catch (err) {

      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  /* --- export as .json --- */
  exportCurrentFlow() {
    const {
      currentFlowName,
      currentFlowDescription,
      currentFlowCollection,
      currentFlowSlug,
      nodes,
      edges,
    } = get();

    const obj = {
      name: currentFlowName || 'Untitled Flow',
      description: currentFlowDescription || '',
      collection: currentFlowCollection || null,
      slug: currentFlowSlug || undefined,
      nodes: nodes ?? [],
      edges: edges ?? [],
    };

    const blob = new Blob([JSON.stringify(obj, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(currentFlowName || 'flow')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /* --- importar un .json --- */
  async importFlow(file: File): Promise<SavedFlow | null> {
    const { userId, loadSavedFlows, clearCanvas } = get();
    if (!userId) {

      return null;
    }

    const supabase = createActionClient();
    set({ isLoading: true });

    try {
      const fileContent = await file.text();
      const importedData = JSON.parse(fileContent);

      const requiredFields = ['name', 'nodes', 'edges'];
      const missingFields = requiredFields.filter(field => !(field in importedData));
      if (missingFields.length > 0) {
        throw new Error(`Imported file is missing required fields: ${missingFields.join(', ')}`);
      }

      const flowNameToUse = importedData.name || 'Imported Flow';
      const ts = new Date().toISOString();

      const { data: newFlow, error: insertError } = await supabase
        .from('flows')
        .insert({
          name: flowNameToUse,
          description: importedData.description || '',
          collections: importedData.collection || null,
          nodes: importedData.nodes as Node[],
          edges: importedData.edges as Edge[],
          user_id: userId,
          created_at: ts,
          updated_at: ts,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      if (!newFlow || !newFlow.id) throw new Error('Imported flow insert returned null or no ID');
      


      let finalImportedSlug: string | null = null;
      const importedSlugAttempt = importedData.slug ? generateSlug(importedData.slug) : null;
      const baseSlugForImport = importedSlugAttempt || generateSlug(flowNameToUse);
      let attemptedSlug = baseSlugForImport;
      let slugCreated = false;
      const maxSlugAttempts = 5;

      if (!baseSlugForImport) {

      } else {
        for (let attempt = 1; attempt <= maxSlugAttempts; attempt++) {
            try {
            const { error: aliasInsertError } = await supabase
                .from('flow_aliases')
                .insert({ flow_id: newFlow.id, slug: attemptedSlug, is_active: true });

            if (aliasInsertError) {
                if (aliasInsertError.message.includes('duplicate key value')) {

                attemptedSlug = `${baseSlugForImport}-${nanoid(5)}`;
                } else {
                throw aliasInsertError;
                }
            } else {

                finalImportedSlug = attemptedSlug;
                slugCreated = true;
                break;
            }
            } catch (slugLoopError) {

            if (attempt === maxSlugAttempts) {

            }
            }
        }
      }

      
      clearCanvas();
      get().setLoadedFlowData(newFlow as SavedFlow, finalImportedSlug);
          await loadSavedFlows();
      return newFlow as SavedFlow;

    } catch (err: any) {

      return null;
        } finally {
          set({ isLoading: false });
        }
  },

  /* --- Carga un workflow desde una plantilla --- */
  loadWorkflow(template: WorkflowTemplate) {
    const { clearCanvas } = get();
    clearCanvas();
    set({
      nodes: template.nodes.map(node => ({ ...node })),
      edges: template.edges.map(edge => ({ ...edge })),
      currentFlowName: template.name,
      currentFlowDescription: template.description || '',
      currentFlowSlug: null,
      isDirty: true,
    });
  },

  /* --- Acción para limpiar el canvas y el estado del flujo actual --- */
  clearCanvas() {
    set({
      nodes: [],
      edges: [],
      currentFlowId: null,
      currentFlowName: 'Untitled Flow',
      currentFlowDescription: '',
      currentFlowCollection: null,
      currentFlowSlug: null,
      nodeResults: {},
      selectedNodeId: null,
      isDirty: false,
    });
  },

  /* --- misc --- */
  setCurrentFlowMetadata: (data) => set((state) => ({
    currentFlowName: data.name ?? state.currentFlowName,
    currentFlowDescription: data.description ?? state.currentFlowDescription,
    isDirty: true,
  })),

  setDirty: (isDirty) => set({ isDirty }),
});

// Helper function (can be outside the slice or in a utils file if preferred)
async function saveWithBackupMethod(
  payload: FlowSaveData,
  userId: string,
  loadSavedFlows: () => Promise<void>, 
  set: any // Zustand set function
): Promise<SavedFlow | null> {

  const supabase = createActionClient();
  
  try {
    if (!payload.id) {

      return null;
    }

    const { data, error } = await supabase
      .from('flows')
      .update({ 
        name: payload.name,
        description: payload.description,
        collections: payload.collections,
        nodes: payload.nodes,
        edges: payload.edges,
        user_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.id)
      .select()
      .single();

    if (error) {

      throw error; 
    }
    if (!data) {

      throw new Error('Backup save method returned no data.');
    }
    

    return data as SavedFlow;
  } catch (err) {

    return null;
  }
}
