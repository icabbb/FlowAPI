'use client';;
import { type NodeProps, Handle, Position } from '@xyflow/react';
import React, { useMemo } from 'react';
import { useFlowStore } from '@/store/index';
import { useTheme } from 'next-themes';
import { nodeConfigMap } from '@/config/node.config';
import { CartoonNodeWrapper } from '@/components/nodes/common/CartoonNodeWrapper';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';

interface MappingRule {
  id: string;
  inputPath: string;
  outputPath: string;
  enabled: boolean;
}

interface TransformNodeData {
  label?: string;
  mappingRules?: MappingRule[];
  [key: string]: any;
}

const defaultNodeData: TransformNodeData = {
  label: 'Transform Data',
  mappingRules: [],
};

function TransformNodeComponent({ data, id, isConnectable }: NodeProps) {
  const { nodeResults } = useFlowStore();
  const executionResult = nodeResults[id];
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const nodeData = useMemo(() => ({ ...defaultNodeData, ...data }), [data]);
  const { label, mappingRules } = nodeData;

  const activeRuleCount = (mappingRules || []).filter((r: MappingRule) => r.enabled).length;
  const config = nodeConfigMap.TransformNode;

  return (
    <>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-3 !h-3 !shadow-md z-10 bg-blue-500 border-2 border-neutral-800"
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
            className=
              'text-xs font-medium px-2 py-1 rounded border inline-block'
              
          >
            {activeRuleCount} Active Rule(s)
          </span>
        </div>
      </CartoonNodeWrapper>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        className="!w-3 !h-3 !shadow-md z-10 bg-purple-500 border-2 border-neutral-800"
      />
    </>
  );
}

export const TransformNode = React.memo(TransformNodeComponent);
export type { TransformNodeData, MappingRule };
