'use client';
import { useState, useEffect } from 'react';
import { FlowCanvas } from "@/components/flow-canvas";
import { NodeSettingsPanel } from "@/components/panels/node-settings-panel";
import { Sidebar } from "@/components/panels/sidebar";
import { cn } from "@/lib/utils";
import { useTheme } from 'next-themes';

// This is now the main application page content
export default function AppPage() { 
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <main className="flex flex-grow h-full overflow-hidden">
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
    </main>
  );
} 