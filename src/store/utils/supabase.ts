import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**  Mínimo requerido para Clerk  */
export type ClerkSession = {
  getToken: (opts?: { template?: string }) => Promise<string | null>;
};

export let clerkSession: ClerkSession | null = null;
export const setClerkSession = (s: ClerkSession | null) => { clerkSession = s; };

/**
 *  Crea un cliente autenticado "al vuelo".
 *  Se llama dentro de las acciones (slices) cada vez que se necesita
 *  interactuar con la base de datos.
 */
export const createActionClient = (): SupabaseClient =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
      async accessToken() {
        // Si configuraste un JWT Template en Clerk, pásalo aquí:
        // return clerkSession?.getToken({ template: 'supabase' }) ?? null;
        return clerkSession?.getToken() ?? null;
      },
    },
  );
