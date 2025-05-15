// app/(flow)/session-sync.tsx
'use client';

import { useEffect } from 'react';
import { useSession } from '@clerk/nextjs';
import { setClerkSession } from '@/store/utils/supabase';

/** Mantiene el JWT de Clerk en Supabase */
export default function SessionSync() {
  const { session } = useSession();          // null si no hay login

  useEffect(() => {
    if (session) {
      setClerkSession(session);
    }
  }, [session]);

  return null;                               // no renderiza nada
}
