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
import { Loader2 } from 'lucide-react';
import { FollowPointer } from '@/components/ui/following-pointer';
import { useUser } from '@clerk/nextjs';

import '@xyflow/react/dist/style.css';

import { HttpRequestNode } from '@/components/nodes/http-request-node';
import { JsonNode } from '@/components/nodes/json-node';
import { SelectFieldsNode } from '@/components/nodes/select-fields-node';
import { DelayNode } from '@/components/nodes/delay-node';
import { VariableSetNode } from '@/components/nodes/variable-set-node';
import { TransformNode, type TransformNodeData } from '@/components/nodes/transform-node';
import { ConditionalNode, type ConditionalNodeData } from '@/components/nodes/conditional-node';
import { LoopNode } from '@/components/nodes/loop-node';
import { AnimatedEdge } from '@/components/edges/animated-edge';
import { useFlowStore } from '@/store/index';
import { ExportNode } from './nodes/export-node';
import { useCollaborationContext } from '@/contexts/collaboration-context';

function FlowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const {
    nodes: allNodesFromStore,
    edges: allEdgesFromStore,
    onNodesChange,
    onEdgesChange,
    onConnect: zustandOnConnect,
    setSelectedNodeId,
    addNode: zustandAddNode,
    addEdge: zustandAddEdge,
    saveCurrentFlow,
    currentFlowId,
    isSaving
  } = useFlowStore();
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const { theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useUser();
  const [localCursorScreenPosition, setLocalCursorScreenPosition] = useState<{ x: number; y: number } | null>(null);
  const [isNodeDragging, setIsNodeDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const collaborationContext = useCollaborationContext();
  const onCursorMoveForRemote = collaborationContext?.updateCursorPosition;
  const remoteCursors = collaborationContext?.remoteCursors || [];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (localCursorScreenPosition && !isNodeDragging && !isPanning) {
      document.body.style.cursor = 'none';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [localCursorScreenPosition, isNodeDragging, isPanning]);

  const nodeTypes = useMemo(() => ({
    httpRequest: HttpRequestNode,
    jsonNode: JsonNode,
    selectFields: SelectFieldsNode,
    delayNode: DelayNode,
    variableSetNode: VariableSetNode,
    transformNode: TransformNode,
    conditionalNode: ConditionalNode,
    loop: LoopNode,
    exportNode: ExportNode,
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
      zustandOnConnect(params);
    },
    [zustandOnConnect]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowInstance || !reactFlowWrapper.current) {
        return;
      }
      const type = event.dataTransfer.getData('application/reactflow');
      if (type !== 'httpRequest' && type !== 'jsonNode' && type !== 'selectFields' && type !== 'delayNode' && type !== 'variableSetNode' && type !== 'transformNode' && type !== 'conditionalNode' && type !== 'loop' && type !== 'exportNode') {

        return;
      }
      
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const httpNodeId = crypto.randomUUID();
      const jsonNodeId = crypto.randomUUID();
      const selectFieldsId = crypto.randomUUID();
      const delayNodeId = crypto.randomUUID();
      const variableSetNodeId = crypto.randomUUID();
      const transformNodeId = crypto.randomUUID();
      const conditionalNodeId = crypto.randomUUID();
      const loopNodeId = crypto.randomUUID();
      const exportNodeId = crypto.randomUUID();
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
      } else if (type === 'delayNode') {
        const delayNode: Node = {
          id: delayNodeId,
          type: 'delayNode',
          position,
          data: { 
            label: 'Delay',
            delayMs: 1000
          }
        };
        nodesToAdd.push(delayNode);
      } else if (type === 'variableSetNode') {
        const variableSetNode: Node = {
          id: variableSetNodeId,
          type: 'variableSetNode',
          position,
          data: { 
            label: 'Set Variable',
            variableName: 'myVar',
            variableValue: ''
          }
        };
        nodesToAdd.push(variableSetNode);
      } else if (type === 'transformNode') {
        const transformNode: Node<TransformNodeData> = {
          id: transformNodeId,
          type: 'transformNode',
          position,
          data: {
            label: 'Transform Data',
            mappingRules: [],
          }
        };
        nodesToAdd.push(transformNode);
      } else if (type === 'conditionalNode') {
        const conditionalNode: Node<ConditionalNodeData> = {
          id: conditionalNodeId,
          type: 'conditionalNode',
          position,
          data: {
            label: 'If Condition',
            conditions: [
              { id: crypto.randomUUID(), expression: 'true', outputHandleId: 'true' }
            ],
            defaultOutputHandleId: 'default',
          }
        };
        nodesToAdd.push(conditionalNode);
      } else if (type === 'loop') {
        const loopNode: Node = {
          id: loopNodeId,
          type: 'loop',
          position,
          data: { 
            label: 'Loop',
            inputArrayPath: '',
          }
        };
        nodesToAdd.push(loopNode);
      } else if (type === 'exportNode') {
        const exportNode: Node = {
          id: exportNodeId,
          type: 'exportNode',
          position,
          data: {
            label: 'Export Data',
            exportFormat: 'csv',
            fileName: 'exported-data',
            includeTimestamp: true,
            flatten: true,
            customSeparator: ',',
          }
        };
        nodesToAdd.push(exportNode);
      }

      if (nodesToAdd.length > 0) {
         
          nodesToAdd.forEach(n => zustandAddNode(n));
          if (zustandAddEdge && edgesToAdd.length > 0) {
              edgesToAdd.forEach(e => zustandAddEdge(e));
          }
      }
    },
    [reactFlowInstance, zustandAddNode, zustandAddEdge]
  );

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (isNodeDragging || isPanning) {
      return;
    }

    if (reactFlowWrapper.current) {
      const rect = reactFlowWrapper.current.getBoundingClientRect();
      setLocalCursorScreenPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }

    if (reactFlowInstance && onCursorMoveForRemote) {
      const flowPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      onCursorMoveForRemote(flowPosition);
    }
  }, [reactFlowInstance, onCursorMoveForRemote, isNodeDragging, isPanning]);

  const handleMouseLeave = useCallback(() => {
    if (!isNodeDragging && !isPanning) {
      setLocalCursorScreenPosition(null);
    }

    if (onCursorMoveForRemote) {
      onCursorMoveForRemote(null);
    }
  }, [onCursorMoveForRemote, isNodeDragging, isPanning]);

  const onNodeDragStartCallback = useCallback(() => {
    setIsNodeDragging(true);
    setLocalCursorScreenPosition(null); 
  }, []);

  const onNodeDragStopCallback = useCallback(() => {
    setIsNodeDragging(false);
  }, []);

  const onMoveStartCallback = useCallback(() => {
    setIsPanning(true);
    setLocalCursorScreenPosition(null);
  }, []);

  const onMoveEndCallback = useCallback(() => {
    setIsPanning(false);
  }, []);

  const renderedRemoteCursors = useMemo(() => {
    if (!reactFlowInstance) return null;

    return remoteCursors.map(cursor => {
      if (!cursor.position) return null;

      const screenPosition = reactFlowInstance.flowToScreenPosition({ 
        x: cursor.position.x, 
        y: cursor.position.y 
      });

      return (
        <FollowPointer 
          key={cursor.userId} 
          x={screenPosition.x} 
          y={screenPosition.y} 
          avatarUrl={cursor.avatarUrl}
          displayNameForFallback={cursor.displayName}
        />
      );
    }).filter(Boolean);
  }, [remoteCursors, reactFlowInstance]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        ('[FlowCanvas] Ctrl+S detected. Attempting save...');
        
        if (currentFlowId && !isSaving) {
          ('[FlowCanvas] Calling saveCurrentFlow...');
          saveCurrentFlow(); 
        } else if (!currentFlowId) {
          ('[FlowCanvas] Save aborted: Flow has no ID (needs Save As first).');
        } else if (isSaving) {
          ('[FlowCanvas] Save aborted: Already saving.');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveCurrentFlow, currentFlowId, isSaving]);

  // Log de diagnóstico para realtime
 

  if (!isMounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div
      className={cn(
        "h-full w-full relative",
        (localCursorScreenPosition && !isNodeDragging && !isPanning) ? "hide-native-cursor" : ""
      )}
      ref={reactFlowWrapper}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <ReactFlow
        nodes={[...allNodesFromStore]}
        edges={[...allEdgesFromStore]}
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
        onNodeDragStart={onNodeDragStartCallback}
        onNodeDragStop={onNodeDragStopCallback}
        onMoveStart={onMoveStartCallback}
        onMoveEnd={onMoveEndCallback}
        className={cn(
          "transition-colors duration-300",
          isDark ? "bg-neutral-900 dark-themed" : "bg-neutral-50"
        )}
      >
        <MiniMap 
            nodeColor={(node) => {
                switch (node.type) {
                  case 'httpRequest': 
                    return isDark ? '#60a5fa' : '#3b82f6';
                  case 'jsonNode': 
                    return isDark ? '#a3e635' : '#84cc16';
                  case 'selectFields': 
                    return isDark ? '#fbbf24' : '#f59e0b';
                  default: 
                    return isDark ? '#94a3b8' : '#64748b';
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
        
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[100]">
            {renderedRemoteCursors}
            {localCursorScreenPosition && !isNodeDragging && !isPanning && (
              <FollowPointer
                x={localCursorScreenPosition.x}
                y={localCursorScreenPosition.y}
                avatarUrl={user?.imageUrl}
                displayNameForFallback={user?.fullName || user?.username}
              />
            )}
        </div>
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

FlowCanvas.displayName = 'FlowCanvas';