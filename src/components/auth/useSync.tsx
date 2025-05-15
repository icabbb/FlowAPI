'use client';
import { useSyncPendingInvitations } from '@/components/auth/syncInvitation';

export function SyncInvitationsClient() {
  useSyncPendingInvitations();
  ('[SyncInvitationsClient] Rendering');
  return null; // No renderiza nada
}
