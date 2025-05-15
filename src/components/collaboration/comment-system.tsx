'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createBrowserClient } from '@supabase/ssr';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageSquare, Send, X, Reply } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Comment {
  id: string;
  user_id: string;
  flow_id: string;
  content: string;
  position: { x: number; y: number };
  parent_id?: string;
  created_at: string;
  display_name?: string;
  avatar_url?: string;
  replies?: Comment[];
}

interface CommentSystemProps {
  flowId: string;
  position: { x: number; y: number };
  permission: 'view' | 'comment' | 'edit';
}

export function CommentSystem({ flowId, position, permission }: CommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReplying, setIsReplying] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  
  const { user } = useUser();
  const { toast } = useToast();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const canComment = permission === 'comment' || permission === 'edit';
  
  useEffect(() => {
    if (!isOpen || !flowId) return;
    
    loadComments();
    
    // Suscribirse a nuevos comentarios
    const channel = supabase
      .channel(`comments-${flowId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'flow_comments', 
          filter: `flow_id=eq.${flowId}` 
        },
        () => {
          loadComments();
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [flowId, isOpen]);
  
  const loadComments = async () => {
    setIsLoading(true);
    try {
      // Obtener comentarios para esta posición (con umbral de cercanía)
      const THRESHOLD = 200; // distancia en píxeles
      
      const { data, error } = await supabase
        .from('flow_comments')
        .select(`
          id, user_id, flow_id, content, position, parent_id, created_at,
          profiles:user_id (display_name, avatar_url)
        `)
        .eq('flow_id', flowId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error('Error cargando comentarios');
      }
      
      // Formatear los comentarios y filtrar por cercanía
      const formattedComments = await Promise.all(
        data
          .filter((comment: any) => {
            // Filtrar por cercanía a la posición actual
            const dx = comment.position.x - position.x;
            const dy = comment.position.y - position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= THRESHOLD;
          })
          .map(async (comment: any) => {
            // Para cada comentario, obtener sus respuestas
            const { data: replies, error: repliesError } = await supabase
              .from('flow_comments')
              .select(`
                id, user_id, flow_id, content, position, parent_id, created_at,
                profiles:user_id (display_name, avatar_url)
              `)
              .eq('parent_id', comment.id)
              .order('created_at', { ascending: true });
            
            return {
              ...comment,
              display_name: comment.profiles?.display_name || 'Usuario',
              avatar_url: comment.profiles?.avatar_url,
              replies: replies?.map((reply: any) => ({
                ...reply,
                display_name: reply.profiles?.display_name || 'Usuario',
                avatar_url: reply.profiles?.avatar_url,
              })) || [],
            };
          })
      );
      
      setComments(formattedComments);
    } catch (error) {
      (error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los comentarios',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const addComment = async () => {
    if (!content.trim() || !flowId || !user || !canComment) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('flow_comments')
        .insert({
          flow_id: flowId,
          user_id: user.id,
          content: content.trim(),
          position,
        })
        .select();
      
      if (error) {
        throw new Error('Error añadiendo comentario');
      }
      
      setContent('');
      loadComments();
    } catch (error) {
      (error);
      toast({
        title: 'Error',
        description: 'No se pudo añadir el comentario',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const addReply = async (parentId: string) => {
    if (!replyContent.trim() || !flowId || !user || !canComment) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('flow_comments')
        .insert({
          flow_id: flowId,
          user_id: user.id,
          content: replyContent.trim(),
          position,
          parent_id: parentId,
        })
        .select();
      
      if (error) {
        throw new Error('Error añadiendo respuesta');
      }
      
      setReplyContent('');
      setIsReplying(null);
      loadComments();
    } catch (error) {
      (error);
      toast({
        title: 'Error',
        description: 'No se pudo añadir la respuesta',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteComment = async (commentId: string) => {
    if (!flowId || !user) return;
    
    setIsLoading(true);
    try {
      // Verificar si el usuario es propietario del comentario
      const { data: commentData, error: commentError } = await supabase
        .from('flow_comments')
        .select('user_id')
        .eq('id', commentId)
        .single();
      
      if (commentError) {
        throw new Error('Error verificando comentario');
      }
      
      if (commentData.user_id !== user.id) {
        throw new Error('No puedes eliminar comentarios de otros usuarios');
      }
      
      // Eliminar el comentario
      const { error } = await supabase
        .from('flow_comments')
        .delete()
        .eq('id', commentId);
      
      if (error) {
        throw new Error('Error eliminando comentario');
      }
      
      // Recargar comentarios
      loadComments();
    } catch (error: any) {
      (error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Formatear fecha relativa
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } else {
      return format(date, "d 'de' MMMM 'a las' HH:mm", { locale: es });
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          size="icon" 
          variant="outline" 
          className={cn(
            "h-8 w-8 rounded-full transition-all duration-200 absolute",
            "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "border-2",
            isDark 
              ? "bg-blue-900/80 border-blue-700 text-blue-300 hover:bg-blue-800"
              : "bg-blue-500/90 border-blue-600 text-white hover:bg-blue-600"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          {comments.length > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 h-4 w-4 rounded-full text-[10px] font-semibold flex items-center justify-center",
              isDark 
                ? "bg-amber-700 text-amber-100 border border-amber-600"
                : "bg-amber-500 text-white border border-amber-600"
            )}>
              {comments.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-80 p-0 shadow-xl border-2 rounded-xl overflow-hidden",
          isDark 
            ? "bg-neutral-900 border-blue-700"
            : "bg-white border-blue-300"
        )}
        align="center"
      >
        <div className={cn(
          "py-2 px-4 border-b flex items-center justify-between",
          isDark ? "border-blue-800/50" : "border-neutral-200"
        )}>
          <h3 className={cn(
            "font-medium flex items-center gap-2",
            isDark ? "text-blue-300" : "text-blue-800"
          )}>
            <MessageSquare className="h-4 w-4" />
            <span>Comentarios</span>
            {comments.length > 0 && (
              <span className={cn(
                "h-5 px-1.5 rounded-full text-xs font-semibold flex items-center justify-center",
                isDark 
                  ? "bg-blue-900/80 text-blue-300 border border-blue-800"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              )}>
                {comments.length}
              </span>
            )}
          </h3>
          <Button 
            size="icon" 
            variant="ghost" 
            className={cn(
              "h-7 w-7",
              isDark ? "text-blue-400 hover:text-blue-300" : "text-neutral-500 hover:text-neutral-700"
            )}
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="max-h-80 p-4">
          {comments.length === 0 ? (
            <div className={cn(
              "text-center py-8",
              isDark ? "text-blue-400/70" : "text-neutral-500"
            )}>
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No hay comentarios todavía</p>
              {canComment ? (
                <p className="text-sm mt-1 opacity-70">Sé el primero en comentar</p>
              ) : (
                <p className="text-sm mt-1 opacity-70">No tienes permisos para comentar</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className={cn(
                    "rounded-lg border p-3",
                    isDark ? "bg-neutral-800/50 border-blue-800/30" : "bg-white border-neutral-200"
                  )}
                >
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.avatar_url} />
                      <AvatarFallback className={cn(
                        "text-sm font-semibold",
                        isDark ? "bg-blue-800 text-blue-200" : "bg-blue-500 text-white"
                      )}>
                        {comment.display_name?.substring(0, 2) || '??'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-medium block">
                            {comment.display_name}
                          </span>
                          <span className={cn(
                            "text-xs block -mt-0.5",
                            isDark ? "text-blue-400/70" : "text-neutral-500"
                          )}>
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        
                        {user && comment.user_id === user.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-6 w-6",
                              isDark ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-600"
                            )}
                            onClick={() => deleteComment(comment.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      <p className={cn(
                        "text-sm whitespace-pre-wrap break-words",
                        isDark ? "text-blue-200" : "text-neutral-800"
                      )}>
                        {comment.content}
                      </p>
                      
                      {canComment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-7 px-2 text-xs gap-1",
                            isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-700 hover:text-blue-800"
                          )}
                          onClick={() => setIsReplying(isReplying === comment.id ? null : comment.id)}
                        >
                          <Reply className="h-3 w-3" />
                          {isReplying === comment.id ? 'Cancelar' : 'Responder'}
                        </Button>
                      )}
                      
                      {/* Respuestas */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 space-y-3 pl-4 border-l-2 border-dotted border-neutral-300 dark:border-blue-800/50">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="relative">
                              <div className="flex gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={reply.avatar_url} />
                                  <AvatarFallback className={cn(
                                    "text-xs font-semibold",
                                    isDark ? "bg-blue-800 text-blue-200" : "bg-blue-500 text-white"
                                  )}>
                                    {reply.display_name?.substring(0, 2) || '??'}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <span className="font-medium text-sm block">
                                        {reply.display_name}
                                      </span>
                                      <span className={cn(
                                        "text-xs block -mt-0.5",
                                        isDark ? "text-blue-400/70" : "text-neutral-500"
                                      )}>
                                        {formatDate(reply.created_at)}
                                      </span>
                                    </div>
                                    
                                    {user && reply.user_id === user.id && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                          "h-5 w-5",
                                          isDark ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-600"
                                        )}
                                        onClick={() => deleteComment(reply.id)}
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  <p className={cn(
                                    "text-xs whitespace-pre-wrap break-words",
                                    isDark ? "text-blue-200" : "text-neutral-800"
                                  )}>
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Formulario de respuesta */}
                      {isReplying === comment.id && canComment && (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            placeholder="Escribe una respuesta..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className={cn(
                              "text-sm min-h-[60px] resize-none",
                              isDark 
                                ? "bg-neutral-800 border-blue-800/50 text-blue-200 placeholder:text-blue-400/50"
                                : "bg-white border-neutral-300 text-neutral-800"
                            )}
                          />
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              className={cn(
                                "h-8 gap-1",
                                isDark 
                                  ? "bg-blue-800 hover:bg-blue-700 text-white"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              )}
                              disabled={!replyContent.trim() || isLoading}
                              onClick={() => addReply(comment.id)}
                            >
                              <Send className="h-3 w-3" />
                              Responder
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {canComment && (
          <div className={cn(
            "p-3 border-t",
            isDark ? "border-blue-800/50 bg-neutral-950/50" : "border-neutral-200 bg-neutral-50"
          )}>
            <Textarea
              placeholder="Escribe un comentario..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={cn(
                "mb-2 resize-none",
                isDark 
                  ? "bg-neutral-800 border-blue-800/50 text-blue-200 placeholder:text-blue-400/50"
                  : "bg-white border-neutral-300 text-neutral-800"
              )}
            />
            <div className="flex justify-end">
              <Button
                className={cn(
                  "gap-1",
                  isDark 
                    ? "bg-blue-700 hover:bg-blue-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                )}
                disabled={!content.trim() || isLoading}
                onClick={addComment}
              >
                <Send className="h-4 w-4" />
                Comentar
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
} 