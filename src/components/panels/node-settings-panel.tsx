'use client';;
import { memo, useMemo, ReactNode } from 'react';
import { useFlowStore } from '@/store/flow-store';
import { Node } from '@xyflow/react';
import { CheckCircle2, Loader2, Settings, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NodeResult } from '@/store/flow-store';
import { HttpRequestSettings } from './http-request-settings';
import { JsonNodeSettings } from './json-node-settings';
import { SelectFieldsSettings } from './select-fields-settings';
import { useTheme } from 'next-themes';

export function NodeSettingsPanel() {
  const { selectedNodeId, nodes, nodeResults } = useFlowStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  const executionResult: NodeResult | undefined = useMemo(() => {
    return selectedNodeId ? nodeResults[selectedNodeId] : undefined;
  }, [nodeResults, selectedNodeId]);

  const statusBadge: ReactNode = useMemo(() => {
    if (!executionResult || executionResult.status === 'idle') {
      return null;
    }
    // Cartoon-style badge with dark mode
    const baseBadgeStyle = cn(
      "text-xs font-semibold rounded-xl px-3 py-1 border-2 shadow-md flex items-center gap-1.5 whitespace-nowrap",
      isDark ? "border-blue-400" : "border-neutral-800"
    );
    
    if (executionResult.status === 'error') {
      return (
        <Badge variant="destructive" className={cn(
          baseBadgeStyle, 
          isDark ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-800 border-red-500"
        )}>
          <XCircle className="h-3.5 w-3.5" /> Error
        </Badge>
      );
    }
    
    if (executionResult.status === 'success') {
      return (
        <Badge variant="default" className={cn(
          baseBadgeStyle, 
          isDark ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-800 border-green-500"
        )}>
          <CheckCircle2 className="h-3.5 w-3.5" /> Executed
        </Badge>
      );
    }
    
    if (executionResult.status === 'loading') {
      return (
        <Badge variant="secondary" className={cn(
          baseBadgeStyle, 
          isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-800 border-blue-500"
        )}>
          <Loader2 className="h-3.5 w-3.5 animate-spin"/> Running...
        </Badge>
      );
    }
    
    return null;
  }, [executionResult, isDark]);

  if (!selectedNode) {
    return (
      <aside className={cn(
        "h-full flex flex-col p-0 shadow-md",
        isDark 
          ? "dark-cartoon-panel"
          : "bg-white border-l-2 border-neutral-800"
      )}>
        <div className={cn(
          "flex-shrink-0 px-4 py-3 border-b-2",
          isDark ? "border-blue-500" : "bg-white border-neutral-800"
        )}>
          <h2 className={cn(
            "text-base font-semibold flex items-center gap-2",
            isDark ? "text-white" : "text-neutral-800"
          )}>
            <Settings className={cn("h-4 w-4", isDark ? "text-blue-300" : "text-blue-600")}/> Settings
          </h2>
        </div>
        <div className="flex-grow flex items-center justify-center p-4">
          <p className={cn(
            "text-sm text-center rounded-lg border-2 p-4 shadow-inner",
            isDark 
              ? "bg-neutral-800 border-blue-500 text-blue-200" 
              : "bg-neutral-50 border-neutral-300 text-neutral-600"
          )}>
            Select a node to configure its settings.
          </p>
        </div>
      </aside>
    );
  }

  const renderPanelContent = () => {
    switch (selectedNode.type) {
      case 'httpRequest':
        return <HttpRequestSettings node={selectedNode as Node<any>} />;
      case 'jsonNode':
        return <JsonNodeSettings node={selectedNode as Node<any>} executionResult={executionResult} />;
      case 'selectFields':
        return <SelectFieldsSettings node={selectedNode as Node<any>} executionResult={executionResult} />;
      default:
        return (
          <div className={cn(
            "text-center p-6 rounded-lg border-2 shadow-sm",
            isDark 
              ? "bg-neutral-800 border-blue-500 text-blue-200" 
              : "bg-neutral-50 border-neutral-300 text-neutral-700"
          )}>
            <p className="text-sm mb-1">Node type: '{selectedNode.type || 'Unknown'}'</p>
            <p className="text-sm">No specific settings available for this node type.</p>
          </div>
        );
    }
  };
  
  return (
    <aside className={cn(
      "h-full flex flex-col p-0 shadow-md",
      isDark 
        ? "dark-cartoon-panel" 
        : "bg-white border-l-2 border-neutral-800"
    )}>
      <div className={cn(
        "flex-shrink-0 px-4 py-3 space-y-1.5 border-b-2",
        isDark ? "border-blue-500" : "bg-white border-neutral-800"
      )}>
        <h2 className={cn(
          "text-base font-semibold truncate",
          isDark ? "text-white" : "text-neutral-800"
        )}>
          {String(selectedNode.data?.label || 
            (selectedNode.type === 'httpRequest' ? 'HTTP Request' : 
             selectedNode.type === 'jsonNode' ? 'JSON Output' : 
             selectedNode.type === 'selectFields' ? 'Select Fields' : 
             'Node Settings')
          )}
        </h2>
        <div className={cn(
          "flex items-center justify-between text-xs rounded-md p-2 border",
          isDark 
            ? "bg-neutral-800 border-blue-500 text-blue-200" 
            : "bg-neutral-50 border-neutral-200 text-neutral-600"
        )}>
            <span>Type: <span className="font-medium">{selectedNode.type || 'default'}</span></span>
            <span className={cn(
              "font-mono px-1.5 py-0.5 rounded border",
              isDark 
                ? "bg-neutral-700 border-blue-600" 
                : "bg-neutral-100 border-neutral-300"
            )}>ID: {selectedNode.id}</span>
        </div>
        {statusBadge && (
           <div className="pt-1">
               {statusBadge}
           </div>
        )}
      </div>
      <div className={cn(
        "flex-grow overflow-y-auto p-4",
        isDark ? "bg-neutral-900" : "bg-neutral-50/50"
      )}>
        {renderPanelContent()}
      </div>
    </aside>
  );
}

export default memo(NodeSettingsPanel); 