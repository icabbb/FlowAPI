'use client';

import { useEffect } from 'react';
import { useAuth, useSession } from '@clerk/nextjs';
import { useFlowStore } from '../index';
import { setClerkSession } from '../utils/supabase';

export const useInitializeFlowStore = () => {
  const { userId } = useAuth();
  const { session, isLoaded } = useSession();

  const setUserId = useFlowStore(s => s.setUserId);
  const loadFlows = useFlowStore(s => s.loadSavedFlows);
  const loadEnvs = useFlowStore(s => s.loadEnvironments);
  const loadFlow = useFlowStore(s => s.loadFlow);

  useEffect(() => {
    setClerkSession(session ?? null);          

    (async () => {
      const { userId: currentStoreUserId, currentFlowId: rehydratedFlowId } = useFlowStore.getState();

      if (isLoaded && userId && userId !== currentStoreUserId) {
        (`[Store Init] User changed/loaded: ${userId}. Rehydrated flow ID: ${rehydratedFlowId}`);
        setUserId(userId);
        await loadFlows(); 
        await loadEnvs();

        const { savedFlows } = useFlowStore.getState();

        if (rehydratedFlowId && savedFlows.some(f => f.id === rehydratedFlowId)) {
          (`[Store Init] Loading restored flow ID: ${rehydratedFlowId}`);
          await loadFlow(rehydratedFlowId);
        } else if (savedFlows.length > 0) {
          const mostRecentFlowId = savedFlows[0].id;
          (`[Store Init] No valid restored flow ID. Loading most recent: ${mostRecentFlowId}`);
          await loadFlow(mostRecentFlowId);
        } else {
          (`[Store Init] No restored flow ID and no saved flows. Ensuring clear canvas.`);
          useFlowStore.getState().clearCanvas();
        }

      } else if (isLoaded && !userId && currentStoreUserId) {
        ('[Store Init] User logged out. Clearing data.');
        setUserId(null); 
        useFlowStore.getState().clearCanvas();
      }
    })();
  }, [isLoaded, userId, session, setUserId, loadFlows, loadEnvs, loadFlow]);
};
