'use client';

import { useState, useEffect, useCallback } from 'react';
import { Node } from '@xyflow/react';
import { useFlowStore } from '@/store/index';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Interfaces (Matching LoopNodeData) ---
interface LoopNodeData {
  label?: string;
  inputArrayPath?: string;
  [key: string]: any;
}

const defaultLoopData: LoopNodeData = {
  label: 'Loop',
  inputArrayPath: '$[*]',
};
// --- End Interfaces ---

interface LoopNodeSettingsProps {
  node: Node<LoopNodeData>;
}

export function LoopNodeSettings({ node }: LoopNodeSettingsProps) {
  const { updateNodeData } = useFlowStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const nodeId = node.id;

  // State for form fields
  const [label, setLabel] = useState(node.data?.label ?? defaultLoopData.label);
  const [inputArrayPath, setInputArrayPath] = useState(node.data?.inputArrayPath ?? defaultLoopData.inputArrayPath);

  // Sync state when the selected node changes
  useEffect(() => {
    setLabel(node.data?.label ?? defaultLoopData.label);
    setInputArrayPath(node.data?.inputArrayPath ?? defaultLoopData.inputArrayPath);
  }, [node.id, node.data?.label, node.data?.inputArrayPath]);

  // --- Callbacks for updating store on blur --- 
  const handleLabelChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(event.target.value);
  }, []);

  const handleLabelBlur = useCallback(() => {
    if (node.data?.label !== label) {
      updateNodeData(nodeId, { label: label });
    }
  }, [nodeId, label, node.data?.label, updateNodeData]);

  const handlePathChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInputArrayPath(event.target.value);
  }, []);

  const handlePathBlur = useCallback(() => {
    if (node.data?.inputArrayPath !== inputArrayPath) {
      updateNodeData(nodeId, { inputArrayPath: inputArrayPath });
    }
  }, [nodeId, inputArrayPath, node.data?.inputArrayPath, updateNodeData]);

  // --- Render Logic --- 
  return (
    <div className="space-y-5 font-sans">
      {/* Label Setting */}
      <div>
        <Label 
          htmlFor="label" 
          className={cn(
            "text-sm font-semibold mb-1.5 block",
            isDark ? "text-orange-200" : "text-neutral-700" // Use orange theme color
          )}
        >
          Label
        </Label>
        <Input
          id="label"
          name="label"
          type="text"
          value={label}
          onChange={handleLabelChange}
          onBlur={handleLabelBlur}
          onMouseDown={(e) => e.stopPropagation()} 
          className={cn(
            "w-full rounded-lg focus:outline-none h-10 px-3 text-sm shadow-sm border-2",
            "allow-text-selection",
            isDark 
              ? "bg-[#0f172acc] border-orange-500/70 text-white focus:border-orange-400"
              : "bg-white border-neutral-800 text-neutral-800 focus:border-orange-500"
          )}
        />
      </div>

      {/* Input Array Path Setting */}
      <div>
        <Label 
          htmlFor="inputArrayPath"
          className={cn(
            "text-sm font-semibold mb-1.5 block",
            isDark ? "text-orange-200" : "text-neutral-700"
          )}
        >
          Input Array Path (JSONPath)
        </Label>
        <Input
          id="inputArrayPath"
          name="inputArrayPath"
          type="text"
          placeholder="e.g., $.data.items[*] or $..users"
          value={inputArrayPath}
          onChange={handlePathChange}
          onBlur={handlePathBlur}
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(
            "w-full rounded-lg focus:outline-none h-10 px-3 text-sm shadow-sm border-2 font-mono",
            "allow-text-selection",
            isDark 
              ? "bg-[#0f172acc] border-orange-500/70 text-white focus:border-orange-400"
              : "bg-white border-neutral-800 text-neutral-800 focus:border-orange-500"
          )}
        />
         <p className={cn(
          "text-xs mt-1.5",
          isDark ? "text-orange-100/70" : "text-neutral-500"
        )}>
          Specify the JSONPath to the array you want to iterate over in the incoming data. Use \`$[*]\` for the root array.
        </p>
      </div>
    </div>
  );
} 