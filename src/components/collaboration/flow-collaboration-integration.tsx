'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useToast } from '@/components/ui/use-toast';
import { useFlowStore } from '@/store';
import { CommentSystem } from '@/components/collaboration/comment-system';
import { useTheme } from 'next-themes';
import { CollaborationManager } from '@/components/collaboration/collaboration-manager';
import { PresenceIndicator } from '@/components/collaboration/presence-indicator';
import { createActionClient } from '@/store/utils/supabase';

// Este componente se coloca en el layout principal para añadir funcionalidades
// de colaboración sin modificar el flujo principal de la aplicación

interface FlowCollaborationIntegrationProps {
  flowId?: string;
}

export function FlowCollaborationIntegration({ flowId }: FlowCollaborationIntegrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [flowName, setFlowName] = useState<string>('Flujo');
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isOwner, setIsOwner] = useState(false);
  const [hasCollaborativeAccess, setHasCollaborativeAccess] = useState(false);
  const [permission, setPermission] = useState<'view' | 'comment' | 'edit'>('view');
  
  const { user } = useUser();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedNodeId } = useFlowStore();
  
  // Solo mostrar si hay un flowId válido
  useEffect(() => {
    if (!flowId) {
      setIsVisible(false);
      setHasCollaborativeAccess(false);
      return;
    }
    
    // Verificar si el usuario tiene acceso al flujo de forma colaborativa
    const checkCollaborativeAccess = async () => {
      if (!user || !flowId) return;
      
      try {
        const supabase = createActionClient();
        
        const { data: flowData, error: flowError } = await supabase
          .from('flows')
          .select('user_id, name')
          .eq('id', flowId)
          .single();
        
        if (flowError) {

          setIsVisible(false);
          setHasCollaborativeAccess(false);
          return;
        }
        
        setFlowName(flowData.name || 'Flujo');
        const isCurrentUserOwner = flowData.user_id === user.id;
        setIsOwner(isCurrentUserOwner);
        
        if (isCurrentUserOwner) {
          setHasCollaborativeAccess(true);
          setPermission('edit');
          setIsVisible(true);
          return;
        }
        
        // If not owner, check for any collaboration entry (pending, accepted, etc.)
        // to allow them to see the collaboration dialog
        const { data: collaboratorData, error: collaboratorError } = await supabase
          .from('flow_collaborations')
          .select('permission_level, status')
          .eq('flow_id', flowId)
          .eq('collaborator_user_id', user.id)
          .maybeSingle();
        
        if (collaboratorError && collaboratorError.code !== 'PGRST116') {

          setIsVisible(false);
          setHasCollaborativeAccess(false);
          return;
        }
        
        if (collaboratorData) {
          // User has a collaboration entry (could be pending, accepted, or declined)
          // They should be able to see the collaboration dialog.
          // Actual content access permission is determined by 'status' and 'permission_level'.
          setHasCollaborativeAccess(true); 
          // Set permission based on accepted status, default to 'view' if pending/declined for content access
          if (collaboratorData.status === 'accepted') {
            setPermission(collaboratorData.permission_level as 'view' | 'edit');
          } else {
            setPermission('view'); // Or handle no direct flow content access until accepted
          }
          setIsVisible(true);
        } else {
          // No ownership, no collaboration record at all
          setHasCollaborativeAccess(false);
          setIsVisible(false);
          // Optionally, you could show a message like "You have not been invited to this flow."
          // or redirect if they landed here via a direct link without an invitation.
        }
      } catch (error) {

        setIsVisible(false);
        setHasCollaborativeAccess(false);
      }
    };
    
    checkCollaborativeAccess();
  }, [flowId, user]);
  
  // Actualizamos la posición para el componente de comentarios cuando cambia el nodo seleccionado
  useEffect(() => {
    if (selectedNodeId) {
      const selectedNode = useFlowStore.getState().nodes.find(node => node.id === selectedNodeId);
      if (selectedNode) {
        setPosition({
          x: selectedNode.position.x,
          y: selectedNode.position.y
        });
      }
    } else {
      // Si no hay nodo seleccionado, usar una posición central
      setPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
  }, [selectedNodeId]);
  
  // No renderizar nada si no hay flowId o no tiene acceso colaborativo
  if (!flowId) {
    return null;
  }
  
  return (
    <>
      {/* PresenceIndicator can be shown if user has any kind of access */}
      {isVisible && hasCollaborativeAccess && <PresenceIndicator flowId={flowId} />}
      
      {/* CollaborationManager button: show if user is owner OR has any collaboration record (even pending) */}
      {isVisible && hasCollaborativeAccess && (
        <div className="fixed bottom-4 right-4 z-50">
          <CollaborationManager flowId={flowId} flowName={flowName} />
        </div>
      )}
      
      {/* Comment System: Only if accepted and has appropriate permission */}
      {isVisible && hasCollaborativeAccess && permission !== 'view' && selectedNodeId && (
        <div className="absolute inset-0 pointer-events-none z-40">
          <CommentSystem
            flowId={flowId}
            position={position}
            permission={permission}
          />
        </div>
      )}
    </>
  );
} 