'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import React from 'react';
import { useFlowStore } from '@/store/index';
import { cn } from '@/lib/utils';
import { Loader2, Play, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthConfig } from '@/components/shared/auth-settings';
import { useTheme } from 'next-themes';
import { CartoonNodeWrapper } from '@/components/nodes/common/CartoonNodeWrapper';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';

interface KeyValueEntry {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}
interface HttpRequestNodeData {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  label: string;
  queryParams?: KeyValueEntry[];
  headers?: KeyValueEntry[];
  bodyType?: 'none' | 'json' | 'text';
  body?: string;
  auth?: AuthConfig;
}

function HttpRequestNodeComponent({ data, id, isConnectable }: NodeProps) {
  const { nodeResults, executeSingleNode } = useFlowStore();
  const executionResult = nodeResults[id];
  const isRunning = executionResult?.status === 'loading';
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const nodeData: HttpRequestNodeData = {
    method: 'GET',
    url: '',
    label: 'HTTP Request',
    queryParams: [],
    headers: [],
    bodyType: 'none',
    body: '',
    auth: { type: 'none' },
    ...data,
  };

  const { method, url, label, auth } = nodeData;

  const handleExecuteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isRunning) {
      executeSingleNode(id);
    }
  };

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
        variant="blue"
      >
        <NodeHeader
          icon={Lock}
          label={label}
          status={executionResult?.status === 'idle' ? undefined : executionResult?.status}
          dark={isDark}
          variant="blue"
        />

        <div
          className=
            'p-3 space-y-3'
            
        >
          <div className="text-xs font-medium flex items-center space-x-1.5">
            <span
              className={cn(
                'px-2 py-0.5 rounded-md font-bold border shadow-sm',
                isDark
                  ? 'bg-gray-700 text-blue-300 border-blue-500'
                  : 'bg-blue-100 text-blue-700 border-blue-300'
              )}
            >
              {method}
            </span>
            <span
              className={cn('truncate flex-1', isDark ? 'text-gray-300' : 'text-neutral-600')}
              title={url}
            >
              {url || '[No URL]'}
            </span>
          </div>

          <Button
            onClick={handleExecuteClick}
            disabled={isRunning}
            size="sm"
            className={cn(
              'w-full h-9 nodrag font-semibold border-2 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-all transform hover:scale-[1.02] shadow-sm',
              isDark
                ? 'bg-green-600 hover:bg-green-700 text-white border-green-800'
                : 'bg-lime-500 hover:bg-lime-600 text-white border-lime-700 focus:ring-lime-500',
              isRunning &&
                (isDark
                  ? 'bg-blue-600 hover:bg-blue-600 border-blue-700 text-white cursor-wait'
                  : 'bg-blue-400 hover:bg-blue-400 border-blue-500 text-white cursor-wait')
            )}
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isRunning ? 'Running...' : 'Run Node'}
          </Button>
        </div>
      </CartoonNodeWrapper>
    </div>
  );
}

export const HttpRequestNode = React.memo(HttpRequestNodeComponent);
