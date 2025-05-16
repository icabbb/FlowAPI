import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { createUserSlice, UserSlice } from './slices/userSlice';
import { createNodesSlice, NodesSlice } from './slices/nodesSlice';
import { createEdgesSlice, EdgesSlice } from './slices/edgesSlice';
import { createExecutionSlice, ExecutionSlice } from './slices/executionSlice';
import { createEnvSlice, EnvironmentSlice } from './slices/environmentSlice';
import { createFlowCrudSlice, FlowCrudSlice } from './slices/flowCrudSlice';
import { createInvitationsSlice, InvitationsSlice } from './slices/invitationsSlice';

export type FlowStore = UserSlice &
                        NodesSlice &
                        EdgesSlice &
                        ExecutionSlice &
                        EnvironmentSlice &
                        FlowCrudSlice &
                        InvitationsSlice;

export const useFlowStore = create<FlowStore>()(
  persist(
    (...a) => ({
      ...createUserSlice (...a),
      ...createNodesSlice(...a),
      ...createEdgesSlice(...a),
      ...createExecutionSlice(...a),
      ...createEnvSlice   (...a),
      ...createFlowCrudSlice(...a),
      ...createInvitationsSlice(...a),
    }),
    {
      name: 'flow-storage-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userId: state.userId,
        selectedEnvironmentId: state.selectedEnvironmentId,
        currentFlowId: state.currentFlowId,
      }),
    },
  ),
);
