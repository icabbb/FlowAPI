'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { useFlowStore } from '@/store/index';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface DelayNodeData {
  label?: string;
  delayMs?: number;
  [key: string]: any;
}

const defaultNodeData: Required<DelayNodeData> = {
  label: 'Delay',
  delayMs: 1000,
};

interface DelayNodeSettingsProps {
  node: Node<DelayNodeData>;
}

export function DelayNodeSettings({ node }: DelayNodeSettingsProps) {
  const { updateNodeData } = useFlowStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const nodeId = node.id;

  const [label, setLabel] = useState(node.data?.label ?? defaultNodeData.label);
  const [delayMs, setDelayMs] = useState<number>(node.data?.delayMs ?? defaultNodeData.delayMs);

  useEffect(() => {
    setLabel(node.data?.label ?? defaultNodeData.label);
    setDelayMs(node.data?.delayMs ?? defaultNodeData.delayMs);
  }, [node.id, node.data?.label, node.data?.delayMs]);

  const handleBlur = () => {
    updateNodeData(nodeId, {
      label,
      delayMs: isNaN(delayMs) || delayMs < 0 ? 0 : delayMs,
    });
  };

  // Cartoon border logic: blue in dark, neutral-300 in light
  const cartoonBorder = isDark
    ? "border-blue-500 focus:border-blue-400"
    : "border-neutral-300 focus:border-blue-400";

  return (
    <div className="space-y-6 font-sans">
      <div>
        <label
          htmlFor="label"
          className={cn(
            'text-sm font-bold mb-1.5 block',
            isDark ? 'text-blue-200' : 'text-neutral-700'
          )}
        >
          Label
        </label>
        <input
          id="label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(
            'w-full rounded-xl h-10 px-3 text-sm shadow-cartoon allow-text-selection focus:outline-none border-2',
            isDark
              ? 'bg-[#0f172acc] text-white'
              : 'bg-white text-neutral-800',
            cartoonBorder
          )}
        />
      </div>

      <div>
        <label
          htmlFor="delayMs"
          className={cn(
            'text-sm font-bold mb-1.5 block',
            isDark ? 'text-blue-200' : 'text-neutral-700'
          )}
        >
          Delay Duration (ms)
        </label>
        <input
          id="delayMs"
          type="number"
          min="0"
          value={delayMs}
          onChange={(e) => setDelayMs(parseInt(e.target.value, 10))}
          onBlur={handleBlur}
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(
            'w-full rounded-xl h-10 px-3 text-sm shadow-cartoon border-2 allow-text-selection focus:outline-none',
            isDark
              ? 'bg-[#0f172acc] text-white'
              : 'bg-white text-neutral-800',
            cartoonBorder,
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          )}
        />
        <p className={cn('text-xs mt-1.5', isDark ? 'text-blue-100/70' : 'text-neutral-500')}>
          Enter the pause duration in milliseconds (e.g., 1000 for 1 second).
        </p>
      </div>
    </div>
  );
}
