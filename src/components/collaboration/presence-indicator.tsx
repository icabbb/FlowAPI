'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { createBrowserClient } from '@supabase/ssr';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface CollaboratorPresence {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  last_active: string;
  current_position?: { x: number; y: number };
}

export function PresenceIndicator({ flowId }: { flowId: string }) {
  const { user } = useUser();
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  useEffect(() => {

    if (!flowId || !user) {

      setLoading(false); // If we return early, we are not loading.
      return;
    }
    
    const registerPresence = async () => {
      try {
        const { error } = await supabase
          .from('flow_collaborators_presence')
          .upsert(
            {
              flow_id: flowId,
              user_id: user.id,
              display_name: user.fullName || user.username || 'Usuario Anónimo',
              avatar_url: user.imageUrl,
              last_active: new Date().toISOString()
            },
            {
              onConflict: 'flow_id, user_id', 
            }
          );
        
        if (error) {

        }
      } catch (error) {

      }
    };
    
    const fetchCollaborators = async () => {
      let didFail = false;
      try {
        const { data, error } = await supabase
          .from('flow_collaborators_presence')
          .select('*')
          .eq('flow_id', flowId)
          .neq('user_id', user.id)
          .gt('last_active', new Date(Date.now() - 2 * 60 * 1000).toISOString()); 
        
        if (error) {

          didFail = true;
        }
        
        if (data && !didFail) {
          setCollaborators(data as CollaboratorPresence[]);
        }
      } catch (error) { 

        didFail = true;
      } finally {
        setLoading(false);
      }
    };
    
    registerPresence();
    const presenceInterval = setInterval(registerPresence, 15000);
    
    const presenceChannel = supabase
      .channel(`flow-presence-${flowId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'flow_collaborators_presence', 
          filter: `flow_id=eq.${flowId}` 
        },
        (payload) => {
          fetchCollaborators();
        }
      )
      .subscribe();
    
    fetchCollaborators();
    
    const fetchInterval = setInterval(fetchCollaborators, 30000);
    
    return () => {
      clearInterval(presenceInterval);
      clearInterval(fetchInterval);
      if (presenceChannel) { // Add a check for presenceChannel before unsubscribing
        presenceChannel.unsubscribe();
      }
      
      if (user && flowId) { // Only update if user and flowId were present
        supabase.from('flow_collaborators_presence')
          .update({ last_active: new Date(0).toISOString() })
          .eq('flow_id', flowId)
          .eq('user_id', user.id)
          .then();
      }
    };
  }, [flowId, user, supabase]);

  if (loading) {
    return (
      <div className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1 shadow-md",
        isDark 
          ? "bg-blue-900/60 border border-blue-700 text-blue-200"
          : "bg-blue-100 border border-blue-200 text-blue-800"
      )}>
        <Users className="h-4 w-4 animate-pulse" />
        <span className="text-xs">Conectando...</span>
      </div>
    );
  }

  if (collaborators.length === 0) {
    return (
      <div className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1 shadow-md",
        isDark 
          ? "bg-neutral-900/70 border border-neutral-800 text-neutral-300"
          : "bg-white border border-neutral-200 text-neutral-500"
      )}>
        <Users className="h-4 w-4" />
        <span className="text-xs">Solo tú</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={cn(
        "py-1 px-3 rounded-full shadow-md flex items-center gap-2",
        isDark 
          ? "bg-blue-900/70 hover:bg-blue-900 border-blue-700 text-blue-200"
          : "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800"
      )}>
        <Users className="h-4 w-4" />
        <span className="text-xs">{collaborators.length + 1} conectados</span>
      </Badge>
      
      <TooltipProvider>
        <div className="flex -space-x-2">
          {collaborators.map((collaborator) => (
            <Tooltip key={collaborator.id}>
              <TooltipTrigger asChild>
                <Avatar className={cn(
                  "h-8 w-8 border-2 shadow-sm cursor-pointer transform hover:scale-110 transition-transform duration-200",
                  isDark ? "border-neutral-800" : "border-white"
                )}>
                  <AvatarImage src={collaborator.avatar_url} />
                  <AvatarFallback className={cn(
                    "text-sm font-semibold",
                    isDark ? "bg-blue-800 text-blue-200" : "bg-blue-500 text-white"
                  )}>
                    {collaborator.display_name?.substring(0, 2) || '??'}
                  </AvatarFallback>
                </Avatar> 
              </TooltipTrigger>
              <TooltipContent side="bottom" className={cn(
                "px-3 py-1 text-xs",
                isDark ? "bg-neutral-800 text-neutral-200" : "bg-white text-neutral-800"
              )}>
                <p>{collaborator.display_name}</p>
                <p className={cn(
                  "text-[10px]",
                  isDark ? "text-neutral-400" : "text-neutral-500"
                )}>
                  Activo {new Date(collaborator.last_active).toLocaleTimeString()}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
} 