'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Node, Edge, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { useToast } from '@/components/ui/use-toast';
import { nanoid } from 'nanoid';
import { useDebouncedCallback } from 'use-debounce';
import { createActionClient } from '@/store/utils/supabase';
import type { RemoteCursorData } from '@/contexts/collaboration-context';
import { useFlowStore } from '@/store';

export type FlowData = {
  nodes: Node[];
  edges: Edge[];
  name: string;
  description?: string;
  updated_at: string;
  last_updated_by?: string;
  last_updated_name?: string;
};

type CollaborativeFlowOptions = {
  /**
   * El ID del flujo que se está editando
   */
  flowId: string;
  /**
   * Callback que se ejecuta cuando se carga inicialmente el flujo
   */
  onFlowLoaded?: (flowData: FlowData) => void;
  /**
   * Callback que se ejecuta cuando hay un error
   */
  onError?: (error: Error) => void;
  /**
   * Callback que se ejecuta cuando se reciben cambios de otro usuario
   */
  onRemoteChanges?: (changes: { nodes?: NodeChange[]; edges?: EdgeChange[] }) => void;
  /**
   * Tiempo en ms para debounce de cambios locales
   * @default 500
   */
  debounceTime?: number;
  /**
   * Permiso del usuario actual
   * @default 'edit'
   */
  permission?: 'view' | 'comment' | 'edit';
};

// Tipo para los datos que esperamos de la tabla de presencia
interface PresenceRecord {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  cursor_position: { x: number; y: number } | null;
  // last_active: string; // si se necesitara
}

/**
 * Hook para gestionar un flujo colaborativo en tiempo real
 */
