'use client';

import { type NodeProps, Handle, Position } from '@xyflow/react';
import React, { useCallback, useMemo } from 'react';
import { useFlowStore } from '@/store/index';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  FileText,
  FileJson,
  Table,
  FileBadge,
  FileType,
  Play,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExportNodeData } from '@/contracts/types/nodes.types';
import { CartoonNodeWrapper } from '@/components/nodes/common/CartoonNodeWrapper';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';
import { nodeConfigMap } from '@/config/node.config';

function ExportNodeComponent({ data, id, isConnectable }: NodeProps) {
  const { nodeResults, executeSingleNode } = useFlowStore();
  const executionResult = nodeResults[id];
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const config = nodeConfigMap.ExportNode;

  const nodeData: ExportNodeData = {
    label: 'Export',
    exportFormat: 'csv',
    fileName: 'exported-data',
    includeTimestamp: true,
    flatten: true,
    customSeparator: ',',
    ...data,
  };

  const { label, exportFormat, fileName, includeTimestamp } = nodeData;

  const FormatIcon = useMemo(() => {
    switch (exportFormat) {
      case 'csv': return Table;
      case 'json': return FileJson;
      case 'txt': return FileText;
      case 'html': return FileBadge;
      case 'markdown': return FileType;
      default: return FileText;
    }
  }, [exportFormat]);

  const handleExecute = useCallback(() => {
    executeSingleNode(id);
  }, [executeSingleNode, id]);

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-3 !h-3 !shadow-md z-10 bg-purple-500 border-2 border-neutral-800"
      />

      <CartoonNodeWrapper
        id={id}
        isConnectable={isConnectable}
        status={executionResult?.status}
        variant={config.variant}
      >
        <NodeHeader
          icon={FormatIcon}
          label={label || 'Export'}
          status={executionResult?.status}
          dark={isDark}
          variant={config.variant}
        />

        <div className="p-3 space-y-3">
          <div className="flex flex-col gap-1">
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              File name:
            </div>
            <div className={cn(
              'text-sm font-mono truncate',
              isDark ? 'text-purple-300' : 'text-purple-800'
            )}>
              {`${fileName}${includeTimestamp ? '_${timestamp}' : ''}.${exportFormat}`}
            </div>
          </div>

          {executionResult?.status === 'error' && (
            <div className=
              'text-xs p-2 rounded-md'
              
            >
              {executionResult.error}
            </div>
          )}

          {executionResult?.status === 'success' && (
            <div className={cn(
              'text-xs p-2 rounded-md',
              isDark ? 'bg-lime-900/30 text-lime-300' : 'bg-lime-50 text-lime-800'
            )}>
              Export completed!
            </div>
          )}
        </div>

        <div className="p-3 pt-2 flex justify-between items-center border-t">
          <Badge className=
            'px-2 text-xs rounded-lg border border-purple-200 uppercase'
            
          >
            {exportFormat}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 rounded-lg border-2 shadow-sm',
              isDark
                ? 'border-purple-500 bg-purple-800/30 text-purple-300 hover:bg-purple-700/50'
                : 'border-purple-500 bg-white text-purple-800 hover:bg-purple-100'
            )}
            onClick={handleExecute}
            disabled={executionResult?.status === 'loading'}
          >
            {executionResult?.status === 'loading' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Play className="h-3.5 w-3.5 mr-1" />
                <span>Export</span>
              </>
            )}
          </Button>
        </div>
      </CartoonNodeWrapper>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        className="!w-3 !h-3 !shadow-md z-10 bg-lime-500 border-2 border-neutral-800"
      />
    </>
  );
}

export const ExportNode = React.memo(ExportNodeComponent);
