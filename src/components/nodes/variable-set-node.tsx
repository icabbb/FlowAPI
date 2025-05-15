'use client';

import { type NodeProps, Handle, Position } from '@xyflow/react';
import React, { useMemo } from 'react';
import { useFlowStore } from '@/store/index';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { nodeConfigMap } from '@/config/node.config';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';
import { CartoonNodeWrapper } from '@/components/nodes/common/CartoonNodeWrapper';

interface VariableSetNodeData {
  label?: string;
  variableName?: string;
  variableValue?: string;
  [key: string]: any;
}

const defaultNodeData: VariableSetNodeData = {
  label: 'Set Variable',
  variableName: 'myVar',
  variableValue: '',
};

function VariableSetNodeComponent({ data, id, isConnectable }: NodeProps) {
  const { nodeResults } = useFlowStore();
  const executionResult = nodeResults[id];
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const nodeData = useMemo(() => ({ ...defaultNodeData, ...data }), [data]);
  const { label, variableName } = nodeData;

  const config = nodeConfigMap.VariableSetNode;

  return (
    <>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-3 !h-3 !shadow-md z-10 bg-yellow-500 border-2 border-neutral-800"
      />

      <CartoonNodeWrapper
        id={id}
        isConnectable={isConnectable}
        status={executionResult?.status}
        variant={config.variant}
      >
        <NodeHeader
          icon={config.icon}
          label={label || config.label}
          status={executionResult?.status}
          dark={isDark}
          variant={config.variant}
        />

        <div
          className=
            'p-3 text-center'
            
        >
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded border inline-block',
              isDark
                ? 'bg-neutral-700 border-yellow-500 text-yellow-200'
                : 'bg-yellow-100 border-yellow-300 text-yellow-700'
            )}
          >
            Set: <code className="font-bold">{variableName || '[Not Set]'}</code>
          </span>
        </div>
      </CartoonNodeWrapper>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        className="!w-3 !h-3 !shadow-md z-10 bg-yellow-500 border-2 border-neutral-800"
      />
    </>
  );
}

export const VariableSetNode = React.memo(VariableSetNodeComponent);