export function useCollaborativeFlow(options: CollaborativeFlowOptions) {
  const {
    flowId,
    onFlowLoaded,
    onError,
    onRemoteChanges,
    debounceTime = 500,
    permission = 'edit',
  } = options;

  // Estado local solo para UI, no para nodos/edges
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [flowName, setFlowName] = useState<string>('');
  const [flowDescription, setFlowDescription] = useState<string>('');
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursorData[]>([]);

  // Zustand selectors
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const zustandSetNodes = useFlowStore((state) => state.setNodes);
  const zustandSetEdges = useFlowStore((state) => state.setEdges);
  const zustandSetCurrentFlowMetadata = useFlowStore((state) => state.setCurrentFlowMetadata);
  
  // Referencias
  const supabaseRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const lastLocalChangeRef = useRef<string>('');
  const isEditableRef = useRef<boolean>(permission === 'edit');
  
  // Hooks
  const { user, isLoaded, isSignedIn } = useUser();
  const { toast } = useToast();
  
  // Nueva función para actualizar la posición del cursor (debounced)
  const updateCursorPosition = useDebouncedCallback(
    async (position: { x: number; y: number } | null) => {

      if (!supabaseRef.current || !flowId || !user?.id) {

        return;
      }

      try {
        const payload = {
            flow_id: flowId,
            user_id: user.id,
            cursor_position: position,
            last_active: new Date().toISOString(),
        };


        const { error: upsertError } = await supabaseRef.current // Renombrado a upsertError para claridad
          .from('flow_collaborators_presence')
          .upsert(payload, { onConflict: 'flow_id, user_id' });
        
        if (upsertError) {

        } else {

        }
      } catch (err) {

      }
    },
    100
  );
  
  // Inicializar Supabase
  useEffect(() => {
    supabaseRef.current = createActionClient(
   
    );
    
    return () => {
      // Limpiar suscripción al desmontar
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);
  
  // Función para cargar el flujo inicial
  const loadFlow = useCallback(async () => {
    if (!supabaseRef.current || !flowId || !user?.id) return;
    
    setIsLoading(true);
    setError(null);
    isEditableRef.current = false; // Reiniciar el permiso de edición

    try {
      console.log('[useCollaborativeFlow] Iniciando loadFlow para flowId:', flowId, 'User ID:', user?.id); // Log inicial

      const { data: flowOwnerData, error: flowOwnerError } = await supabaseRef.current
        .from('flows')
        .select('user_id, name, description, nodes, edges, updated_at, last_updated_by')
        .eq('id', flowId)
        .maybeSingle();


      if (flowOwnerError) {

        throw new Error('Error de red o de servidor al intentar cargar el flujo.');
      }

      if (!flowOwnerData) {
        // Si el flujo no se encontró o el RLS lo bloqueó y .maybeSingle() devolvió null.
        // El error que se lanza más abajo si hasAccess permanece false cubrirá esto.
        // No es necesario lanzar un error aquí inmediatamente, ya que la lógica de colaborador podría dar acceso.

      }

      let flowDataToLoad = flowOwnerData; // Puede ser null
      let hasAccess = false;

      if (flowOwnerData && flowOwnerData.user_id === user.id) {
        // El usuario es el propietario
        isEditableRef.current = true; // El propietario siempre puede editar
        hasAccess = true;

      } else {
        // Si no es propietario O si flowOwnerData fue null (el flujo no se encontró / RLS lo bloqueó para el select inicial),
        // todavía necesitamos verificar si es un colaborador. 
        // Si flowOwnerData fue null, el siguiente bloque no cargará los datos del flujo,
        // pero la verificación de colaborador es independiente de si los datos del flujo se cargaron en el paso anterior.
        const { data: collaboratorData, error: collaboratorError } = await supabaseRef.current
          .from('flow_collaborations') // Asegúrate que esta tabla exista y se llame así
          .select('permission_level, status')
          .eq('flow_id', flowId)
          .eq('collaborator_user_id', user.id) 
          .maybeSingle(); 


        if (collaboratorError) { // No ignorar PGRST116 aquí, cualquier error es problemático

          throw new Error('Error verificando los permisos de colaboración.');
        }

        if (collaboratorData && collaboratorData.status === 'accepted') {
          hasAccess = true;
          isEditableRef.current = collaboratorData.permission_level === 'edit';
          // Si el flujo no se cargó antes (flowDataToLoad es null) porque RLS lo bloqueó para el propietario,
          // pero SÍ es un colaborador aceptado, necesitamos cargar los datos del flujo ahora.
          if (!flowDataToLoad) {


            const { data: collaboratorFlowData, error: collaboratorFlowError } = await supabaseRef.current
              .from('flows')
              .select('user_id, name, description, nodes, edges, updated_at, last_updated_by')
              .eq('id', flowId)
              .maybeSingle(); 


            if (collaboratorFlowError || !collaboratorFlowData) {

              throw new Error('No se pudo cargar el flujo para el colaborador.');
            }
            flowDataToLoad = collaboratorFlowData;
          }

        } else if (collaboratorData && collaboratorData.status === 'pending') {
          hasAccess = false; 

        }
        // Si !collaboratorData, hasAccess sigue siendo false por defecto
      }


      if (!hasAccess) {
        // Este error se lanza si no es propietario Y (no es colaborador O es colaborador pendiente)
        // O si el flujo no existió en primer lugar y tampoco se encontró colaboración.
        throw new Error('No tienes permisos para acceder al contenido de este flujo, tu invitación está pendiente, o el flujo no existe.');
      }
      
      // Asegurarnos de que flowDataToLoad no sea null si hasAccess es true
      if (!flowDataToLoad && hasAccess) {
          // Esto no debería ocurrir si la lógica anterior es correcta, pero es una salvaguarda.

          throw new Error('Error interno: Discrepancia en la carga de datos del flujo.');
      }

      // Si llegamos aquí, el usuario tiene acceso (propietario o colaborador aceptado)
      // y flowDataToLoad debería tener los datos del flujo.
      zustandSetNodes(flowDataToLoad.nodes || []);
      zustandSetEdges(flowDataToLoad.edges || []);
      setFlowName(flowDataToLoad.name || '');
      setFlowDescription(flowDataToLoad.description || '');
      setLastSaved(new Date(flowDataToLoad.updated_at));



      if (onFlowLoaded) {

        onFlowLoaded({
          nodes: flowDataToLoad.nodes || [],
          edges: flowDataToLoad.edges || [],
          name: flowDataToLoad.name || '',
          description: flowDataToLoad.description || '',
          updated_at: flowDataToLoad.updated_at,
          last_updated_by: flowDataToLoad.last_updated_by,
          last_updated_name: ''
        });
      }

      // Cargar colaboradores (esto es para mostrar avatares, etc., en el editor, no para control de acceso)
      const { data: collabDisplayData, error: collabDisplayError } = await supabaseRef.current
        .rpc('get_flow_collaborators_with_details', { flow_id_param: flowId }); // Usar la RPC que ya tenemos

      if (!collabDisplayError && collabDisplayData) {
        setCollaborators(collabDisplayData.filter((c: any) => c.status === 'accepted')); // Solo mostrar colaboradores aceptados en el editor
      }
      
    } catch (err: any) {

      setError(err);
      if (onError) onError(err);
      
      toast({
        title: 'Error al cargar el flujo',
        description: err.message || 'No se pudo cargar el flujo o verificar el acceso.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      console.log('[useCollaborativeFlow] loadFlow finalizado. isLoading:', false, 'Error State:', error); // Log del estado final
    }
  }, [flowId, user?.id, onFlowLoaded, onError, toast]);
  
  // Cargar flujo inicial y establecer suscripciones
  useEffect(() => {
    // Wait for Clerk to be loaded, user to be signed in, and essential IDs to be present
    if (!isLoaded || !isSignedIn || !supabaseRef.current || !flowId || !user?.id) {





      // If Clerk is loaded but user is not signed in, and we are not already in an error state, set an error.
      if (isLoaded && !isSignedIn && !error) {
        const authError = new Error('Autenticación requerida. Por favor, inicia sesión para acceder al flujo.');
        setError(authError);
        if (onError) onError(authError);
        setIsLoading(false); // No longer loading if auth fails
      }
      return;
    }
    

    loadFlow();
    
    // Logs de depuración antes de la suscripción



    

    
    channelRef.current = supabaseRef.current
      .channel(`flow-${flowId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'flows', 
          filter: `id=eq.${flowId}` 
        },
        (payload: any) => {
          console.log('[Realtime] Evento recibido:', payload); // <-- LOG 1
          handleRemoteChanges(payload.new);
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flow_collaborators',
          filter: `flow_id=eq.${flowId}`
        },
        () => {
          // Recargar colaboradores cuando cambia la lista
          loadCollaborators();
        }
      )
      .on('postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'flow_collaborators_presence',
          filter: `flow_id=eq.${flowId}`
        },
        (payload: any) => {

          const fetchAndUpdateRemoteCursors = async () => {
            if (!supabaseRef.current || !user?.id) return;
            const { data, error } = await supabaseRef.current
              .from('flow_collaborators_presence')
              .select('user_id, display_name, avatar_url, cursor_position')
              .eq('flow_id', flowId)
              .neq('user_id', user.id);

            if (error) {

              return;
            }

            if (data) {
              const presenceRecords = data as PresenceRecord[]; 
              const updatedCursors = presenceRecords
                .filter((p: PresenceRecord) => p.cursor_position) 
                .map((p: PresenceRecord) => ({
                  userId: p.user_id,
                  displayName: p.display_name,
                  avatarUrl: p.avatar_url,
                  position: p.cursor_position!, 
                }));
              setRemoteCursors(updatedCursors);

            }
          };
          fetchAndUpdateRemoteCursors();
          loadCollaborators(); 
        }
      )
      .subscribe((status: string, err?: any) => {
        if (status === 'SUBSCRIBED') {

        } else if (status === 'CHANNEL_ERROR') {

        } else if (status === 'TIMED_OUT') {

        } else {

        }
      });
    
    return () => {
      if (channelRef.current) {

        channelRef.current.unsubscribe();
      }
    };
  }, [flowId, user?.id, loadFlow, supabaseRef, isLoaded, isSignedIn, onError, error]);
  
  // Manejar cambios remotos SOLO con Zustand
  const handleRemoteChanges = useCallback((newData: any) => {

    if (!newData) {

      return;
    }


    let changed = false;
    
    if (newData.nodes) {
      // Forzar nueva referencia
      zustandSetNodes([...(newData.nodes || [])]);

      changed = true;
    }
    if (newData.edges) {
      // Forzar nueva referencia
      zustandSetEdges([...(newData.edges || [])]);

      changed = true;
    }
    if (newData.name && newData.name !== flowName) {
      setFlowName(newData.name);
      if (zustandSetCurrentFlowMetadata) zustandSetCurrentFlowMetadata({ name: newData.name });
      const zustandName = useFlowStore.getState().currentFlowName;

      changed = true;
    }
    if (newData.description !== undefined && newData.description !== flowDescription) {
      setFlowDescription(newData.description);
      if (zustandSetCurrentFlowMetadata) zustandSetCurrentFlowMetadata({ description: newData.description });
      const zustandDesc = useFlowStore.getState().currentFlowDescription;

      changed = true;
    }
    if (newData.updated_at) {
      setLastSaved(new Date(newData.updated_at));
    }
    if (changed) {
    toast({
      title: 'Flujo actualizado',
      description: `${newData.last_updated_name || 'Otro usuario'} ha realizado cambios`,
    });
    }
    if (onRemoteChanges && (newData.nodes || newData.edges)) {
      onRemoteChanges({ nodes: newData.nodes ? [] : undefined, edges: newData.edges ? [] : undefined });
    }
  }, [onRemoteChanges, flowName, flowDescription, toast, user?.id, lastLocalChangeRef, zustandSetNodes, zustandSetEdges, zustandSetCurrentFlowMetadata]);
  
  // Cargar colaboradores
  const loadCollaborators = useCallback(async () => {
    if (!supabaseRef.current || !flowId) return;
    
    try {
      const { data, error } = await supabaseRef.current
        .rpc('get_flow_collaborators', { flow_id_param: flowId });
      
      if (error) {
        throw new Error('Error cargando colaboradores');
      }
      
      setCollaborators(data || []);
    } catch (err) {

    }
  }, [flowId]);
  
  // Función para guardar cambios locales (con debounce)
  const saveChanges = useDebouncedCallback(
    async (changeData: { nodes?: Node[]; edges?: Edge[]; name?: string; description?: string }) => {
      if (!supabaseRef.current || !flowId || !user || !isEditableRef.current) return;
      
      setIsSaving(true);
      
      try {
        // 1. Cargar la versión más reciente del servidor para comparar timestamps

        const { data: serverFlowData, error: serverFlowError } = await supabaseRef.current
          .from('flows')
          .select('updated_at') // Solo necesitamos el timestamp para la verificación inicial
          .eq('id', flowId)
          .maybeSingle();

        if (serverFlowError) {

          toast({
            title: 'Error de Sincronización',
            description: 'No se pudo verificar el estado del flujo en el servidor. Intenta de nuevo.',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }

        if (serverFlowData && lastSaved) {
          const serverTimestamp = new Date(serverFlowData.updated_at).getTime();
          const localTimestamp = lastSaved.getTime();

          if (serverTimestamp > localTimestamp) {

            toast({
              title: 'Conflicto al Guardar',
              description: 'El flujo ha sido actualizado por otro usuario. Se cargarán los cambios más recientes.',
              variant: 'destructive',
              duration: 7000,
            });
            setIsSaving(false);
            await loadFlow(); // Cargar los datos frescos del servidor y actualizar el estado
            // Esto refrescará el canvas del usuario con la última versión.
            // Los cambios locales no guardados se perderán, el usuario deberá re-aplicarlos si es necesario.
            return;
          }
        }
        
        // 2. Si no hay conflicto, proceder a guardar los cambios locales

        const changeId = nanoid();
        lastLocalChangeRef.current = changeId;
        
        const updateData: any = {
          change_id: changeId,
          last_updated_by: user.id,
        };
        
        if (changeData.nodes !== undefined) updateData.nodes = changeData.nodes;
        if (changeData.edges !== undefined) updateData.edges = changeData.edges;
        if (changeData.name !== undefined) updateData.name = changeData.name;
        if (changeData.description !== undefined) updateData.description = changeData.description;
        


        const { error: saveError } = await supabaseRef.current
          .from('flows')
          .update(updateData)
          .eq('id', flowId);
        
        if (saveError) {

          throw new Error('Error guardando cambios en el servidor.');
        }
        
        const newLastSavedDate = new Date();
        setLastSaved(newLastSavedDate);

        
        toast({ 
          title: 'Flujo Guardado',
          description: 'Tus cambios han sido guardados en el servidor.',
          variant: 'default' 
        });

      } catch (err: any) {

        toast({
          title: 'Error al Guardar',
          description: err.message || 'Ocurrió un error al intentar guardar los cambios.',
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    },
    debounceTime || 500
  );
  
  // Manejadores de cambios usando Zustand
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!isEditableRef.current) return;
      const updatedNodes = applyNodeChanges(changes, useFlowStore.getState().nodes);
      zustandSetNodes(updatedNodes);
        // Solo guardar si no es un cambio de selección
        const nonSelectionChanges = changes.filter(change => change.type !== 'select');
        if (nonSelectionChanges.length > 0) {
          saveChanges({ nodes: updatedNodes });
        }
    },
    [saveChanges, zustandSetNodes]
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!isEditableRef.current) return;
      const updatedEdges = applyEdgeChanges(changes, useFlowStore.getState().edges);
      zustandSetEdges(updatedEdges);
        const nonSelectionChanges = changes.filter(change => change.type !== 'select');
        if (nonSelectionChanges.length > 0) {
          saveChanges({ edges: updatedEdges });
        }
    },
    [saveChanges, zustandSetEdges]
  );
  
  const onConnect = useCallback(
    (connection: any) => {
      if (!isEditableRef.current) return;
        const newEdge = {
          id: `edge-${nanoid()}`,
          ...connection,
        };
      const newEdges = [...useFlowStore.getState().edges, newEdge];
      zustandSetEdges(newEdges);
        saveChanges({ edges: newEdges });
    },
    [saveChanges, zustandSetEdges]
  );
  
  // Función para actualizar un nodo
  const updateNode = useCallback(
    (nodeId: string, data: any) => {
      if (!isEditableRef.current) return;
      const updatedNodes = useFlowStore.getState().nodes.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
        );
      zustandSetNodes(updatedNodes);
        saveChanges({ nodes: updatedNodes });
    },
    [saveChanges, zustandSetNodes]
  );
  
  // Función para actualizar nombre/descripción del flujo
  const updateFlowInfo = useCallback(
    (info: { name?: string; description?: string }) => {
      if (!isEditableRef.current) return;
      if (info.name !== undefined) {
        setFlowName(info.name);
        if (zustandSetCurrentFlowMetadata) zustandSetCurrentFlowMetadata({ name: info.name });
      }
      if (info.description !== undefined) {
        setFlowDescription(info.description);
        if (zustandSetCurrentFlowMetadata) zustandSetCurrentFlowMetadata({ description: info.description });
      }
      saveChanges(info);
    },
    [saveChanges, zustandSetCurrentFlowMetadata]
  );
  
  // Función para añadir un nuevo nodo
  const addNode = useCallback(
    (nodeData: Partial<Node>) => {
      if (!isEditableRef.current) return;
      const newNode: Node = {
        id: `node-${nanoid()}`,
        position: nodeData.position || { x: 100, y: 100 },
        data: nodeData.data || {},
        type: nodeData.type || 'default',
        ...nodeData
      };
      const updatedNodes = [...useFlowStore.getState().nodes, newNode];
      zustandSetNodes(updatedNodes);
        saveChanges({ nodes: updatedNodes });
      return newNode;
    },
    [saveChanges, zustandSetNodes]
  );
  
  // Función para eliminar nodos
  const removeNodes = useCallback(
    (nodeIds: string[]) => {
      if (!isEditableRef.current) return;
      const updatedNodes = useFlowStore.getState().nodes.filter(node => !nodeIds.includes(node.id));
      zustandSetNodes(updatedNodes);
        saveChanges({ nodes: updatedNodes });
      // También eliminar las aristas conectadas a estos nodos
      const updatedEdges = useFlowStore.getState().edges.filter(
          edge => 
            !nodeIds.includes(edge.source) && 
            !nodeIds.includes(edge.target)
        );
      zustandSetEdges(updatedEdges);
        saveChanges({ edges: updatedEdges });
    },
    [saveChanges, zustandSetNodes, zustandSetEdges]
  );
  
  // Retornar los valores y funciones necesarios
  return {
    // Estado
    nodes,
    edges,
    flowName,
    flowDescription,
    isLoading,
    error,
    isSaving,
    lastSaved,
    collaborators,
    isEditable: isEditableRef.current,
    
    // Funciones para ReactFlow
    onNodesChange,
    onEdgesChange,
    onConnect,
    
    // Funciones adicionales
    updateNode,
    updateFlowInfo,
    addNode,
    removeNodes,
    reload: loadFlow,
    updateCursorPosition,
    remoteCursors,
  };
}