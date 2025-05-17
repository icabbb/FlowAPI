'use client';;
import { type NodeProps, Handle, Position } from '@xyflow/react';
import React, { useMemo } from 'react';
import { useFlowStore } from '@/store/index';
import { useTheme } from 'next-themes';
import { CartoonNodeWrapper } from '@/components/nodes/common/CartoonNodeWrapper';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';
import { cn } from '@/lib/utils';
import { nodeConfigMap } from '@/config/node.config';

interface ConditionRule {
  id: string;
  expression: string;
  outputHandleId: string;
}

interface ConditionalNodeData {
  label?: string;
  conditions?: ConditionRule[];
  defaultOutputHandleId?: string;
  [key: string]: any;
}

const defaultConditionalData: ConditionalNodeData = {
  label: 'If Condition',
  conditions: [
    { id: crypto.randomUUID(), expression: 'true', outputHandleId: 'true' }
  ],
  defaultOutputHandleId: 'default',
};

function ConditionalNodeComponent({ data, id, isConnectable }: NodeProps) {
  const { nodeResults } = useFlowStore();
  const executionResult = nodeResults[id];
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const config = nodeConfigMap.ConditionalNode;
  const nodeData: ConditionalNodeData = useMemo(() => ({ ...defaultConditionalData, ...data }), [data]);
  const { label } = nodeData;

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
        label={label || 'If Condition'}
        status={executionResult?.status}
        dark={isDark}
        variant={config.variant}
      />

      <div className=
        'p-3 text-center text-xs italic'
        >
        
        Branches execution based on conditions.
      </div>
    </CartoonNodeWrapper>
    {(nodeData.conditions || []).map((cond, idx) => (
  <Handle
    key={cond.outputHandleId}
    type="source"
    position={Position.Right}
    id={cond.outputHandleId} // <-- Esto hace dinámico el id
    isConnectable={isConnectable}
    className={cn(
      '!w-3 !h-3 !shadow-md !z-10',
      isDark ? '!bg-pink-500 !border-pink-400' : '!bg-pink-500 !border-neutral-800'
    )}
    style={{ top: `${30 + idx * 20}%` }} // Distribuye verticalmente
  />
))}

{/* Renderiza el default al final */}
<Handle
  type="source"
  position={Position.Right}
  id={nodeData.defaultOutputHandleId || 'default'}
  isConnectable={isConnectable}
  className={cn(
    '!w-3 !h-3 !shadow-md !z-10',
    isDark ? '!bg-gray-500 !border-gray-400' : '!bg-gray-500 !border-neutral-800'
  )}
  style={{ top: `${30 + (nodeData.conditions?.length ?? 0) * 20}%` }}
/>
    </>
  );
}

export const ConditionalNode = React.memo(ConditionalNodeComponent);
export type { ConditionalNodeData, ConditionRule };
