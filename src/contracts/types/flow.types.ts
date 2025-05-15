import type { Node, Edge } from '@xyflow/react';


export interface SavedFlow {
  id: string;         // uuid in DB
  user_id: string;    // text in DB
  name: string;       // text in DB
  description?: string | null; // text in DB (nullable)
  collections?: string | null; // text in DB (nullable) - Assuming single collection ID for now
  nodes: Node[];      // jsonb in DB
  edges: Edge[];      // jsonb in DB
  created_at: string; // timestamptz in DB
  updated_at: string; // timestamptz in DB
  share_id?: string | null; // uuid in DB (nullable) - Unique ID for public sharing
}


export type FlowSaveData = Pick<SavedFlow, 'name' | 'nodes' | 'edges'> & { 
  description?: string | null; 
  collections?: string | null;
  id?: string; // Optional ID for updates
  share_id?: string | null; // Optional sharing ID
};

// Public shared flow interface
export interface PublicFlowShare {
  id: string;         // uuid in DB (primary key)
  flow_id: string;    // uuid in DB (references flows.id)
  created_at: string; // timestamptz in DB
  expires_at?: string | null; // timestamptz in DB (nullable) - When the share expires
  is_active: boolean; // boolean in DB - Whether the share is active
  access_count: number; // integer in DB - Number of times the flow has been accessed
  last_accessed?: string | null; // timestamptz in DB (nullable) - When the flow was last accessed
}

// Data needed to create a new public share
export type PublicShareData = {
  flow_id: string;
  expires_at?: string | null;
};

export interface NodeResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: any;
  error?: string | null;
  timestamp?: number;
  statusCode?: number | null;
  headers?: Record<string, string> | null;
  // Added for VariableSetNode interaction
  saveToEnvironment?: {
    variableName: string;
    value: any;
    isSecret: boolean;
  } | null;
}

// Interfaz para mostrar flujos en la biblioteca
export interface PublicFlowListItem {
  share_id: string;      // ID del registro en public_flow_shares
  flow_id: string;       // ID del flujo original en la tabla flows
  flow_name: string;     // Nombre del flujo
  flow_description?: string | null; // Descripción del flujo (opcional)
  shared_at: string;     // created_at de public_flow_shares
  access_count: number;  // Número de accesos al flujo
  author_display_name?: string | null; // Nombre del autor (obtenido de profiles)
  avatar_url?: string | null; // URL de la imagen de perfil del autor
  user_id?: string;      // ID del usuario que creó el flujo
} 