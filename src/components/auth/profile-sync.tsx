'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

/**
 * Componente que sincroniza el perfil del usuario con Supabase cuando inicia sesión
 * Este componente debe ser incluido en un layout que se renderiza en cada página autenticada
 */
export function ProfileSync() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    // Solo sincronizar cuando el usuario esté autenticado
    if (isLoaded && isSignedIn) {
      const syncProfile = async () => {
        try {
          const response = await fetch('/api/auth/sync-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const error = await response.json();

          }
        } catch (error) {

        }
      };

      syncProfile();
    }
  }, [isSignedIn, isLoaded]);

  // Este componente no renderiza nada visible
  return null;
}
