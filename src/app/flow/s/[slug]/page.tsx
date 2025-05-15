'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FlowCollaborationWrapper } from '@/components/collaboration/flow-collaboration-wrapper';
import { FlowCanvas } from '@/components/flow-canvas';
import { NodeSettingsPanel } from '@/components/panels/node-settings-panel';
import Sidebar from '@/components/panels/sidebar';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { ReactFlowProvider } from '@xyflow/react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SlugFlowPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const params = useParams();
  const slug = params?.slug as string;

  const [resolvedFlowId, setResolvedFlowId] = useState<string | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !slug) {
      if (isMounted && !slug) {
        setError('Slug not provided in URL.');
        setIsLoadingApi(false);
      }
      return;
    }

    const fetchFlowId = async () => {
      setIsLoadingApi(true);
      setError(null);
      setResolvedFlowId(null);

      try {
        const response = await fetch(`/api/flow/resolve/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Slug not found or is not active.');
          }
          let errorMessage = `Error: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            errorMessage = response.statusText || 'Failed to retrieve flow information.';
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();
        if (data.flow_id) {
          setResolvedFlowId(data.flow_id);
        } else {
          throw new Error(data.error || 'Flow ID not found for this slug.');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred while resolving the slug.');
      } finally {
        setIsLoadingApi(false);
      }
    };

    fetchFlowId();
  }, [isMounted, slug]);

  if (!isMounted) {
    return <main className="flex flex-grow h-full overflow-hidden" />;
  }

  if (isLoadingApi) {
    return (
      <main className="flex flex-grow h-full overflow-hidden items-center justify-center">
        <div className={cn(
          'flex flex-col items-center gap-4 p-6 rounded-xl shadow-lg',
          isDark ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-100 text-neutral-700'
        )}>
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="font-semibold">Loading flow...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-grow h-full overflow-hidden items-center justify-center p-4">
        <Alert variant="destructive" className={cn('max-w-md', isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-100 border-red-300')}>
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error Loading Flow</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </main>
    );
  }

  if (!resolvedFlowId) {
    return (
      <main className="flex flex-grow h-full overflow-hidden items-center justify-center p-4">
        <Alert variant="default" className={cn('max-w-md', isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-300')}>
           <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Flow Not Found</AlertTitle>
          <AlertDescription>Could not load the flow for the provided slug. It might be invalid, the flow no longer exists, or was not found.</AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <ReactFlowProvider>
      <main className="flex flex-grow h-full overflow-hidden">
        <FlowCollaborationWrapper flowId={resolvedFlowId}>
          <div className="flex w-full h-full">
            <div className={cn(
              "flex-shrink-0 h-full shadow-md",
              isDark
                ? "dark-cartoon-sidebar"
                : "bg-white border-r-2 border-neutral-800"
            )}>
              <Sidebar />
            </div>
            <div className="flex-grow h-full">
              <FlowCanvas />
            </div>
            <div className={cn(
              "flex-shrink-0 w-80 h-full shadow-md",
              isDark
                ? "dark-cartoon-panel"
                : "bg-white border-l-2 border-neutral-800"
            )}>
              <NodeSettingsPanel />
            </div>
          </div>
        </FlowCollaborationWrapper>
      </main>
    </ReactFlowProvider>
  );
} 