'use client';

import { Position, Handle, type NodeProps } from '@xyflow/react';
import React from 'react';
import { useFlowStore } from '@/store/index';
import { useTheme } from 'next-themes';
import { CartoonNodeWrapper } from '@/components/nodes/common/CartoonNodeWrapper';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';
import { cn } from '@/lib/utils';
import { nodeConfigMap } from '@/config/node.config';

interface DelayNodeData {
  label?: string;
  delayMs?: number;
}

const defaultNodeData: Required<DelayNodeData> = {
  label: 'Delay',
  delayMs: 1000,
};

function DelayNodeComponent({ data, id, isConnectable }: NodeProps) {
  const { nodeResults } = useFlowStore();
  const executionResult = nodeResults[id];
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const config = nodeConfigMap.DelayNode;

  const nodeData = {
    ...defaultNodeData,
    ...(data || {}),
  } as Required<DelayNodeData>;

  const { label, delayMs } = nodeData;
  const displayDelay = delayMs >= 1000 ? `${(delayMs / 1000).toFixed(1)}s` : `${delayMs}ms`;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className={cn(
          '!w-3 !h-3 !shadow-md !z-10',
          isDark ? '!bg-blue-400 !border-blue-600' : '!bg-blue-500 !border-neutral-800'
        )}
        style={{ top: '50%' }}
      />
      <CartoonNodeWrapper
        id={id}
        isConnectable={isConnectable}
        status={executionResult?.status}
        variant={config.variant}
      >
        <NodeHeader
          icon={config.icon}
          label={label}
          status={executionResult?.status}
          dark={isDark}
          variant={config.variant}
        />
        <div className="p-4 text-center">
          <span
            className={cn(
              'text-lg font-bold',
              isDark ? 'text-yellow-200' : 'text-yellow-700'
            )}
          >
            {displayDelay}
          </span>
        </div>
      </CartoonNodeWrapper>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        className={cn(
          '!w-3 !h-3 !shadow-md !z-10',
          isDark ? '!bg-yellow-400 !border-yellow-600' : '!bg-yellow-500 !border-neutral-800'
        )}
        style={{ top: '50%' }}
      />
    </>
  );
}

export const DelayNode = React.memo(DelayNodeComponent);
