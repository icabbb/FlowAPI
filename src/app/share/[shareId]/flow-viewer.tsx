'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
  Node,
  NodeMouseHandler,
  useReactFlow,
  OnNodesChange,
  OnEdgesChange,
  NodeChange,
  EdgeChange,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Import the original node types directly
import { nodeTypes as originalNodeTypes } from '@/config/node-types';
import { AnimatedEdge } from '@/components/edges/animated-edge';
import { SavedFlow } from '@/contracts/types/flow.types';

// Import the store and inspection panel
import { useFlowStore } from '@/store/index';
import { InspectionPanel } from './inspection-panel';

// Define the edge types (same as original)
const edgeTypes: EdgeTypes = {
  default: AnimatedEdge,
  animated: AnimatedEdge,
};

interface FlowViewerProps {
  flow: SavedFlow;
}

// Function to prepare nodes for read-only view without modifying their structure
const prepareNodeForReadOnlyView = (node: Node): Node => {
  return {
    ...node,
    // Make nodes non-interactive for the read-only view
    draggable: false,
    connectable: false,
    deletable: false,
    selectable: true,
    // Add a read-only flag but don't modify the original node data structure
    data: {
      ...node.data,
      isReadOnly: true,
    },
    // Ensure position is valid
    position: node.position && typeof node.position.x === 'number' && typeof node.position.y === 'number'
      ? node.position
      : { x: Math.random() * 400, y: Math.random() * 300 },
  };
};

// Main component for the shared flow viewer
export default function FlowViewer({ flow: sharedFlowData }: FlowViewerProps) {
  // Internal component that uses ReactFlow and renders the flow
  const FlowCanvas = () => {
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

    // Load the flow data into the store on component mount
    useEffect(() => {
      setIsClient(true);
      if (sharedFlowData && !loadAttempted) {
        (`[SharedFlowViewer] Loading flow: ${sharedFlowData.name} (ID: ${sharedFlowData.id})`);
        
        // Load the flow data into the store without modifying the nodes
        setLoadedFlowData(sharedFlowData);
        setLoadAttempted(true);
        
        // Fit the view after a short delay to ensure rendering is complete
        setTimeout(() => fitView({ padding: 0.1, duration: 300 }), 150);
      } else if (sharedFlowData && loadAttempted && sharedFlowData.id === currentFlowId) {
        (`[SharedFlowViewer] Flow ${currentFlowId} already loaded. Fitting view.`);
        setTimeout(() => fitView({ padding: 0.1, duration: 300 }), 150);
      }
    }, [sharedFlowData, currentFlowId, setLoadedFlowData, loadAttempted, fitView]);

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
    const handleNodeClick: NodeMouseHandler = useCallback(() => {}, []);
    const handlePaneClick = useCallback(() => setSelectedNodeId(null), [setSelectedNodeId]);

    // Show loading state
    if (!isClient || !sharedFlowData || (loadAttempted && currentFlowId !== sharedFlowData.id)) {
      let loadingText = "Loading Flow Viewer...";
      if(isClient && sharedFlowData && loadAttempted && currentFlowId !== sharedFlowData.id){
          loadingText = `Loading flow ${sharedFlowData.name}...`;
      }
      return (
        <div className="flex items-center justify-center h-full text-neutral-500">
          <p>{loadingText}</p>
        </div>
      );
    }

    return (
      <div className="h-full w-full flex">
        <div className="flex-1 h-full relative">
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
            className="bg-white dark:bg-neutral-950"
            minZoom={0.1}
            maxZoom={2}
          >
            <Controls />
            <MiniMap style={{ height: 100, width: 150 }} nodeStrokeWidth={3} zoomable pannable />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          </ReactFlow>
        </div>
        <aside className="w-80 border-l border-neutral-200 dark:border-neutral-800 h-full flex-shrink-0 bg-neutral-50 dark:bg-neutral-900">
          <InspectionPanel />
        </aside>
      </div>
    );
  };

  // Wrap with ReactFlowProvider
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
} 