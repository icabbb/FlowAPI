'use client';
import { useEffect } from 'react';
import { useSession } from '@clerk/nextjs';
import { setClerkSession } from '@/store/utils/supabase';

/**
 * AuthSync component synchronizes the Clerk session with the global `clerkSession` 
 * variable used by the Supabase client factory.
 * This ensures that the Supabase client always has access to the latest session token.
 */
export function AuthSync() {
  const { session, isLoaded } = useSession();

  useEffect(() => {

    if (isLoaded) {
      setClerkSession(session ?? null);
      if (session) {

      } else {

      }
    }
  }, [isLoaded, session]); // Re-run when isLoaded or the entire session object changes

  return null; // This component does not render anything
} 