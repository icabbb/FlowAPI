/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { FlowCanvas } from "@/components/flow-canvas";
import { NodeSettingsPanel } from "@/components/panels/node-settings-panel";
import Sidebar from "@/components/panels/sidebar";
import { FlowCollaborationWrapper } from '@/components/collaboration/flow-collaboration-wrapper';
import { useFlowStore } from '@/store';

import { cn } from "@/lib/utils";
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// This is now the main application page content
export default function AppPage() { 
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Attempt to get the active flow ID from your state management (e.g., Zustand)
  // You'll need to ensure this state is updated when a user selects a flow on the dashboard
  const activeFlowId = useFlowStore((state) => state.currentFlowId);

  // Handle hydration mismatch by only rendering theme-dependent UI after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Return a simple div during SSR to prevent hydration mismatch
  if (!isMounted) {
    return <main className="flex flex-grow h-full overflow-hidden" />;
  }

  // Define the common layout for the flow area
  const flowAreaContent = (
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
  );

  return (
    <main className="flex flex-grow h-full overflow-hidden">
      {activeFlowId ? (
        <FlowCollaborationWrapper flowId={activeFlowId}>
          {flowAreaContent} 
        </FlowCollaborationWrapper>
      ) : (
        flowAreaContent
      )}
    </main>
  );
} 