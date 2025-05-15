import {
  Node, NodeChange, applyNodeChanges,
  type OnNodesChange,
} from '@xyflow/react';
import { StateCreator } from 'zustand';
import type { FlowStore } from '../index';
  
  export interface NodesSlice {
    nodes: Node[];
    selectedNodeId: string | null;
  
    onNodesChange: OnNodesChange;
    updateNodeData(nodeId: string, data: object): void;
    addNode(node: Node): void;
    setSelectedNodeId(nodeId: string | null): void;
    setNodes(nodes: Node[]): void;
  }
  
  export const createNodesSlice: StateCreator<
    FlowStore, [], [], NodesSlice
  > = (set, get) => ({
    nodes: [],
    selectedNodeId: null,
  
    onNodesChange: (changes: NodeChange[]) => {
      if (changes.length > 0) {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
        get().setDirty(true);
  
        const deleted = changes
          .filter(c => c.type === 'remove')
          .map(c => c.id);
  
        if (deleted.includes(get().selectedNodeId ?? ''))
          get().setSelectedNodeId(null);
      }
    },
  
    updateNodeData(nodeId, data) {
      const toReset = Object.keys(data).length !== 1 || !('width' in data);
  
      set({
        nodes: get().nodes.map((n: Node) => 
          n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
        ),
      });
      get().setDirty(true);
  
      if (toReset) get().setNodeResult(nodeId, { status: 'idle' });
    },
  
    addNode(node) { 
      set({ nodes: [...get().nodes, node] }); 
      get().setDirty(true);
    },
  
    setSelectedNodeId(id) { set({ selectedNodeId: id }); },
  
    setNodes: (nodes) => set({ nodes, isDirty: true }),
  });
  