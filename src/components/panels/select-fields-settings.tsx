'use client';;
import { useState, useEffect, useCallback } from 'react';
import { Node } from '@xyflow/react';
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { PathListEditor, type PathEntry } from '@/components/shared/path-list-editor';
import { useFlowStore } from '@/store/index';
import { NodeResult } from '@/contracts/types';
import { CheckCircle2, Loader2, AlertCircle, Info } from "lucide-react";
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

// Define the expected data structure for this node
interface SelectFieldsNodeData {
  label?: string;
  jsonPaths?: PathEntry[];
  [key: string]: any; 
}

// Default data for initialization
const defaultFormData: SelectFieldsNodeData = {
  label: 'Select Fields',
  jsonPaths: [],
};

interface SelectFieldsSettingsProps {
  node: Node<SelectFieldsNodeData>; 
  executionResult: NodeResult | undefined;
}

export function SelectFieldsSettings({ node, executionResult }: SelectFieldsSettingsProps) {
  const { updateNodeData } = useFlowStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [label, setLabel] = useState(node.data?.label || defaultFormData.label);
  const nodeId = node.id;

  // Sync label state with node data
  useEffect(() => {
    setLabel(node.data?.label || defaultFormData.label);
  }, [node.data?.label]);

  // --- Callbacks ---
  const handleLabelChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(event.target.value);
  }, []);

  const handleLabelBlur = useCallback(() => {
    if (node.data?.label !== label) {
      updateNodeData(nodeId, { label: label });
    }
  }, [nodeId, label, node.data?.label, updateNodeData]);

  const handlePathsChange = useCallback((newPaths: PathEntry[]) => {
    updateNodeData(nodeId, { jsonPaths: newPaths });
  }, [nodeId, updateNodeData]);

  // --- Render Logic --- 
  return (
    <div className="space-y-5 font-sans">
      {/* Label Setting - Replace Label and Input */}
      <div>
        {/* Replace Label */}
        <label 
          htmlFor="label" 
          className={cn(
            "text-sm font-semibold mb-1.5 block",
            isDark ? "text-blue-200" : "text-neutral-700"
          )}
        >
          Label
        </label>
        {/* Replace Input */}
        <input
          id="label"
          name="label"
          type="text"
          value={label}
          onChange={handleLabelChange}
          onBlur={handleLabelBlur}
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(
            "w-full rounded-lg focus:outline-none h-10 px-3 text-sm shadow-sm",
            "allow-text-selection",
            isDark 
              ? "bg-neutral-800 border-2 border-amber-500/70 text-white focus:border-amber-400 placeholder:text-blue-200/50" 
              : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-amber-500"
          )}
        />
      </div>
      
      {/* JSONPath Expressions Section - Cartoon Style with Dark Mode */}
      <div className={cn(
        "space-y-3 p-4 rounded-lg shadow-sm border-2",
        isDark 
          ? "bg-neutral-800 border-blue-500"
          : "bg-white border-neutral-800"
      )}>
        <h3 className={cn(
          "text-sm font-semibold",
          isDark ? "text-blue-200" : "text-neutral-800"
        )}>
          JSONPath Expressions
        </h3>
        <p className={cn(
          "text-xs",
          isDark ? "text-blue-100/70" : "text-neutral-600"
        )}>
          Define JSONPath expressions to extract specific values from the input JSON.
        </p>
        {/* PathListEditor now supports dark mode internally */}
        <PathListEditor
          title=""
          entries={node.data?.jsonPaths || []}
          onChange={handlePathsChange}
          pathPlaceholder="e.g., $.users[*].name"
        />
      </div>

      {/* Execution Info Section (Conditional) */}
      {executionResult && (
        <div className={cn(
          "space-y-3 pt-4 border-t-2",
          isDark ? "border-blue-500/30" : "border-neutral-200"
        )}>
          <h4 className={cn(
            "text-xs uppercase tracking-wider font-semibold",
            isDark ? "text-blue-100/60" : "text-neutral-500"
          )}>
            Execution Info
          </h4>
          
          {/* Status Alerts - Cartoon Style with Dark Mode */}
          {executionResult.status === 'idle' ? (
            <Alert variant="default" className={cn(
              "p-3 text-sm rounded-xl flex items-center gap-2 shadow-sm",
              isDark 
                ? "bg-neutral-800 border-2 border-blue-500 text-blue-200"
                : "bg-neutral-100 border-2 border-neutral-800 text-neutral-600"
            )}>
              <Info className="h-4 w-4 flex-shrink-0" />
              Awaiting execution. Connect input and run the flow.
            </Alert>
          ) : executionResult.status === 'error' ? (
            <Alert variant="destructive" className={cn(
              "p-3 text-sm rounded-xl flex items-start gap-2 shadow-sm",
              isDark 
                ? "bg-red-900/30 border-2 border-red-700 text-red-300"
                : "bg-red-100 border-2 border-red-700 text-red-800"
            )}>
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <AlertDescription className="font-medium">
                {executionResult.error || 'Failed to execute node.'}
              </AlertDescription>
            </Alert>
          ) : executionResult.status === 'success' ? (
            <Alert variant="default" className={cn(
              "p-3 text-sm rounded-xl flex items-center gap-2 shadow-sm",
              isDark 
                ? "bg-green-900/30 border-2 border-green-600 text-green-300"
                : "bg-lime-100 border-2 border-lime-700 text-lime-900"
            )}>
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">Successfully selected fields.</span>
            </Alert>
          ) : executionResult.status === 'loading' ? (
            <Alert variant="default" className={cn(
              "p-3 text-sm rounded-xl flex items-center gap-2 shadow-sm",
              isDark 
                ? "bg-blue-900/30 border-2 border-blue-700 text-blue-300"
                : "bg-blue-100 border-2 border-blue-700 text-blue-800"
            )}>
              <Loader2 className="h-4 w-4 animate-spin"/> 
              <span className="font-medium">Selecting fields...</span>
            </Alert>
          ) : null}
          
          {/* Timestamp - Dark Mode */}
          {executionResult.timestamp && (
            <p className={cn(
              "text-xs",
              isDark ? "text-blue-100/60" : "text-neutral-500"
            )}>
              Last updated: {new Date(executionResult.timestamp).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Consider adding React.memo if performance becomes an issue
// export default memo(SelectFieldsSettings); 