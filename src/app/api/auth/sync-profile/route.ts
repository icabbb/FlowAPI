import { NextResponse } from 'next/server';
import { syncUserProfile } from '@/services/profile/sync-profile';

/**
 * Endpoint para sincronizar perfiles de usuario
 * Este endpoint debe ser llamado después de que un usuario inicie sesión o actualice su perfil
 * Se puede llamar desde el frontend mediante un hook useEffect o mediante webhooks de Clerk
 */
export async function POST() {
  try {
    const profile = await syncUserProfile();
    return NextResponse.json({ success: true, profile });
  } catch (error: any) { 
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to sync profile'
      },
      { status: 500 }
    );
  }
} 