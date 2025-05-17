'use client';

import { useState, useEffect, useCallback } from 'react';
import { Node } from '@xyflow/react';
import { useFlowStore } from '@/store/index';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Repeat } from "lucide-react";

interface LoopNodeData {
  label?: string;
  inputArrayPath?: string;
  [key: string]: any;
}

const defaultLoopData: LoopNodeData = {
  label: 'Loop',
  inputArrayPath: '$[*]',
};

interface LoopNodeSettingsProps {
  node: Node<LoopNodeData>;
}

export function LoopNodeSettings({ node }: LoopNodeSettingsProps) {
  const { updateNodeData } = useFlowStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const nodeId = node.id;

  // State
  const [label, setLabel] = useState(node.data?.label ?? defaultLoopData.label);
  const [inputArrayPath, setInputArrayPath] = useState(node.data?.inputArrayPath ?? defaultLoopData.inputArrayPath);

  useEffect(() => {
    setLabel(node.data?.label ?? defaultLoopData.label);
    setInputArrayPath(node.data?.inputArrayPath ?? defaultLoopData.inputArrayPath);
  }, [node.id, node.data?.label, node.data?.inputArrayPath]);

  // Update label on blur
  const handleLabelChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(event.target.value);
  }, []);
  const handleLabelBlur = useCallback(() => {
    if (node.data?.label !== label) {
      updateNodeData(nodeId, { label });
    }
  }, [nodeId, label, node.data?.label, updateNodeData]);
  // Update path on blur
  const handlePathChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInputArrayPath(event.target.value);
  }, []);
  const handlePathBlur = useCallback(() => {
    if (node.data?.inputArrayPath !== inputArrayPath) {
      updateNodeData(nodeId, { inputArrayPath });
    }
  }, [nodeId, inputArrayPath, node.data?.inputArrayPath, updateNodeData]);

  // Cartoon card color and border
  const cartoonCard = isDark
    ? "bg-[#192844] border-blue-400/80 shadow-[0_8px_30px_4px_rgba(8,45,126,0.13)]"
    : "bg-white border-neutral-300 shadow-[0_8px_24px_2px_rgba(80,80,80,0.09)]";

  return (
    <div className={cn(
      "rounded-2xl border-2 p-6 flex flex-col gap-6 font-sans relative",
      cartoonCard
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Repeat className={cn("h-5 w-5 flex-shrink-0", isDark ? "text-blue-300" : "text-neutral-500")} />
        <span className={cn("text-lg font-bold", isDark ? "text-blue-100" : "text-neutral-800")}>
          Loop Node
        </span>
      </div>
      {/* Label */}
      <div>
        <Label
          htmlFor="label"
          className={cn(
            "text-sm font-semibold mb-1.5 block",
            isDark ? "text-blue-200" : "text-neutral-800"
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
          onMouseDown={e => e.stopPropagation()}
          className={cn(
            "w-full rounded-lg focus:outline-none h-10 px-3 text-sm shadow border-2 font-semibold transition-all",
            isDark
              ? "bg-[#15243a] border-blue-400/80 text-blue-100 focus:border-blue-300"
              : "bg-white border-neutral-300 text-neutral-900 focus:border-blue-400"
          )}
        />
      </div>
      {/* Input Array Path */}
      <div>
        <Label
          htmlFor="inputArrayPath"
          className={cn(
            "text-sm font-semibold mb-1.5 block",
            isDark ? "text-blue-200" : "text-neutral-800"
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
          onMouseDown={e => e.stopPropagation()}
          className={cn(
            "w-full rounded-lg focus:outline-none h-10 px-3 text-sm shadow border-2 font-mono transition-all",
            isDark
              ? "bg-[#15243a] border-blue-400/80 text-blue-100 focus:border-blue-300"
              : "bg-white border-neutral-300 text-neutral-900 focus:border-blue-400"
          )}
        />
        <p className={cn(
          "text-xs mt-1.5",
          isDark ? "text-blue-100/70" : "text-neutral-600"
        )}>
          Specify the JSONPath to the array you want to iterate over in the incoming data. <br />
          Use <span className="font-mono px-1 bg-blue-100/80 rounded">{"$[*]"}</span> for the root array.
        </p>
      </div>
    </div>
  );
}
