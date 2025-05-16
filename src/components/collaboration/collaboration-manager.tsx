'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Check,
    Copy,
    Link2,
    Loader2,
    Mail,
    Share2,
    Shield,
    Trash2,
    Users,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { createActionClient } from '@/store/utils/supabase';
import { useFlowStore } from '@/store';

/* -------------------------------------------------------------------------- */
/*                                   types                                    */
/* -------------------------------------------------------------------------- */
type PermissionLevel = 'view' | 'edit';
type CollaborationStatus = 'pending' | 'accepted' | 'declined';

interface Collaborator {
  collaboration_id: string;
  user_id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  permission_level: PermissionLevel;
  status: CollaborationStatus;
  invited_at: string;
}

interface CollaborationManagerProps {
  flowId: string;
  flowName: string;
}

/* -------------------------------------------------------------------------- */
/*                          CollaborationManager UI                           */
/* -------------------------------------------------------------------------- */
export function CollaborationManager({ flowId, flowName }: CollaborationManagerProps) {


  /* ------------------------------- state --------------------------------- */
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('collaborators');
  const [email, setEmail] = useState('');
  const [permission] = useState<PermissionLevel>('edit');
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [shareUrl, setShareUrl] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const [slugLoading, setSlugLoading] = useState(false);

  /* ------------------------------- hooks --------------------------------- */
  const { user } = useUser();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const cartoonShadow = isDark
    ? 'shadow-[4px_4px_0px_#172554]'
    : 'shadow-[4px_4px_0px_#0f172a]';

  const { getToken } = useAuth();
  const supabase = useMemo(() => createActionClient(), []);
  const currentFlowSlug = useFlowStore((state) => state.currentFlowSlug);

  /* ----------------------------- ownership ------------------------------- */
  useEffect(() => {
    if (!flowId || !user) return;

    const checkOwnership = async () => {

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('flows')
          .select('user_id')
          .eq('id', flowId)
          .maybeSingle();

        if (error) throw error;
        if (!data) return setIsOwner(false);

        setIsOwner(data.user_id === user.id);
      } catch (err: any) {

        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        });
        setIsOwner(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOwnership();
  }, [flowId, user, supabase, toast]);

  /* ---------------------------- collaborators ---------------------------- */
  const loadCollaborators = async () => {
    if (!flowId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_flow_collaborators_with_details', {
        flow_id_param: flowId,
      });
      if (error) throw error;
      setCollaborators((data || []) as Collaborator[]);
    } catch (err: any) {

      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadCollaborators();
  }, [isOpen, flowId]);

  /* ---------------------------- share URL ---------------------------- */
  useEffect(() => {
    if (flowId) {
      if (currentFlowSlug) {
        setShareUrl(`${window.location.origin}/flow/s/${currentFlowSlug}`);
      } else {
        setShareUrl(`${window.location.origin}/flow/${flowId}`);
      }
    }
  }, [flowId, currentFlowSlug]);

  /* ------------------------------- actions ------------------------------- */
  const inviteCollaborator = async () => {
    if (!email.trim() || !isOwner || !user) return;
    setIsLoading(true);
    try {
      const { data: inviteData, error: inviteError } = await supabase.rpc('invite_flow_collaborator', {
        flow_id_param: flowId,
        invitee_email_param: email.trim().toLowerCase(),
        permission_level_param: permission,
      });

      if (inviteError) throw inviteError;

      const collaborationIdForEmail = inviteData as string | null;

      toast({ title: 'Invitación creada en sistema.' });
      const inviteeEmail = email.trim().toLowerCase();
      setEmail('');
      loadCollaborators();


      const { data: userExistsData, error: userExistsError } = await supabase.rpc('check_user_exists_by_email', {
        email_param: inviteeEmail
      });





      if (userExistsError) {

      } else if (userExistsData === false) {


        const inviterName = user.fullName || user.username || 'A user';
        
        let invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign-up`;
        if (collaborationIdForEmail) {
          invitationUrl += `?invite_token=${collaborationIdForEmail}&flow_id=${flowId}`;
        } else {
          invitationUrl += `?flow_id=${flowId}&email=${encodeURIComponent(inviteeEmail)}`;

        }

        try {
          const emailResponse = await fetch('/api/collaboration/send-invite-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inviteeEmail,
              inviterName,
              flowName,
              invitationUrl,
              appName: 'FlowAPI'
            }),
          });

          if (!emailResponse.ok) {
            const errorData = await emailResponse.json();

            toast({ title: 'Error', description: 'Invitation created, but failed to send email.', variant: 'destructive' });
          } else {
            toast({ title: 'Invitación enviada por email.' });
          }
        } catch (emailError) {

          toast({ title: 'Error', description: 'Invitation created, but encountered an error sending email.', variant: 'destructive' });
        }
      } else {

      }

    } catch (err: any) {
      toast({ title: 'Error al invitar', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const removeCollaborator = async (id: string) => {
    if (!isOwner) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('remove_flow_collaboration', {
        collaboration_id_param: id,
      });
      if (error) throw error;
      toast({ title: 'Colaborador eliminado' });
      loadCollaborators();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'accepted' | 'declined') => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('update_flow_collaboration_status', {
        collaboration_id_param: id,
        new_status_param: status,
      });
      if (error) throw error;
      toast({ title: status === 'accepted' ? 'Invitación aceptada' : 'Invitación rechazada' });
      loadCollaborators();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setHasCopied(true);
      toast({ title: 'Enlace copiado' });
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  /* ------------------------- UI helpers ------------------------- */
  const permissionBadge = (level: PermissionLevel) => (
    <Badge
      className={cn(
        'flex items-center gap-1 text-xs border-[2px] rounded-md px-1.5 py-0.5',
        level === 'view'
          ? isDark
            ? 'bg-blue-900/30 text-blue-200 border-blue-500'
            : 'bg-blue-100 text-blue-800 border-blue-300'
          : isDark
          ? 'bg-amber-900/30 text-amber-200 border-amber-500'
          : 'bg-amber-100 text-amber-800 border-amber-300'
      )}
    >
      {level === 'view' ? <Shield className="h-3 w-3" /> : <Users className="h-3 w-3" />}
      {level === 'view' ? 'Lectura' : 'Editar'}
    </Badge>
  );

  /* ---------------------------------------------------------------------- */
  /*                                 render                                  */
  /* ---------------------------------------------------------------------- */
  return (
    <>
      {/* open dialog button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={cn(
          'gap-1.5 rounded-lg border-[3px]',
          cartoonShadow,
          isDark
            ? 'bg-blue-900/40 text-blue-100 hover:bg-blue-800/60 border-blue-600'
            : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border-slate-900'
        )}
      >
        <Users className="h-4 w-4" />
        Colaborar
      </Button>

      {/* dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className={cn(
            'sm:max-w-[520px] p-0 rounded-2xl overflow-hidden',
            cartoonShadow,
            isDark ? 'bg-[#1e293b] border-blue-600' : 'bg-white border-slate-900'
          )}
        >
          {/* header */}
          <DialogHeader
            className={cn(
              'p-4 border-b-[3px]',
              isDark ? 'border-blue-600' : 'border-slate-900'
            )}
          >
            <DialogTitle className="flex items-center gap-2">
              <Users className={cn('h-5 w-5', isDark ? 'text-blue-300' : 'text-blue-600')} />
              Colaboración e
            </DialogTitle>
            <DialogDescription className={isDark ? 'text-blue-400' : 'text-slate-600'}>
              Invita personas y gestiona permisos.
            </DialogDescription>
          </DialogHeader>

          {/* tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div
              className={cn(
                'px-4 py-2 ',
                isDark ? 'border-blue-600 bg-[#0f172a]' : 'border-slate-900 bg-slate-100'
              )}
            >
              <TabsList
                className={cn(
                  'grid w-full grid-cols-2 rounded-lg ',
                  cartoonShadow,
                  isDark ? 'bg-[#1e293b]' : 'bg-white'
                )}
              >
                <TabsTrigger
                  value="collaborators"
                  className="flex items-center gap-1.5 text-sm py-1.5 data-[state=active]:bg-blue-600/80 data-[state=active]:text-white rounded-md border-[2px]"
                >
                  <Users className="h-4 w-4" /> Colaboradores
                </TabsTrigger>
                <TabsTrigger
                  value="share"
                  className="flex items-center gap-1.5 text-sm py-1.5 data-[state=active]:bg-blue-600/80 data-[state=active]:text-white rounded-md border-[2px]"
                >
                  <Link2 className="h-4 w-4" /> Enlace
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ---- COLLABORATORS TAB ---- */}
            <TabsContent value="collaborators" className="p-4 space-y-4">
              {isOwner && (
                <div className={cn('space-y-3 border-[3px] rounded-lg p-4', cartoonShadow)}>
                  <h4 className="font-medium">Invitar colaborador</h4>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nombre@ejemplo.com"
                        className={cn(
                          'mt-1 border-[3px] rounded-lg',
                          cartoonShadow,
                          isDark
                            ? 'bg-[#0f172a] border-blue-600 text-blue-100'
                            : 'bg-white border-slate-900 text-slate-800'
                        )}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={inviteCollaborator}
                    disabled={!email.trim() || isLoading}
                    className={cn(
                      'w-full gap-2 border-[3px] rounded-lg',
                      cartoonShadow,
                      isDark ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    )}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Invitar
                  </Button>
                </div>
              )}

              {/* listado */}
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : collaborators.length === 0 ? (
                <p className="text-center opacity-70">No hay colaboradores.</p>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {collaborators.map((c) => (
                    <div
                      key={c.collaboration_id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border-[3px]',
                        cartoonShadow,
                        isDark ? 'bg-[#1e293b] border-blue-600' : 'bg-white border-slate-900'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className={cn('h-8 w-8 border-[3px]', cartoonShadow)}>
                          <AvatarImage src={c.avatar_url} />
                          <AvatarFallback>
                            {((c.display_name || c.email || '??').slice(0, 2).toUpperCase())}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                        <div className="font-medium flex items-center gap-1.5">
  <span
    className="truncate max-w-[140px] block"
    title={c.display_name || c.email || 'Usuario Invitado'}
  >
    {c.display_name || c.email || 'Usuario Invitado'}
  </span>
  {c.status !== 'accepted' && (
    <Badge
      className={cn(
        'text-xs px-1 border-[2px]',
        c.status === 'pending'
          ? isDark
            ? 'bg-yellow-900/30 text-yellow-200 border-yellow-500'
            : 'bg-yellow-50 text-yellow-800 border-yellow-400'
          : isDark
          ? 'bg-red-900/30 text-red-200 border-red-500'
          : 'bg-red-50 text-red-800 border-red-400'
      )}
    >
      {c.status === 'pending' ? 'Pendiente' : 'Rechazado'}
    </Badge>
  )}
</div>
                          <p
  className="text-xs opacity-70 max-w-[170px] truncate"
  title={c.email || 'Sin email'}
>
  {c.email || 'Sin email'}
</p>

                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {permissionBadge(c.permission_level)}

                        {isOwner && c.status !== 'declined' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeCollaborator(c.collaboration_id)}
                            disabled={isLoading}
                            className={cn(
                              'h-7 w-7',
                              isDark ? 'text-red-300 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                        {c.user_id === user?.id && c.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(c.collaboration_id, 'accepted')}
                              disabled={isLoading}
                              className={cn(
                                'h-7 px-2 text-xs border-[3px] rounded-lg',
                                cartoonShadow,
                                isDark
                                  ? 'border-green-600 text-green-200 hover:bg-green-900/30'
                                  : 'border-green-600 text-green-700 hover:bg-green-50'
                              )}
                            >
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Aceptar'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(c.collaboration_id, 'declined')}
                              disabled={isLoading}
                              className={cn(
                                'h-7 px-2 text-xs border-[3px] rounded-lg',
                                cartoonShadow,
                                isDark
                                  ? 'border-red-600 text-red-200 hover:bg-red-900/30'
                                  : 'border-red-600 text-red-700 hover:bg-red-50'
                              )}
                            >
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Rechazar'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ---- SHARE TAB ---- */}
            <TabsContent value="share" className="p-4 space-y-4">
              <div
                className={cn(
                  'p-4 rounded-lg text-sm border-[3px]',
                  cartoonShadow,
                  isDark ? 'bg-blue-900/20 text-blue-100 border-blue-600' : 'bg-blue-50 text-blue-800 border-slate-900'
                )}
              >
                Comparte este enlace con las personas que quieras colaborar.
              </div>

              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className={cn(
                    'flex-1 border-[3px] rounded-lg',
                    cartoonShadow,
                    isDark ? 'bg-[#0f172a] border-blue-600 text-blue-100' : 'bg-white border-slate-900 text-slate-800'
                  )}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={copyShareUrl}
                        className={cn(
                          'border-[3px] rounded-lg',
                          cartoonShadow,
                          isDark
                            ? 'border-blue-600 bg-blue-900/40 text-blue-200 hover:bg-blue-800/60'
                            : 'border-slate-900 bg-blue-50 text-blue-800 hover:bg-blue-100'
                        )}
                      >
                        {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      className={cn(
                        'border-[3px] rounded-lg',
                        cartoonShadow,
                        isDark ? 'bg-[#1e293b] border-blue-600' : 'bg-white border-slate-900'
                      )}
                    >
                      {hasCopied ? 'Copiado' : 'Copiar enlace'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Button
                onClick={copyShareUrl}
                className={cn(
                  'w-full gap-2 border-[3px] rounded-lg',
                  cartoonShadow,
                  isDark ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                )}
              >
                <Share2 className="h-4 w-4" />
                Copiar enlace de colaboración
              </Button>
            </TabsContent>
          </Tabs>

          {/* footer */}
          <DialogFooter
            className={cn(
              'flex justify-end gap-2 px-4 py-3 border-t-[3px]',
              isDark ? 'border-blue-600 bg-[#0f172a]' : 'border-slate-900 bg-slate-100'
            )}
          >
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className={cn(
                'border-[3px] rounded-lg',
                cartoonShadow,
                isDark ? 'border-blue-600 text-blue-100 hover:bg-[#1e293b]' : 'border-slate-900 text-slate-800 hover:bg-white'
              )}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
