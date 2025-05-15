'use client';;
import { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { SavedFlow } from '@/contracts/types/flow.types';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

// Import the shared view components
import SharedSidebar from './shared-sidebar';
import SharedFlowCanvas from './shared-flow-canvas';
import SharedNodePanel from './shared-node-panel';

interface SharedFlowViewProps {
  flow: SavedFlow;
  shareId: string;
}

/**
 * Main component for the shared flow view.
 * This component mimics the layout structure of the main dashboard page
 * but uses read-only versions of the components.
 */
export default function SharedFlowView({ flow, shareId }: SharedFlowViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Handle hydration mismatch by only rendering theme-dependent UI after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Return a simple div during SSR to prevent hydration mismatch
  if (!isMounted) {
    return <div className="flex flex-col h-screen" />;
  }

  const handleExportFlow = () => {
    const flowData = JSON.stringify(flow, null, 2);
    const blob = new Blob([flowData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flow.name || 'shared-flow'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn(
      "flex flex-col h-screen w-full",
      isDark && "dark-cartoon"
    )}>
      {/* Header */}
      <header className={cn(
        "border-b p-2 flex items-center justify-between",
        isDark 
          ? "bg-blue-950/40 border-blue-800 text-blue-100" 
          : "bg-blue-50 border-blue-200 text-blue-800"
      )}>
        <div className="flex items-center gap-2">
          <Link 
            href="/dashboard/library" 
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors",
              isDark 
                ? "hover:bg-blue-900/60 text-blue-200 border-2 border-blue-700" 
                : "hover:bg-blue-100 text-blue-700 border-2 border-blue-300"
            )}
          >
            <ArrowLeft size={16} />
            <span>Library</span>
          </Link>
          
          <div className={cn(
            "ml-2 px-4 py-1 rounded-lg text-sm font-medium",
            isDark ? "bg-blue-900/50 text-blue-200" : "bg-white text-blue-700"
          )}>
            {flow.name || 'Untitled Flow'}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportFlow}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              isDark 
                ? "bg-blue-900/40 hover:bg-blue-900/60 text-blue-200 border-2 border-blue-700" 
                : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-300"
            )}
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <ReactFlowProvider>
          {/* Sidebar */}
          <div className={cn(
            "w-64 flex-shrink-0",
            isDark ? "border-r border-blue-800" : "border-r border-blue-200"
          )}>
            <SharedSidebar flow={flow} />
          </div>
          
          {/* Canvas */}
          <div className="flex-1 relative">
            <SharedFlowCanvas flow={flow} />
          </div>
          
          {/* Node Panel */}
          <div className={cn(
            "w-80 flex-shrink-0 h-full",
            isDark ? "border-l border-blue-800" : "border-l border-blue-200"
          )}>
            <SharedNodePanel flow={flow} />
          </div>
        </ReactFlowProvider>
      </div>
      
      {/* Footer */}
      <footer className={cn(
        "border-t py-2 px-4 text-center text-sm",
        isDark 
          ? "bg-blue-950/30 border-blue-800 text-blue-300" 
          : "bg-blue-50 border-blue-200 text-blue-600"
      )}>
        <p>You are viewing a read-only shared flow. Changes cannot be saved.</p>
      </footer>
    </div>
  );
} 