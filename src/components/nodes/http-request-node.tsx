import { Handle, Position, type NodeProps } from '@xyflow/react';
import React from 'react';
import { useFlowStore } from '@/store/flow-store';
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, AlertCircle, Play, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthConfig } from '@/components/shared/auth-settings';
import { useTheme } from 'next-themes';

interface KeyValueEntry {
  id: string; 
  key: string;
  value: string;
  enabled: boolean;
}
interface HttpRequestNodeData {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  label: string;
  queryParams?: KeyValueEntry[];
  headers?: KeyValueEntry[];
  bodyType?: 'none' | 'json' | 'text'; 
  body?: string; 
  auth?: AuthConfig;
}

// Define cartoon button styles 
const baseCartoonButtonStyle = "gap-1 rounded-xl border-2 border-neutral-800 px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60";
const primaryCartoonButtonStyle = `${baseCartoonButtonStyle} bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500`;

function HttpRequestNodeComponent({ data, id, isConnectable }: NodeProps) {
  const { nodeResults, executeSingleNode } = useFlowStore();
  const executionResult = nodeResults[id];
  const isRunning = executionResult?.status === 'loading';
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Default data merge
  const nodeData: HttpRequestNodeData = {
    method: 'GET',
    url: '',
    label: 'HTTP Request',
    queryParams: [],
    headers: [],
    bodyType: 'none',
    body: '',
    auth: { type: 'none' },
    ...data,
  };

  const { method, url, label, auth } = nodeData;

  // Use a colored top border for status indication
  const topBorderClass = cn(
    "border-t-[3px]",
    executionResult?.status === 'loading' ? "border-blue-500" :
    executionResult?.status === 'success' ? "border-lime-500" :
    executionResult?.status === 'error' ? "border-red-500" :
    "border-transparent" // No top border when idle
  );

  const handleExecuteClick = (event: React.MouseEvent) => {
    event.stopPropagation(); 
    if (!isRunning) {
        executeSingleNode(id);
    }
  };

  return (
    // Cartoon style node with backdrop effect, condicional para dark mode
    <div className={cn(
        "min-w-[220px] max-w-[320px] nowheel rounded-xl shadow-lg overflow-hidden", // Base + Added overflow-hidden
        isDark 
          ? "dark-cartoon-node backdrop-blur-sm backdrop-saturate-150" // Dark
          : "bg-white/95 border-2 border-neutral-800 text-neutral-800 backdrop-blur-sm backdrop-saturate-150 backdrop-brightness-105", // Light
        "transition-all duration-300 ease-in-out hover:shadow-xl", // Hover
        "hover:translate-y-[-2px]", // Slight float effect on hover
        topBorderClass // Apply dynamic top border
     )}
    >
      {/* Cartoon Target Handle con estilo condicional para dark mode */}
      <Handle 
        type="target" 
        position={Position.Left} 
        isConnectable={isConnectable} 
        className={cn(
          "!w-3 !h-3 !shadow-md !z-10",
          isDark 
            ? "dark-cartoon-handle dark-cartoon-handle-target" 
            : "!bg-blue-500 !border-2 !border-neutral-800"
        )}
      />
      
      {/* Cartoon Header with gradient - con estilos condicionales para dark mode */}
      <div className={cn(
        "px-3 py-2 border-b-2 rounded-t-xl flex items-center justify-between space-x-2",
        isDark 
          ? "dark-cartoon-node-header" 
          : "border-neutral-800 bg-gradient-to-r from-blue-50 to-blue-100"
      )}>
          <h3 className={cn(
            "text-sm font-bold truncate",
            isDark ? "text-white" : "text-neutral-800"
          )} title={label}>
            {label}
          </h3>
          {/* Status Icons Container */}
          <div className="flex-shrink-0 flex items-center gap-1.5"> 
            {auth && auth.type !== 'none' && <Lock className={cn(
              "h-3.5 w-3.5", 
              isDark ? "text-blue-300" : "text-blue-600"
            )} />}
            {executionResult?.status === 'loading' && <Loader2 className={cn(
              "h-4 w-4 animate-spin", 
              isDark ? "text-blue-300" : "text-blue-600"
            )} />}
            {executionResult?.status === 'success' && <CheckCircle2 className={cn(
              "h-4 w-4", 
              isDark ? "text-green-300" : "text-lime-600"
            )} />}
            {executionResult?.status === 'error' && <AlertCircle className={cn(
              "h-4 w-4", 
              isDark ? "text-red-300" : "text-red-600"
            )} />}
          </div>
      </div>

      {/* Cartoon Content with enhanced styling */}
      <div className={cn(
        "p-3 space-y-3", 
        isDark 
          ? "dark-cartoon-node-content" 
          : "bg-gradient-to-b from-white to-blue-50/50"
      )}> 
        {/* Cartoon Method/URL display */}
        <div className="text-xs font-medium flex items-center space-x-1.5">
          <span className={cn(
            "px-2 py-0.5 rounded-md font-bold border shadow-sm",
            isDark 
              ? "bg-gray-700 text-blue-300 border-blue-500" 
              : "bg-blue-100 text-blue-700 border-blue-300"
          )}>{method}</span>
          <span className={cn(
            "truncate flex-1", 
            isDark ? "text-gray-300" : "text-neutral-600"
          )} title={url}>{url || '[No URL]'}</span>
        </div>

        {/* Cartoon Run Button with enhanced effects */}
        <Button 
          onClick={handleExecuteClick}
          disabled={isRunning}
          size="sm"
          className={cn(
              "w-full h-9 nodrag font-semibold border-2 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-all transform hover:scale-[1.02] shadow-sm",
              // Success state - conditional dark theme
              isDark 
                ? "bg-green-600 hover:bg-green-700 text-white border-green-800" 
                : "bg-lime-500 hover:bg-lime-600 text-white border-lime-700 focus:ring-lime-500",
              // Loading state overrides
              isRunning && (isDark 
                ? "bg-blue-600 hover:bg-blue-600 border-blue-700 text-white cursor-wait" 
                : "bg-blue-400 hover:bg-blue-400 border-blue-500 text-white cursor-wait")
          )}
        >
          {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" /> 
          ) : (
              <Play className="h-4 w-4" />
          )}
          {isRunning ? 'Running...' : 'Run Node'}
        </Button>
      </div>

      {/* Cartoon Source Handle */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="output"
        isConnectable={isConnectable}
        className={cn(
          "!w-3 !h-3 !shadow-md !z-10",
          isDark 
            ? "dark-cartoon-handle dark-cartoon-handle-source" 
            : "!bg-lime-500 !border-2 !border-neutral-800"
        )}
      />
    </div>
  );
}

export const HttpRequestNode = React.memo(HttpRequestNodeComponent);

