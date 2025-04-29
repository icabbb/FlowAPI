'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import React, { useMemo } from 'react';
import { useFlowStore } from '@/store/flow-store';
import { cn } from "@/lib/utils";
import { ListFilter, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import type { PathEntry } from '@/components/shared/path-list-editor';
import { useTheme } from 'next-themes';

// Define the expected data structure for this node
interface SelectFieldsNodeData {
  label?: string;
  jsonPaths?: PathEntry[];
  [key: string]: any; // Index signature for flexibility
}

// Default data for the node
const defaultNodeData: SelectFieldsNodeData = {
  label: 'Select Fields',
  jsonPaths: [],
};

function SelectFieldsNodeComponent({ data, id, isConnectable }: NodeProps) {
  const { nodeResults } = useFlowStore();
  const executionResult = nodeResults[id];
  const { theme } = useTheme();

  // Determine if dark mode is active
  const isDarkMode = theme === 'dark';

  // Merge data with defaults
  const nodeData: SelectFieldsNodeData = useMemo(() => ({ ...defaultNodeData, ...data }), [data]);
  const { label, jsonPaths } = nodeData;

  // Calculate active path count
  const activePathCount = useMemo(() => {
    return (jsonPaths || []).filter(p => p.enabled).length;
  }, [jsonPaths]);

  // Colored top border for status indication (with cartoon style)
  const topBorderClass = cn(
    "border-t-[3px]",
    executionResult?.status === 'loading' ? "border-amber-500" :
    executionResult?.status === 'success' ? "border-lime-500" :
    executionResult?.status === 'error' ? "border-red-500" :
    "border-transparent"
  );

  return (
    // Cartoon style node with conditional dark mode styling
    <div className={cn(
        "min-w-[220px] max-w-[320px] nowheel rounded-xl shadow-md overflow-hidden",
        isDarkMode 
          ? "dark-cartoon-node backdrop-blur-sm backdrop-saturate-150" // Aplicar estilo dark cartoon con backdrop
          : "bg-white/95 border-2 border-neutral-800 text-neutral-800 backdrop-blur-sm backdrop-saturate-150 backdrop-brightness-105", // Estilo light con backdrop
        "transition-all duration-300 ease-in-out hover:shadow-xl",
        "hover:translate-y-[-2px]", // Slight float effect on hover
        topBorderClass
     )}
    >
      {/* Cartoon Target Handle */}
      <Handle 
        type="target" 
        position={Position.Left} 
        isConnectable={isConnectable} 
        className={cn(
          "!w-3 !h-3 !shadow-md !z-10",
          isDarkMode 
            ? "dark-cartoon-handle dark-cartoon-handle-target" 
            : "!bg-blue-500 !border-2 !border-neutral-800"
        )}
      />
      
      {/* Cartoon Header */}
      <div className={cn(
        "px-3 py-2 border-b-2 rounded-t-xl flex items-center justify-between gap-2",
        isDarkMode 
          ? "dark-cartoon-node-header"
          : "border-neutral-800 bg-gradient-to-r from-amber-50 to-amber-100"
      )}>
          {/* Icon and Title */}
          <div className="flex items-center gap-2 min-w-0">
            <ListFilter className={cn("h-4 w-4 flex-shrink-0", isDarkMode ? "text-amber-300" : "text-amber-600")} />
            <h3 className={cn("text-sm font-bold truncate", isDarkMode ? "text-white" : "text-neutral-800")} title={label}>
              {label}
            </h3>
          </div>
          {/* Status Icons */}
          <div className="flex-shrink-0 flex items-center gap-1"> 
            {executionResult?.status === 'loading' && (
              <Loader2 className={cn("h-4 w-4 animate-spin", isDarkMode ? "text-amber-300" : "text-amber-600")} />
            )}
            {executionResult?.status === 'success' && (
              <CheckCircle2 className={cn("h-4 w-4", isDarkMode ? "text-green-300" : "text-lime-600")} />
            )}
            {executionResult?.status === 'error' && (
              <AlertCircle className={cn("h-4 w-4", isDarkMode ? "text-red-300" : "text-red-600")} />
            )}
          </div>
      </div>

      {/* Cartoon Content with Badge */}
      <div className={cn(
        "p-4 text-center", 
        isDarkMode ? "dark-cartoon-node-content" : "bg-gradient-to-b from-white to-amber-50/50"
      )}> 
          <Badge 
            variant="outline" 
            className={cn(
              "text-sm rounded-lg font-bold border-2 px-3 py-1",
              isDarkMode
                ? "dark-cartoon-badge" 
                : "bg-amber-100 border-amber-400 text-amber-700"
            )}
          >
              {activePathCount} / {(jsonPaths || []).length} Paths Active
          </Badge>
      </div>

      {/* Cartoon Source Handle */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="output"
        isConnectable={isConnectable}
        className={cn(
          "!w-3 !h-3 !shadow-md !z-10",
          isDarkMode 
            ? "dark-cartoon-handle dark-cartoon-handle-source" 
            : "!bg-amber-500 !border-2 !border-neutral-800"
        )}
      />
    </div>
  );
}

export const SelectFieldsNode = React.memo(SelectFieldsNodeComponent); 