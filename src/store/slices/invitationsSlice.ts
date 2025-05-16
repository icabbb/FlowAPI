import { StateCreator } from 'zustand';

export interface InvitationsSlice {
  pendingInvitationsCount: number;
  setPendingInvitationsCount: (count: number) => void;
  fetchPendingInvitationsCount: () => Promise<void>; 
}

export const createInvitationsSlice: StateCreator<
  any, 
  [],
  [],
  InvitationsSlice
> = (set, get) => ({
  pendingInvitationsCount: 0,
  setPendingInvitationsCount: (count) => set({ pendingInvitationsCount: count }),
  fetchPendingInvitationsCount: async () => {
    // @ts-ignore
    const { userId } = get(); 
    if (!userId) {
      set({ pendingInvitationsCount: 0 });
      return;
    }

    const { createActionClient } = await import('../utils/supabase');
    const supabase = createActionClient();

    try {
      const { data, error } = await supabase.rpc(
        'get_user_collaborations_with_details'
      );

      if (error) {
        console.error('Error fetching collaborations:', error);
        set({ pendingInvitationsCount: 0 });
        return;
      }

      if (data) {
        const pendingCount = data.filter(
          (collab: any) => collab.status === 'pending' && collab.collaborator_user_id !== userId 
        ).length;
        set({ pendingInvitationsCount: pendingCount });
      } else {
        set({ pendingInvitationsCount: 0 });
      }
    } catch (e: any) {
      console.error('Error in fetchPendingInvitationsCount:', e);
      set({ pendingInvitationsCount: 0 });
    }
  },
}); 