import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  NodeChange,
  type EdgeChange,
} from '@xyflow/react';
// Import the specific execution logic function and callback type
import { executeSingleNodeLogic, runFlowLogic, type ResolveVariableCallback } from '@/services/execution-service';
import {
  // We are now making direct Supabase calls from the store actions,
  // so we only need the types and helper functions from the service.
  // getSavedFlows, saveFlow, deleteFlow, getFlowById, 
  // getEnvironments, saveEnvironment, deleteEnvironment, getEnvironmentById,
  createNewFlowData, type SavedFlow, type Environment, type FlowSaveData, type EnvironmentSaveData
} from '@/services/storage-service';
import { useAuth, useSession } from '@clerk/nextjs';
import { useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
// Import the encryption service
import { processEnvironmentVariables } from '@/services/encryption-service';

// ... (NodeResult, ExecutionStatus types) ...
type ExecutionStatus = 'idle' | 'loading' | 'success' | 'error';
export interface NodeResult {
  status: ExecutionStatus;
  data?: any; 
  error?: string; 
  statusCode?: number;
  headers?: Record<string, string>;
  timestamp?: number;
}

// Interface FlowState (Updated action signatures)
export interface FlowState {
  nodes: Node[];
  edges: Edge[];
  currentFlowId: string | null;
  currentFlowName: string;
  currentFlowDescription: string;
  currentFlowCollection: string | null;
  selectedNodeId: string | null;
  nodeResults: Record<string, NodeResult>;
  isRunning: boolean;
  isSaving: boolean;
  isLoading: boolean; 
  savedFlows: SavedFlow[];
  environments: Environment[];
  selectedEnvironmentId: string | null;
  userId: string | null; 
  setUserId: (userId: string | null) => void; 
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setSelectedNodeId: (nodeId: string | null) => void;
  updateNodeData: (nodeId: string, data: object) => void;
  addNode: (node: Node) => void;
  addEdge: (edge: Edge) => void;
  setNodeResult: (nodeId: string, result: Partial<NodeResult>) => void;
  runFlow: () => Promise<void>;
  executeSingleNode: (nodeId: string) => Promise<void>;
  clearCanvas: () => void;
  // Updated signatures - no longer need token param
  saveCurrentFlow: (
    name?: string,
    description?: string,
    collection?: string | null,
    nodesToSave?: Node[],
    edgesToSave?: Edge[]
  ) => Promise<SavedFlow | null>;
  loadFlow: (flowId: string) => Promise<void>;
  createNewFlow: (name?: string) => Promise<void>;
  deleteFlow: (flowId: string) => Promise<boolean>;
  exportCurrentFlow: () => void;
  importFlow: (file: File) => Promise<SavedFlow | null>;
  setCurrentFlowMetadata: (data: { name?: string; description?: string }) => void;
  loadSavedFlows: () => Promise<void>;
  loadEnvironments: () => Promise<void>;
  saveEnvironment: (envData: EnvironmentSaveData) => Promise<Environment | null>; 
  deleteEnvironment: (envId: string) => Promise<boolean>;
  selectEnvironment: (envId: string | null) => void;
  getActiveEnvironment: () => Environment | null;
  resolveVariable: ResolveVariableCallback; 
  setEdgeStatus: (edgeId: string, status: 'success' | 'error' | 'loading' | 'idle') => void;
}

// Keep track of the Clerk session globally
let clerkSession: any = null;

// Updated to create an authenticated client using the direct accessToken function
const createActionClient = (): SupabaseClient => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
      // Use accessToken function which will be called by Supabase client when needed
      async accessToken() {
        try {
          // Use the stored Clerk session to get the token
          return clerkSession?.getToken() ?? null;
        } catch (error) {
          console.error("[Supabase Client] Error getting token:", error);
          return null;
        }
      },
    }
  );
};

