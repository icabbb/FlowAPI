'use client';;
import { type NodeProps, Handle, Position } from '@xyflow/react';
import { useFlowStore } from '@/store/index';
import { useTheme } from 'next-themes';
import { CartoonNodeWrapper } from '@/components/nodes/common/CartoonNodeWrapper';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';
import { cn } from '@/lib/utils';
import React from 'react';
import { nodeConfigMap } from '@/config/node.config';

export interface LoopNodeData {
  label?: string;
  inputArrayPath?: string;
  [key: string]: any;
}

const defaultLoopData: Partial<LoopNodeData> = {
  label: 'Loop',
  inputArrayPath: ''
};

function LoopNodeComponent({ data, id, isConnectable }: NodeProps) {
  const { nodeResults } = useFlowStore();
  const executionResult = nodeResults[id];
  const status = executionResult?.status ?? 'idle';
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const config = nodeConfigMap.LoopNode;

  const nodeData: LoopNodeData = {
    ...defaultLoopData,
    ...data,
  };

  const { label, inputArrayPath } = nodeData;

  return (
    <div className="relative">
      {/* Handles outside of wrapper */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        className={cn(
          '!w-3 !h-3 !shadow-md',
          isDark ? '!bg-blue-400 !border-blue-600' : '!bg-blue-500 !border-neutral-800'
        )}
        style={{ top: '50%' }}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="loopBody"
        isConnectable={isConnectable}
        className={cn(
          '!w-3 !h-3 !shadow-md',
          isDark ? '!bg-gray-400 !border-gray-600' : '!bg-gray-500 !border-neutral-800'
        )}
        style={{ top: '35%' }}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="loopEnd"
        isConnectable={isConnectable}
        className={cn(
          '!w-3 !h-3 !shadow-md',
          isDark ? '!bg-gray-400 !border-gray-600' : '!bg-gray-500 !border-neutral-800'
        )}
        style={{ top: '65%' }}
      />

      {/* Cartoon styled content */}
      <CartoonNodeWrapper
        id={id}
        isConnectable={isConnectable}
        status={status}
        variant={config.variant}
      >
        <NodeHeader
          icon={config.icon}
          label={label || 'Loop'}
          status={status === 'idle' ? undefined : status}
          dark={isDark}
          variant={config.variant}
        />

        <div className=
          'p-3 text-center text-xs'>
          Iterate over: <code className="font-semibold font-mono break-all">{inputArrayPath || '[Not Set]'}</code>
        </div>
      </CartoonNodeWrapper>
    </div>
  );
}

export const LoopNode = React.memo(LoopNodeComponent);
