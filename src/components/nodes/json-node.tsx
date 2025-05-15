'use client';;
import { type NodeProps, Handle, Position } from '@xyflow/react';
import { useFlowStore } from '@/store/index';
import { useTheme } from 'next-themes';
import { Braces, Copy } from 'lucide-react';
import { JsonNodeData } from '@/contracts/types/nodes.types';
import { CartoonNodeWrapper } from '@/components/nodes/common/CartoonNodeWrapper';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import React, { useMemo, useState, useCallback } from 'react';

function JsonNodeComponent({ data, id, isConnectable }: NodeProps) {
  const { nodeResults } = useFlowStore();
  const executionResult = nodeResults[id];
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);

  const nodeData: JsonNodeData = {
    label: 'JSON Output',
    inputData: undefined,
    ...data,
  };

  const { label, inputData } = nodeData;
  const hasData = inputData !== undefined && inputData !== null;

  const dataPreview = useMemo(() => {
    if (!hasData) return 'No data received';
    try {
      return JSON.stringify(inputData, null, 2);
    } catch (e) {
      return '[Invalid JSON]';
    }
  }, [inputData]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(dataPreview).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [dataPreview]);

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        className={cn(
          '!w-3 !h-3 !shadow-md',
          isDark ? '!bg-blue-400 !border-blue-600' : '!bg-blue-500 !border-neutral-800'
        )}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        className={cn(
          '!w-3 !h-3 !shadow-md',
          isDark ? '!bg-lime-400 !border-lime-600' : '!bg-lime-500 !border-neutral-800'
        )}
      />

      <CartoonNodeWrapper
        id={id}
        isConnectable={isConnectable}
        status={executionResult?.status}
        variant="lime"
      >
        <NodeHeader
          icon={Braces}
          label={label || 'JSON Output'}
          status={executionResult?.status}
          dark={isDark}
          variant="lime"
        />

        <div className="p-3 space-y-3">
          <ScrollArea className="h-[150px] max-w-[300px] border-2 rounded-lg">
            <pre
              className={cn(
                'text-xs font-mono whitespace-pre-wrap break-words p-3',
                isDark ? 'text-neutral-300' : 'text-neutral-800'
              )}
            >
              {dataPreview}
            </pre>
          </ScrollArea>

          {hasData && (
            <Button
              onClick={handleCopy}
              size="sm"
              variant="outline"
              className={cn(
                'w-full text-xs font-medium gap-2 justify-center',
                copied && 'border-lime-500 text-lime-600'
              )}
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy JSON'}
            </Button>
          )}

          {executionResult?.status === 'error' && (
            <div
              className={cn(
                'text-xs p-2 rounded-md',
                isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-800'
              )}
            >
              {executionResult.error}
            </div>
          )}

          {executionResult?.status === 'success' && (
            <div
              className={cn(
                'text-xs p-2 rounded-md',
                isDark ? 'bg-lime-900/30 text-lime-300' : 'bg-lime-50 text-lime-800'
              )}
            >
              JSON processed!
            </div>
          )}
        </div>
      </CartoonNodeWrapper>
    </div>
  );
}

export const JsonNode = React.memo(JsonNodeComponent);
