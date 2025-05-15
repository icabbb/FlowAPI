'use client';

import { useEffect, useCallback, useState } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
  NodeMouseHandler,
  useReactFlow,
  OnNodesChange,
  OnEdgesChange,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// Import the original node types directly
import { nodeTypes as originalNodeTypes } from '@/config/node-types';
import { AnimatedEdge } from '@/components/edges/animated-edge';
import { SavedFlow } from '@/contracts/types/flow.types';
import { useFlowStore } from '@/store/index';

// Define the edge types (same as original)
const edgeTypes: EdgeTypes = {
  default: AnimatedEdge,
  animated: AnimatedEdge,
};

interface SharedFlowCanvasProps {
  flow: SavedFlow;
}

/**
 * Shared flow canvas component that displays the flow in read-only mode.
 * Uses the original node types but prevents editing.
 */
export default function SharedFlowCanvas({ flow }: SharedFlowCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange: storeOnNodesChange,
    onEdgesChange: storeOnEdgesChange,
    setSelectedNodeId,
    setLoadedFlowData,
    currentFlowId,
  } = useFlowStore();
  
  const { fitView } = useReactFlow();
  const [isClient, setIsClient] = useState(false);
  const [loadAttempted, setLoadAttempted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Load the flow data into the store on component mount
  useEffect(() => {
    setIsClient(true);
    if (flow && !loadAttempted) {
      (`[SharedFlowCanvas] Loading flow: ${flow.name} (ID: ${flow.id})`);
      
      // Load the flow data into the store
      setLoadedFlowData(flow);
      setLoadAttempted(true);
      
      // Fit the view after a short delay to ensure rendering is complete
      setTimeout(() => fitView({ padding: 0.1, duration: 300 }), 150);
    } else if (flow && loadAttempted && flow.id === currentFlowId) {
      (`[SharedFlowCanvas] Flow ${currentFlowId} already loaded. Fitting view.`);
      setTimeout(() => fitView({ padding: 0.1, duration: 300 }), 150);
    }
  }, [flow, currentFlowId, setLoadedFlowData, loadAttempted, fitView]);

  // Handle node changes (only position and selection, no deletion)
  const handleNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
    // Filter out any delete operations
    const nonDeleteChanges = changes.filter(change => change.type !== 'remove');
    if (nonDeleteChanges.length > 0) {
      storeOnNodesChange(nonDeleteChanges);
    }
    
    // Handle node selection
    const selectionChange = changes.find(c => c.type === 'select');
    if (selectionChange) {
      if (selectionChange.selected) {
         setSelectedNodeId(selectionChange.id);
      } else if (useFlowStore.getState().selectedNodeId === selectionChange.id) {
         setSelectedNodeId(null);
      }
    }
  }, [storeOnNodesChange, setSelectedNodeId]);

  // Handle edge changes (no deletion)
  const handleEdgesChange: OnEdgesChange = useCallback((changes: EdgeChange[]) => {
    const nonDeleteChanges = changes.filter(change => change.type !== 'remove');
    if (nonDeleteChanges.length > 0) {
      storeOnEdgesChange(nonDeleteChanges);
    }
  }, [storeOnEdgesChange]);

  // Empty handlers to prevent interaction
  const handleNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);
  
  const handlePaneClick = useCallback(() => setSelectedNodeId(null), [setSelectedNodeId]);

  // Show loading state
  if (!isClient || !flow || (loadAttempted && currentFlowId !== flow.id)) {
    let loadingText = "Loading Flow Viewer...";
    if(isClient && flow && loadAttempted && currentFlowId !== flow.id){
        loadingText = `Loading flow ${flow.name}...`;
    }
    return (
      <div className={cn(
        "flex items-center justify-center h-full",
        isDark ? "text-blue-300" : "text-neutral-500"
      )}>
        <p>{loadingText}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex">
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          // Use the original node types without modification
          nodeTypes={originalNodeTypes as NodeTypes}
          edgeTypes={edgeTypes as EdgeTypes}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          // Make the flow non-interactive in the shared view
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          // Styling
          className={cn(
            isDark ? "bg-neutral-950" : "bg-white"
          )}
          minZoom={0.1}
          maxZoom={2}
          fitView
        >
          <Controls 
            className={cn(
              isDark ? "dark-cartoon-controls" : ""
            )}
          />
          <MiniMap 
            className={cn(
              isDark ? "dark-cartoon-minimap" : ""
            )}
            style={{ height: 120, width: 160 }} 
            nodeStrokeWidth={3} 
            zoomable 
            pannable 
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={isDark ? 20 : 16} 
            size={isDark ? 1.5 : 1}
            color={isDark ? "#3b82f6" : undefined}
            className={cn(
              isDark ? "bg-neutral-950/95" : "bg-white"
            )}
          />
        </ReactFlow>
      </div>
    </div>
  );
} 