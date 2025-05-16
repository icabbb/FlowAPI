'use client';;
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createActionClient } from '@/store/utils/supabase';
import { useFlowStore } from '@/store';

export function useSyncPendingInvitations() {
  const { user, isLoaded } = useUser();
  const fetchPendingInvitationsCount = useFlowStore((state) => state.fetchPendingInvitationsCount);

  useEffect(() => {
    if (!isLoaded || !user || !user.primaryEmailAddress?.emailAddress) {
      return;
    }

    const syncAndFetch = async () => {
      const supabase = createActionClient();
      try {
        const { error: acceptError } = await supabase.rpc('accept_pending_flow_invitations_for_email', {
          user_email: user.primaryEmailAddress!.emailAddress,
          new_user_id: user.id,
        });
        if (acceptError) {
          console.warn('[SyncInvitations] Error auto-accepting invitations:', acceptError.message);
        }
      } catch (e:any) {
        console.error('[SyncInvitations] Exception during auto-accept:', e.message);
      }

      try {
        await fetchPendingInvitationsCount();
      } catch (e:any) {
        console.error('[SyncInvitations] Exception fetching pending count:', e.message);
      }
    };

    syncAndFetch();
  }, [user, isLoaded, fetchPendingInvitationsCount]);
}
