'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { createActionClient } from '@/store/utils/supabase';
import { useToast } from '@/components/ui/use-toast';

/**
 * Este componente maneja las invitaciones a colaborar en flujos.
 * Se debe incluir en el layout principal para procesar los tokens automáticamente.
 */
export function InvitationHandler() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Solo procesar cuando el usuario esté autenticado y los parámetros cargados
    if (!isLoaded || !isSignedIn || !user || processing) return;

    const inviteToken = searchParams.get('invite_token');
    const flowId = searchParams.get('flow_id');
    const flowSlug = searchParams.get('flow_slug');

    // Si tenemos un token de invitación y un ID de flujo, procesamos la invitación
    if (inviteToken && flowId) {
      const processInvitation = async () => {
        setProcessing(true);
        
        try {
          (`Procesando invitación: token=${inviteToken}, flowId=${flowId}`);
          
          const supabase = createActionClient();
          
          // Verificar si el usuario tiene un perfil en Supabase
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('id', user.id)
            .maybeSingle();
            
          if (profileError) {

            toast({
              title: 'Error de sincronización',
              description: 'No pudimos verificar tu perfil. Por favor, intenta más tarde.',
              variant: 'destructive',
            });
            return;
          }
          
          if (!profileData) {
            ('El perfil aún no existe, sincronizando...');
            // Sincronizar el perfil primero
            await fetch('/api/auth/sync-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
          }
          
          // Actualizar la invitación con el ID del usuario
          const { data: inviteData, error: inviteError } = await supabase.rpc(
            'accept_flow_invitation',
            {
              invite_token_param: inviteToken,
              flow_id_param: flowId
            }
          );
          
          if (inviteError) {

            toast({
              title: 'Error al procesar invitación',
              description: inviteError.message || 'Ocurrió un error al procesar la invitación.',
              variant: 'destructive',
            });
            return;
          }
          
          toast({
            title: 'Invitación aceptada',
            description: 'Has sido añadido como colaborador del flujo.',
          });
          
          // Redirigir al flujo
          if (flowSlug) {
            router.push(`/flow/s/${flowSlug}`);
          } else {
            router.push(`/flow/${flowId}`);
          }
          
          // Limpiar la URL para no procesar la invitación de nuevo
          window.history.replaceState({}, '', '/dashboard');
          
        } catch (error: any) {

          toast({
            title: 'Error',
            description: error.message || 'Ocurrió un error al procesar la invitación.',
            variant: 'destructive',
          });
        } finally {
          setProcessing(false);
        }
      };
      
      processInvitation();
    }
  }, [isLoaded, isSignedIn, user, searchParams, router, toast, processing]);
  
  // Este componente no renderiza nada visual
  return null;
} 