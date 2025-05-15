import {
  Edge, EdgeChange, applyEdgeChanges,
  addEdge, type OnEdgesChange, type OnConnect, Connection
} from '@xyflow/react';
import { StateCreator } from 'zustand';
import type { FlowStore } from '../index';
  
  export interface EdgesSlice {
    edges: Edge[];
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addEdge(edge: Edge): void;
    setEdgeStatus(edgeId: string,
                  status: 'success' | 'error' | 'loading' | 'idle'): void;
    setEdgeData(edgeId: string, data: any): void;
    setEdgeType(edgeId: string, type: string): void;
    setEdges(edges: Edge[]): void;
  }
  
  export const createEdgesSlice: StateCreator<
    FlowStore, [], [], EdgesSlice
  > = (set, get) => ({
    edges: [],
  
    onEdgesChange: (c: EdgeChange[]) => {
      if (c.length > 0) {
        set({ edges: applyEdgeChanges(c, get().edges) });
        get().setDirty(true);
      }
    },
  
    onConnect: (conn: Connection) => {
      const edge: Edge = {
        ...conn,
        id: crypto.randomUUID(),
        type: 'animated',
        data: { label: '' },
      };
      set({ edges: addEdge(edge, get().edges) });
      get().setDirty(true);
    },
  
    addEdge: (edge: Edge) => {
      set({ edges: [...get().edges, edge] });
      get().setDirty(true);
    },
  
    setEdgeStatus: (id: string, status: string) =>
      set({
        edges: get().edges.map((e: Edge) =>
          e.id === id ? { ...e, data: { ...(e.data || {}), status } } : e,
        ),
      }),
  
    setEdgeData: (id: string, data: any) => 
      set({
        edges: get().edges.map((e: Edge) => 
          e.id === id ? { ...e, data: { ...(e.data || {}), ...data } } : e
        ),
      }),
  
    setEdgeType: (id: string, type: string) => 
      set({
        edges: get().edges.map((e: Edge) => 
          e.id === id ? { ...e, type } : e
        ),
      }),
  
    setEdges: (edges) => set({ edges, isDirty: true }),
  });
  