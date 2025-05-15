'use client';

import { type NodeProps, Handle, Position } from '@xyflow/react';
import React, { useMemo } from 'react';
import { useFlowStore } from '@/store/index';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import type { PathEntry } from '@/components/shared/path-list-editor';
import { CartoonNodeWrapper } from '@/components/nodes/common/CartoonNodeWrapper';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';
import { nodeConfigMap } from '@/config/node.config';

interface SelectFieldsNodeData {
  label?: string;
  jsonPaths?: PathEntry[];
  [key: string]: any;
}

const defaultNodeData: SelectFieldsNodeData = {
  label: 'Select Fields',
  jsonPaths: [],
};

function SelectFieldsNodeComponent({ data, id, isConnectable }: NodeProps) {
  const { nodeResults } = useFlowStore();
  const executionResult = nodeResults[id];
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const nodeData: SelectFieldsNodeData = useMemo(() => ({ ...defaultNodeData, ...data }), [data]);
  const { label, jsonPaths } = nodeData;
  const config = nodeConfigMap.SelectFieldsNode;

  const activePathCount = useMemo(() => {
    return (jsonPaths || []).filter(p => p.enabled).length;
  }, [jsonPaths]);

  return (
    <>
      {/* Input handle */}
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

        <div className="p-4 text-center">
          <Badge
            variant="outline"
            className="text-sm rounded-lg font-bold border-2 px-3 py-1"
          >
            {activePathCount} / {(jsonPaths || []).length} Paths Active
          </Badge>
        </div>
      </CartoonNodeWrapper>

      {/* Output handle */}
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

export const SelectFieldsNode = React.memo(SelectFieldsNodeComponent);
