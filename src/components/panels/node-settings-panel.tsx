'use client';

import {
  CheckCircle2,
  Loader2,
  Settings,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFlowStore } from '@/store';
import { Node } from '@xyflow/react';
import { NodeResult } from '@/contracts/types';
import { useMemo, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

/* ────────────────────────────────────── */

import { SelectFieldsSettings } from './select-fields-settings';
import { HttpRequestSettings } from './http-request-settings';
import { JsonNodeSettings } from './json-node-settings';
import { DelayNodeSettings } from './delay-node-settings';
import { VariableSetSettings } from './variable-set-settings';
import { TransformNodeSettings } from './transform-node-settings';
import { LoopNodeSettings } from './loop-node-settings';
import { ConditionalNodeSettings } from './conditional-node-settings';
import { ExportNodeSettings } from './export-node-settings';

/* -------------------------------------------------------------------------- */

export function NodeSettingsPanel() {
  const { selectedNodeId, nodes, nodeResults } = useFlowStore();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const selectedNode = useMemo(
    () => nodes?.find((n: Node) => n.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  const execution: NodeResult | undefined =
    selectedNodeId ? nodeResults[selectedNodeId] || undefined : undefined;

  if (!mounted)
    return (
      <aside className={cn(
        'h-full w-full animate-pulse border-l-2 shadow-inner',
        theme === 'dark' ? 'bg-[#0f172acc] border-blue-500/40' : 'bg-white border-neutral-800/40'
      )}/>
    );

  if (!selectedNode)
    return (
      <aside className={cn(
        'flex h-full w-full items-center justify-center p-6 text-muted-foreground border-l-2',
        theme === 'dark' ? 'bg-[#0f172acc] border-blue-500/40' : 'bg-white border-neutral-800/40'
      )}>
        <div className="text-center">
          <Settings className="mx-auto mb-2 size-6" />
          <p className="text-sm font-medium">
            Select a node to edit its settings
          </p>
        </div>
      </aside>
    );

  /* ——————— Helpers ——————— */
  const isDark = theme === 'dark';
  const Panel = (() => {
    switch (selectedNode.type) {
      case 'httpRequest':
        return <HttpRequestSettings node={selectedNode as any} />;
      case 'jsonNode':
        return (
          <JsonNodeSettings node={selectedNode as any} executionResult={execution} />
        );
      case 'selectFields':
        return (
          <SelectFieldsSettings node={selectedNode as any} executionResult={execution} />
        );
      case 'delayNode':
        return <DelayNodeSettings node={selectedNode as any} />;
      case 'variableSetNode':
        return <VariableSetSettings node={selectedNode as any} />;
      case 'transformNode':
        return <TransformNodeSettings node={selectedNode as any} />;
      case 'conditionalNode':
        return <ConditionalNodeSettings node={selectedNode as any} />;
      case 'loop':
        return <LoopNodeSettings node={selectedNode as any} />;
      case 'exportNode':
        return <ExportNodeSettings node={selectedNode as any} />;
      default:
        return (
          <p className="text-sm text-muted-foreground">
            No settings available for this node.
          </p>
        );
    }
  })();

  /* ——————— UI ——————— */
  return (
    <aside
      className={cn(
        'flex h-full flex-col border-l-2 shadow-lg',
        isDark
          ? 'bg-[#0f172acc] border-blue-500/40'
          : 'bg-white border-neutral-800/40'
      )}
    >
      {/* Header */}
      <header
        className={cn(
          'flex flex-col gap-1 p-4 border-b-2',
          isDark ? 'border-blue-500/40' : 'border-neutral-800/40'
        )}
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Settings className="size-5" />
          {(typeof selectedNode.data?.label === 'string'
            ? selectedNode.data.label
            : '') ||
            (selectedNode.type && selectedNode.type.replace(/([A-Z])/g, ' $1').trim())}
        </h2>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="font-mono">ID: {selectedNode.id}</span>
          <span className="capitalize">Type: {selectedNode.type}</span>
        </div>

        {execution?.status && execution.status !== 'idle' && (
          <Badge
            variant={
              execution.status === 'success'
                ? 'default'
                : execution.status === 'error'
                  ? 'destructive'
                  : 'secondary'
            }
            className="w-max gap-1"
          >
            {execution.status === 'loading' && (
              <Loader2 className="size-3 animate-spin" />
            )}
            {execution.status === 'success' && (
              <CheckCircle2 className="size-3" />
            )}
            {execution.status === 'error' && (
              <XCircle className="size-3" />
            )}
            {execution.status === 'loading'
              ? 'Running…'
              : execution.status === 'success'
                ? 'Executed'
                : 'Error'}
          </Badge>
        )}
      </header>

      {/* Content */}
      <section className="flex-1 overflow-y-auto p-4 space-y-4">
        {Panel}
      </section>
    </aside>
  );
}
