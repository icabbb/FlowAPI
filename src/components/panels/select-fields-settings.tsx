'use client';

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

interface SelectFieldsNodeData {
  label?: string;
  jsonPaths?: PathEntry[];
  [key: string]: any;
}

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

  useEffect(() => {
    setLabel(node.data?.label || defaultFormData.label);
  }, [node.data?.label]);

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

  // Borders cartoon style
  const cartoonBorder = isDark ? "border-blue-400" : "border-neutral-300";

  return (
    <div className="space-y-6 font-sans">
      {/* Node Label */}
      <div>
        <label
          htmlFor="label"
          className={cn(
            "text-sm font-semibold mb-1 block",
            isDark ? "text-blue-100" : "text-neutral-700"
          )}
        >
          Node Label
        </label>
        <input
          id="label"
          name="label"
          type="text"
          value={label}
          onChange={handleLabelChange}
          onBlur={handleLabelBlur}
          onMouseDown={e => e.stopPropagation()}
          className={cn(
            "w-full h-10 rounded-xl px-4 border-2 shadow-cartoon text-sm allow-text-selection focus:outline-none",
            isDark ? "bg-[#0f172acc] border-blue-400 text-white focus:border-blue-300" : "bg-white border-neutral-800 text-neutral-800 focus:border-blue-500"
          )}
        />
      </div>

      {/* JSONPath Expressions */}
      <div
        className={cn(
          "rounded-2xl border-2 shadow-cartoon p-4 space-y-3",
          isDark ? "bg-[#222d46] border-blue-400" : "bg-white border-neutral-300"
        )}
      >
        <h3 className={cn(
          "text-base font-bold flex items-center gap-2",
          isDark ? "text-blue-100" : "text-neutral-900"
        )}>
          JSONPath Expressions
        </h3>
        <p className={cn(
          "text-xs mb-2",
          isDark ? "text-blue-100/70" : "text-neutral-600"
        )}>
          Define JSONPath expressions to extract values from your JSON.
        </p>
        <PathListEditor
          title=""
          entries={node.data?.jsonPaths || []}
          onChange={handlePathsChange}
          pathPlaceholder="e.g., $.users[*].name"
        />
      </div>

      {/* Execution Info */}
      {executionResult && (
        <div className={cn("space-y-2 pt-3")}>
          <div className={cn(
            "text-xs uppercase tracking-wider font-semibold mb-1",
            isDark ? "text-blue-100/60" : "text-neutral-500"
          )}>
            Execution Info
          </div>
          {executionResult.status === 'idle' && (
            <Alert className={cn(
              "p-3 rounded-xl flex items-center gap-2 shadow",
              isDark ? "bg-neutral-800 border-blue-400 text-blue-200" : "bg-neutral-100 border-neutral-800 text-neutral-700"
            )}>
              <Info className="h-4 w-4 flex-shrink-0" />
              <span>Awaiting execution. Connect input and run the flow.</span>
            </Alert>
          )}
          {executionResult.status === 'error' && (
            <Alert className={cn(
              "p-3 rounded-xl flex items-start gap-2 shadow",
              isDark ? "bg-red-900/30 border-red-700 text-red-300" : "bg-red-100 border-red-700 text-red-800"
            )}>
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <AlertDescription className="font-medium">
                {executionResult.error || 'Failed to execute node.'}
              </AlertDescription>
            </Alert>
          )}
          {executionResult.status === 'success' && (
            <Alert className={cn(
              "p-3 rounded-xl flex items-center gap-2 shadow",
              isDark ? "bg-green-900/30 border-green-600 text-green-300" : "bg-lime-100 border-lime-700 text-lime-900"
            )}>
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">Successfully selected fields.</span>
            </Alert>
          )}
          {executionResult.status === 'loading' && (
            <Alert className={cn(
              "p-3 rounded-xl flex items-center gap-2 shadow",
              isDark ? "bg-blue-900/30 border-blue-700 text-blue-200" : "bg-blue-100 border-blue-700 text-blue-800"
            )}>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">Selecting fields...</span>
            </Alert>
          )}
          {executionResult.timestamp && (
            <p className={cn("text-xs mt-1", isDark ? "text-blue-100/60" : "text-neutral-500")}>
              Last updated: {new Date(executionResult.timestamp).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
