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

export default function CollaborativeFlowPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const params = useParams();
  const flowId = typeof params?.id === 'string' ? params.id : undefined;

  if (!flowId) {

  }

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !flowId) {

    return <main className="flex flex-grow h-full overflow-hidden" />;
  }

  return (
    <ReactFlowProvider>
      <main className="flex flex-grow h-full overflow-hidden">
        
        <FlowCollaborationWrapper flowId={flowId}>
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