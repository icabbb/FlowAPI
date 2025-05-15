'use client';;
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createActionClient } from '@/store/utils/supabase';

export function useSyncPendingInvitations() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Si no está cargado o no hay usuario o no hay email, no hacer nada
    if (
      !isLoaded ||
      !user ||
      !user.primaryEmailAddress ||
      !user.primaryEmailAddress.emailAddress
    ) {

        return;   
    }


    const sync = async () => {
      const supabase = createActionClient();
      const { error, data } = await supabase.rpc('accept_pending_flow_invitations_for_email', {
        user_email: user.primaryEmailAddress!.emailAddress,
        new_user_id: user.id,
      });
      
      if (error) {

      } else {

      }
    };
    sync();
  }, [user, isLoaded]);
}
