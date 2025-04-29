'use client';

import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  type Node,
  type Edge,
  ReactFlowProvider,
  type ReactFlowInstance,
  ConnectionMode,
  BackgroundVariant
} from '@xyflow/react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import '@xyflow/react/dist/style.css';

import { HttpRequestNode } from '@/components/nodes/http-request-node';
import { JsonNode } from '@/components/nodes/json-node';
import { SelectFieldsNode } from '@/components/nodes/select-fields-node';
import { AnimatedEdge } from '@/components/edges/animated-edge';
import { useFlowStore } from '@/store/flow-store';

function FlowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeId,
    addNode,
    addEdge,
    saveCurrentFlow,
    currentFlowId,
    isSaving
  } = useFlowStore();
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const nodeTypes = useMemo(() => ({
    httpRequest: HttpRequestNode as any,
    jsonNode: JsonNode as any,
    selectFields: SelectFieldsNode as any,
  }), []);

  const edgeTypes = useMemo(() => ({
    default: AnimatedEdge,
    animated: AnimatedEdge,
  }), []);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleConnect = useCallback(
    (params: any) => {
      const newEdge = {
        ...params,
        type: 'animated',
        data: { label: 'Connection' },
      };
      onConnect(newEdge);
    },
    [onConnect]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowInstance || !reactFlowWrapper.current) {
        return;
      }
      const type = event.dataTransfer.getData('application/reactflow');
      if (type !== 'httpRequest' && type !== 'jsonNode' && type !== 'selectFields') {
        return;
      }
      
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const httpNodeId = crypto.randomUUID();
      const jsonNodeId = crypto.randomUUID();
      
      const nodesToAdd: Node[] = [];
      const edgesToAdd: Edge[] = [];

      if (type === 'httpRequest') {
        const httpNode: Node = {
          id: httpNodeId,
          type: 'httpRequest',
          position,
          data: {
            label: 'HTTP Request',
            method: 'GET',
            url: '',
            queryParams: [],
            headers: [],
            bodyType: 'none',
            body: '',
          },
        };
        nodesToAdd.push(httpNode);

        const autoJsonNode: Node = {
            id: jsonNodeId,
            type: 'jsonNode',
            position: { x: position.x + 300, y: position.y },
            data: { label: 'Response Output' }
        };
        nodesToAdd.push(autoJsonNode);

        const connectingEdge: Edge = {
            id: `e-${httpNodeId}-${jsonNodeId}`,
            source: httpNodeId,
            target: jsonNodeId,
            sourceHandle: 'output',
            type: 'animated',
        };
        edgesToAdd.push(connectingEdge);

      } else if (type === 'jsonNode') {
        const jsonNode: Node = {
            id: jsonNodeId,
            type: 'jsonNode',
            position,
            data: { label: 'JSON Output', inputData: undefined }
        };
        nodesToAdd.push(jsonNode);
      } else if (type === 'selectFields') {
        const selectFieldsId = crypto.randomUUID(); 
        const selectFieldsNode: Node = {
          id: selectFieldsId,
          type: 'selectFields',
          position,
          data: { 
            label: 'Select Fields', 
            jsonPaths: []
          }
        };
        nodesToAdd.push(selectFieldsNode);
      }

      if (nodesToAdd.length > 0) {
          console.log('Nodes dropped: ', nodesToAdd, edgesToAdd);
          nodesToAdd.forEach(n => addNode(n));
          if (addEdge && edgesToAdd.length > 0) {
              edgesToAdd.forEach(e => addEdge(e));
          }
      }
    },
    [reactFlowInstance, addNode, addEdge]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        console.log('[FlowCanvas] Ctrl+S detected. Attempting save...');
        
        if (currentFlowId && !isSaving) {
          console.log('[FlowCanvas] Calling saveCurrentFlow...');
          saveCurrentFlow(); 
        } else if (!currentFlowId) {
          console.log('[FlowCanvas] Save aborted: Flow has no ID (needs Save As first).');
        } else if (isSaving) {
          console.log('[FlowCanvas] Save aborted: Already saving.');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveCurrentFlow, currentFlowId, isSaving]);

  return (
    <div className="h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'animated' }}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onInit={setReactFlowInstance}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        nodesDraggable={true}
        nodesConnectable={true}
        connectionMode={ConnectionMode.Loose}
        selectionOnDrag={true}
        panActivationKeyCode={'control'}
        className={cn(
          "transition-colors duration-300",
          isDark ? "bg-neutral-900 dark-themed" : "bg-neutral-50"
        )}
      >
        <MiniMap 
            nodeColor={(node) => {
                switch (node.type) {
                  case 'httpRequest': 
                    return isDark ? '#60a5fa' : '#3b82f6'; // Lighter blue in dark mode
                  case 'jsonNode': 
                    return isDark ? '#a3e635' : '#84cc16'; // Lighter lime in dark mode
                  case 'selectFields': 
                    return isDark ? '#fbbf24' : '#f59e0b'; // Lighter amber in dark mode
                  default: 
                    return isDark ? '#94a3b8' : '#64748b'; // Lighter slate in dark mode
                }
            }}
            nodeStrokeWidth={3}
            nodeStrokeColor={isDark ? "#0f172a" : "#1e293b"}
            maskColor={isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)"}
            pannable 
            zoomable
        />
        <Controls />
        <Background 
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5} 
            color={isDark ? "#2a3f59" : "#cbd5e1"}
            className={isDark 
              ? "bg-gradient-to-br from-neutral-900 to-neutral-950" 
              : "bg-gradient-to-br from-neutral-50 to-white"
            }
        />
      </ReactFlow>
    </div>
  );
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  );
}