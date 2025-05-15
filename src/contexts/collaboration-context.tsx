import { createContext, useContext } from 'react';

// Definición de la estructura de un cursor remoto
export interface RemoteCursorData {
  userId: string;
  displayName?: string | null; // Puede ser null desde la DB
  avatarUrl?: string | null;   // Puede ser null desde la DB
  position: { x: number; y: number };
  // Podríamos añadir un timestamp de la última actualización si es necesario para timeouts
}

// Define la forma de los datos que el contexto proveerá
interface CollaborationContextType {
  updateCursorPosition?: (position: { x: number; y: number } | null) => void;
  remoteCursors?: RemoteCursorData[]; // Array de cursores remotos
  // Aquí podríamos añadir más funciones o datos de colaboración en el futuro
}

// Crea el Context con un valor inicial undefined
const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

/**
 * Hook personalizado para usar el CollaborationContext.
 * Proporciona una forma fácil de acceder a las funciones de colaboración.
 */
export const useCollaborationContext = () => {
  const context = useContext(CollaborationContext);
  // Si quisieras que el contexto fuera obligatorio, podrías lanzar un error aquí:
  // if (context === undefined) {
  //   throw new Error('useCollaborationContext must be used within a CollaborationProvider');
  // }
  return context; // Puede ser undefined si se usa fuera del provider y no es obligatorio
};

// Exporta el Provider para envolver los componentes que necesitan acceso al contexto
export const CollaborationProvider = CollaborationContext.Provider; 