// Store Implementation
export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  currentFlowId: null,
  currentFlowName: 'Untitled Flow',
  currentFlowDescription: '',
  currentFlowCollection: null,
  selectedNodeId: null,
  nodeResults: {},
  isRunning: false,
  isSaving: false,
  isLoading: false, 
  savedFlows: [],
  environments: [],
  selectedEnvironmentId: null,
  userId: null, 

  setUserId: (userId) => set({ userId }), 

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
    const nodeIdsToDelete = changes
      .filter((change) => change.type === 'remove')
      .map((change) => change.id);
    if (nodeIdsToDelete.length > 0 && nodeIdsToDelete.includes(get().selectedNodeId ?? '')) {
        get().setSelectedNodeId(null);
    }
    if (nodeIdsToDelete.length > 0) {
        set(state => {
            const newNodeResults = { ...state.nodeResults };
            nodeIdsToDelete.forEach(id => delete newNodeResults[id]);
            return { nodeResults: newNodeResults };
        });
    }
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: any) => {
    const newEdge: Edge = {
      ...connection,
      id: crypto.randomUUID(),
      type: connection.type || 'animated',
      data: { 
        ...(connection.data || {}),
        label: connection.data?.label || '' 
      }
    };
    
    set((state) => ({
      edges: addEdge(newEdge, state.edges),
    }));
  },
  setSelectedNodeId: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },
  updateNodeData: (nodeId, data) => {
    const keys = Object.keys(data);
    const isOnlyWidthUpdate = keys.length === 1 && keys[0] === 'width';
    
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          if (!isOnlyWidthUpdate) {
            const existingResult = get().nodeResults[nodeId];
            if (existingResult && existingResult.status !== 'idle') {
              get().setNodeResult(nodeId, { status: 'idle' }); 
              console.log(`[Store] Resetting status for node ${nodeId} due to data change.`);
            }
          }
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      }),
    });
  },
  addNode: (newNode) => {
    set({
      nodes: [...get().nodes, newNode],
    });
  },
  addEdge: (edge: Edge) => {
    const newEdge: Edge = {
      ...edge,
      type: edge.type || 'animated',
    };
    
    set((state) => ({
      edges: [...state.edges, newEdge],
    }));
  },
  setNodeResult: (nodeId, result) => {
    set((state) => ({
      nodeResults: {
        ...state.nodeResults,
        [nodeId]: {
          ...(state.nodeResults[nodeId] || {}), 
          ...result, 
          timestamp: Date.now(),
        },
      },
    }));
  },
  runFlow: async () => {
    const { nodes, edges, setNodeResult, updateNodeData, resolveVariable, setEdgeStatus } = get();
    
    // Reset all node results and set all edges to idle status
    set({ isRunning: true, nodeResults: {} }); 
    
    // Set all edges to idle state
    edges.forEach(edge => {
      setEdgeStatus(edge.id, 'idle');
    });
    
    console.log('[Store] Calling runFlowLogic service...');
    
    try {
      // Use standard execution service without additional parameters
      await runFlowLogic(nodes, edges, setNodeResult, updateNodeData, resolveVariable);
      
      // After execution completes, update edge statuses based on connected node results
      edges.forEach(edge => {
        const sourceNodeResult = get().nodeResults[edge.source];
        const targetNodeResult = get().nodeResults[edge.target];
        
        if (sourceNodeResult?.status === 'success' && targetNodeResult?.status === 'success') {
          setEdgeStatus(edge.id, 'success');
        } else if (sourceNodeResult?.status === 'error' || targetNodeResult?.status === 'error') {
          setEdgeStatus(edge.id, 'error');
        } else if (sourceNodeResult?.status === 'loading' || targetNodeResult?.status === 'loading') {
          setEdgeStatus(edge.id, 'loading');
        } else {
          setEdgeStatus(edge.id, 'idle');
        }
      });
    } catch (error) {
      console.error("[Store] Error during runFlowLogic execution:", error);
      
      // Set edges connected to error nodes to error status
      edges.forEach(edge => {
        const sourceNodeResult = get().nodeResults[edge.source];
        if (sourceNodeResult?.status === 'error') {
          setEdgeStatus(edge.id, 'error');
        }
      });
    } finally {
      set({ isRunning: false });
      console.log('[Store] runFlow finished.');
    }
  },
  executeSingleNode: async (nodeId: string) => {
    const { nodes, edges, setNodeResult, updateNodeData, resolveVariable, setEdgeStatus } = get();
    
    console.log(`[Store] Calling executeSingleNodeLogic for node ${nodeId}...`);
    
    // Find all edges that originate from this node and set them to loading
    edges.forEach(edge => {
      if (edge.source === nodeId) {
        setEdgeStatus(edge.id, 'loading');
      }
    });
    
    try {
      // Use standard execution function without additional parameters
      await executeSingleNodeLogic(
        nodeId,
        nodes,
        edges,
        setNodeResult,
        updateNodeData,
        resolveVariable
      );
      
      // After execution completes, update outgoing edge statuses
      edges.forEach(edge => {
        if (edge.source === nodeId) {
          const nodeResult = get().nodeResults[nodeId];
          setEdgeStatus(edge.id, nodeResult?.status === 'success' ? 'success' : 
                                  nodeResult?.status === 'error' ? 'error' : 
                                  nodeResult?.status === 'loading' ? 'loading' : 'idle');
        }
      });
    } catch (error) {
      console.error(`[Store] Error executing node ${nodeId}:`, error);
      
      // Update the status of outgoing edges to error
      edges.forEach(edge => {
        if (edge.source === nodeId) {
          setEdgeStatus(edge.id, 'error');
        }
      });
    }
    
    console.log(`[Store] executeSingleNodeLogic finished for node ${nodeId}.`);
  },
  clearCanvas: () => {
    set({
      nodes: [],
      edges: [],
      nodeResults: {},
      selectedNodeId: null,
      currentFlowId: null,
      currentFlowName: 'Untitled Flow',
      currentFlowDescription: '',
      currentFlowCollection: null,
    });
  },
  saveCurrentFlow: async (
    name?: string,
    description?: string,
    collection?: string | null,
    nodesToSave?: Node[],
    edgesToSave?: Edge[]
  ) => {
    const { nodes, edges, currentFlowId, currentFlowName, currentFlowDescription, currentFlowCollection, userId, loadSavedFlows } = get();

    if (!userId) {
      console.error("Cannot save flow: User ID not available.");
      return null;
    }
    
    const supabase = createActionClient();

    set({ isSaving: true });
    try {
      // Use provided nodes/edges if available, otherwise use current state
      const flowNodes = nodesToSave !== undefined ? nodesToSave : nodes;
      const flowEdges = edgesToSave !== undefined ? edgesToSave : edges;
      
      const flowData: FlowSaveData = {
        name: name !== undefined ? name : currentFlowName,
        description: description !== undefined ? description : currentFlowDescription,
        collections: collection !== undefined ? collection : currentFlowCollection,
        nodes: flowNodes,
        edges: flowEdges,
        id: currentFlowId || undefined 
      };

      // Call Supabase directly with authenticated client
      const { data: savedFlow, error } = await supabase.from('flows')
        // Use upsert for save/update. Ensure `id` is part of `flowData` if updating.
        // Supabase needs user_id and updated_at. Let DB handle created_at on insert.
        .upsert({ 
            ...flowData, 
            user_id: userId, 
            updated_at: new Date().toISOString()
            // created_at is handled by DB on insert or ignored on update by upsert
         })
        .select()
        .single();

      if (error) throw error;
      if (!savedFlow) throw new Error('Save operation did not return data.');

      set({
        currentFlowId: savedFlow.id,
        currentFlowName: savedFlow.name,
        currentFlowDescription: savedFlow.description || '',
        currentFlowCollection: savedFlow.collection || null,
      });
      // Refresh list
      await loadSavedFlows(); 
      return savedFlow as SavedFlow;
    } catch (error) { 
        console.error("Error saving flow:", error);
        return null; 
    } finally {
      set({ isSaving: false });
    }
  },
  loadFlow: async (flowId) => {
    const { userId, clearCanvas } = get();

    if (!userId) {
      console.error("Cannot load flow: User ID not available.");
      return;
    }

    const supabase = createActionClient();
    
    set({ isLoading: true });
    try {
        const { data: flow, error } = await supabase
          .from('flows')
          .select('*')
          .eq('id', flowId)
          .eq('user_id', userId) 
          .single();

        if (error && error.code !== 'PGRST116') throw error; 

        if (!flow) {
          console.error(`Flow with ID ${flowId} not found for user.`);
          clearCanvas();
          return;
        }
        set({
          nodes: flow.nodes ?? [],
          edges: flow.edges ?? [],
          currentFlowId: flow.id,
          currentFlowName: flow.name,
          currentFlowDescription: flow.description || '',
          currentFlowCollection: flow.collection || null,
          nodeResults: {},
          selectedNodeId: null,
        });
    } catch(error) {
        console.error(`Error loading flow ${flowId}:`, error);
    } finally {
        set({ isLoading: false });
    }
  },
  createNewFlow: async (name = 'Untitled Flow') => {
    const { userId, loadSavedFlows } = get();

    if (!userId) {
      console.error("Cannot create new flow: User ID not available.");
      return;
    }

    const supabase = createActionClient();

    set({ isLoading: true });
    try {
      const newFlowData = createNewFlowData(name); 
      const timestamp = new Date().toISOString();
      
      const { data: savedFlow, error } = await supabase
        .from('flows')
        .insert({ 
            ...newFlowData, 
            user_id: userId, 
            created_at: timestamp, 
            updated_at: timestamp 
        }) 
        .select()
        .single(); 
       
      if (error) throw error;
      if (!savedFlow) throw new Error('Insert operation did not return data.');
      
       set({ 
        nodes: savedFlow.nodes ?? [], 
        edges: savedFlow.edges ?? [], 
        currentFlowId: savedFlow.id,
        currentFlowName: savedFlow.name,
        currentFlowDescription: savedFlow.description || '',
        currentFlowCollection: savedFlow.collection || null,
        nodeResults: {},
        selectedNodeId: null,
       });
      await loadSavedFlows();
     } catch (error) {
        console.error("Error creating new flow:", error);
    } finally {
       set({ isLoading: false });
     }
  },
  deleteFlow: async (flowId) => {
    const { userId, currentFlowId, clearCanvas, loadSavedFlows } = get();

    if (!userId) {
      console.error("Cannot delete flow: User ID not available.");
      return false;
    }

    const supabase = createActionClient();

    set({ isLoading: true });
    try {
      const { error } = await supabase
          .from('flows')
          .delete()
          .eq('id', flowId)
          .eq('user_id', userId); 

      if (error) throw error;

      if (currentFlowId === flowId) {
        clearCanvas(); 
      }
      await loadSavedFlows();
      return true;
    } catch (error) {
      console.error(`Error deleting flow ${flowId}:`, error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  exportCurrentFlow: () => {
    // Get necessary data from the store
    const { currentFlowName, currentFlowDescription, currentFlowCollection, nodes, edges } = get();

    // Construct the object to export (excluding sensitive/unnecessary fields like id, user_id, timestamps)
    const flowToExport = {
      name: currentFlowName || 'Untitled Flow',
      description: currentFlowDescription || '',
      collection: currentFlowCollection || null,
      nodes: nodes || [],
      edges: edges || [],
    };

    // Create a JSON string
    const jsonString = JSON.stringify(flowToExport, null, 2); // Pretty print

    // Create a Blob
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create an object URL
    const url = URL.createObjectURL(blob);

    // Create a temporary link element
    const a = document.createElement('a');
    a.href = url;
    // Generate a filename (sanitize name)
    const fileName = `${(currentFlowName || 'flow').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.download = fileName;

    // Programmatically click the link to trigger the download
    document.body.appendChild(a);
    a.click();

    // Clean up by removing the link and revoking the object URL
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`[Store] Exported flow: ${fileName}`);
  },
  importFlow: async (file) => {
    const { userId, saveCurrentFlow, loadFlow, loadSavedFlows } = get();

    if (!userId) {
      console.error("Cannot import flow: User ID not available.");
      return null;
    }

    if (!file) {
      console.error("No file selected for import.");
      return null;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          console.error("Failed to read file content.");
          return reject(new Error("Failed to read file content."));
        }

        set({ isLoading: true });
        try {
          const importedData = JSON.parse(text);

          // Basic validation
          if (!importedData || typeof importedData !== 'object' || !importedData.nodes || !importedData.edges || !importedData.name) {
            throw new Error('Invalid flow file format. Missing required fields (name, nodes, edges).');
          }

          // Save as a new flow - saveCurrentFlow handles creating a new one if no ID is passed
          const savedFlow = await saveCurrentFlow(
            importedData.name + ' (Imported)', // Append to name to avoid conflict
            importedData.description || '',
            importedData.collection || null,
            // Pass imported nodes and edges
            importedData.nodes, 
            importedData.edges
          );

          if (!savedFlow) {
            throw new Error('Failed to save the imported flow.');
          }

          console.log(`[Store] Imported flow saved with ID: ${savedFlow.id}`);
          
          // Reload the list of saved flows
          await loadSavedFlows();

          // Load the newly imported flow onto the canvas
          await loadFlow(savedFlow.id);
          
          resolve(savedFlow);

        } catch (error: any) {
          console.error("Error importing flow:", error);
          reject(error); 
        } finally {
          set({ isLoading: false });
        }
      };

      reader.onerror = (error) => {
        console.error("File reading error:", error);
        reject(new Error("Failed to read file."));
      };

      reader.readAsText(file);
    });
  },
  setCurrentFlowMetadata: (data) => {
    set((state) => ({
      currentFlowName: data.name !== undefined ? data.name : state.currentFlowName,
      currentFlowDescription: data.description !== undefined ? data.description : state.currentFlowDescription,
    }));
  },
  loadSavedFlows: async () => {
    const { userId } = get();

    if (!userId) {
      set({ savedFlows: [] }); // Clear if no user
      return;
    }
    
    const supabase = createActionClient();

    set({ isLoading: true });
    try {
       const { data: flows, error } = await supabase
         .from('flows')
         .select('*')
         .eq('user_id', userId) 
         .order('updated_at', { ascending: false });

      if (error) throw error;

      set({ savedFlows: (flows || []).map((flow: any) => ({ ...flow, nodes: flow.nodes ?? [], edges: flow.edges ?? [] })) as SavedFlow[] });
    } catch (error) {
      console.error("Error loading saved flows from store:", error);
      set({ savedFlows: [] });
    } finally {
      set({ isLoading: false });
    }
  },
  loadEnvironments: async () => {
    const { userId, selectEnvironment, selectedEnvironmentId } = get();

    if (!userId) {
      set({ environments: [], selectedEnvironmentId: null }); // Clear if no user
      return;
    }

    const supabase = createActionClient();

    set({ isLoading: true });
    try {
      const { data: envs, error } = await supabase
        .from('environments')
        .select('*')
        .eq('user_id', userId) 
        .order('name', { ascending: true });

      if (error) throw error;
      
      // Process environments to decrypt variable values
      const loadedEnvs = await Promise.all((envs || []).map(async (env: any) => {
        // Ensure variables exist
        const variables = env.variables ?? [];
        
        // Decrypt the variables if they contain sensitive data
        const decryptedVariables = await processEnvironmentVariables(
          variables,
          userId,
          'decrypt'
        );
        
        return { ...env, variables: decryptedVariables };
      })) as Environment[];
      
      set({ environments: loadedEnvs });

      // Ensure selected environment is still valid
      if (!selectedEnvironmentId || !loadedEnvs.some(e => e.id === selectedEnvironmentId)) {
        selectEnvironment(loadedEnvs.length > 0 ? loadedEnvs[0].id : null);
      }
    } catch (error) {
      console.error("Error loading environments from store:", error);
      set({ environments: [], selectedEnvironmentId: null });
    } finally {
      set({ isLoading: false });
    }
  },
  saveEnvironment: async (envData) => { 
    const { userId, loadEnvironments, selectEnvironment } = get();

    if (!userId) {
      console.error("Cannot save environment: User ID not available.");
      return null;
    }

    const supabase = createActionClient();

    set({ isSaving: true });
    try {
      // Ensure variables have IDs
      const variablesWithIds = (envData.variables || []).map(v => ({ 
          ...v, 
          id: v.id || crypto.randomUUID() 
      }));
      
      // Encrypt the variables for storage
      const encryptedVariables = await processEnvironmentVariables(
        variablesWithIds,
        userId,
        'encrypt'
      );
      
      const dataToSave = { ...envData, variables: encryptedVariables };

      const { data: savedEnv, error } = await supabase.from('environments')
          // Use upsert for save/update
          .upsert({ 
              ...dataToSave, 
              user_id: userId, 
              updated_at: new Date().toISOString()
              // created_at handled by DB or ignored by upsert
            })
          .select()
          .single();
      
      if (error) throw error;
      if (!savedEnv) throw new Error('Save environment did not return data.');
      
      // Use the decrypted variables for the local state
      // This ensures that we don't display encrypted values to the user
      const savedEnvWithDecryptedVars = {
        ...savedEnv,
        variables: variablesWithIds // The original, unencrypted variables
      };
      
      // Reload environments to ensure consistency
      await loadEnvironments();
      
      if (!envData.id) { 
        selectEnvironment(savedEnv.id); 
      }
      
      return savedEnvWithDecryptedVars as Environment;
    } catch (error) {
      console.error("Error saving environment:", error);
      return null;
    } finally {
      set({ isSaving: false });
    }
  },
  deleteEnvironment: async (envId) => {
    const { userId, selectedEnvironmentId, selectEnvironment, loadEnvironments } = get();

    if (!userId) {
      console.error("Cannot delete environment: User ID not available.");
      return false;
    }

    const supabase = createActionClient();

    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('environments')
        .delete()
        .eq('id', envId)
        .eq('user_id', userId);
        
      if (error) throw error;

      if (selectedEnvironmentId === envId) {
        selectEnvironment(null); 
      }
      await loadEnvironments();
      return true;
    } catch (error) {
      console.error(`Error deleting environment ${envId}:`, error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  selectEnvironment: (envId) => {
    set({ selectedEnvironmentId: envId });
  },
  getActiveEnvironment: () => {
    const { environments, selectedEnvironmentId } = get();
    if (!selectedEnvironmentId) return null;
    return environments.find(env => env.id === selectedEnvironmentId) || null;
  },
  resolveVariable: (value: string | undefined): string | undefined => {
    if (typeof value !== 'string') return value;
    const activeEnv = get().getActiveEnvironment();
    if (!activeEnv) return value; 
    
    const variableRegex = /\{\{([^}]+)\}\}/g;
    let resolvedValue = value;
    let match;
    let levels = 0;
    const maxLevels = 10; 

    variableRegex.lastIndex = 0; 

    while ((match = variableRegex.exec(resolvedValue)) !== null && levels < maxLevels) {
      const varName = match[1].trim();
      const variable = activeEnv.variables.find(v => v.key === varName && v.enabled);
      
      if (variable) {
        // Variable values are already decrypted in memory
        const resolvedVarValue = get().resolveVariable(variable.value);
        resolvedValue = resolvedValue.substring(0, match.index) + 
                        (resolvedVarValue || '') + 
                        resolvedValue.substring(match.index + match[0].length);
        variableRegex.lastIndex = 0; 
        levels++;
      } else {
          variableRegex.lastIndex = match.index + 1;
      }
    }
    if (levels >= maxLevels) {
      console.warn("Max variable resolution depth reached. Check for circular references.");
    }
    
    return resolvedValue;
  },
  setEdgeStatus: (edgeId: string, status: 'success' | 'error' | 'loading' | 'idle') => {
    set((state) => ({
      edges: state.edges.map((edge) => {
        if (edge.id === edgeId) {
          return {
            ...edge,
            data: {
              ...(edge.data || {}),
              status,
            },
          };
        }
        return edge;
      }),
    }));
  },
}));

// Hook to initialize store with userId, depends on session
export const useInitializeFlowStore = () => {
  const { userId } = useAuth();
  const { session, isLoaded } = useSession();
  const setUserId = useFlowStore((state) => state.setUserId);
  const storeUserId = useFlowStore((state) => state.userId);
  const loadFlows = useFlowStore((state) => state.loadSavedFlows);
  const loadEnvs = useFlowStore((state) => state.loadEnvironments);
  const loadFlow = useFlowStore((state) => state.loadFlow);
  const getCurrentFlowId = useFlowStore((state) => state.currentFlowId);

  useEffect(() => {
    // Store the Clerk session in our module-level variable
    clerkSession = session;
    
    // Initialize data when session loads
    const initializeData = async () => {
      if (isLoaded && userId && userId !== storeUserId) { 
        console.log(`[Store Init] Session loaded. Setting userId: ${userId}`);
        setUserId(userId);
        console.log("[Store Init] Loading initial flows and environments...");
        await loadFlows();
        await loadEnvs();

        // After loading the list, attempt to load the most recent flow
        // ONLY if no flow is currently loaded (currentFlowId is null)
        const currentFlowIdAfterInit = useFlowStore.getState().currentFlowId;
        const loadedFlows = useFlowStore.getState().savedFlows;
        if (currentFlowIdAfterInit === null && loadedFlows.length > 0) {
          const mostRecentFlowId = loadedFlows[0].id; // Assuming sorted by updated_at desc
          console.log(`[Store Init] No flow loaded, loading most recent: ${mostRecentFlowId}`);
          await loadFlow(mostRecentFlowId);
        } else if (currentFlowIdAfterInit !== null) {
          console.log(`[Store Init] A flow (${currentFlowIdAfterInit}) is already loaded.`);
        }
      } else if (isLoaded && !userId && storeUserId) { 
        // User signed out or session changed
        console.log("[Store Init] Session loaded. Clearing userId and data.");
        setUserId(null);
        loadFlows(); // Will clear data if userId is null
        loadEnvs();  // Will clear data if userId is null
      } else if (!isLoaded) { 
        // console.log("[Store Init] Waiting for session to load...");
      }
    };

    initializeData();

  }, [isLoaded, userId, storeUserId, session, setUserId, loadFlows, loadEnvs, loadFlow]);
};

