import type { Node, Edge } from '@xyflow/react';
import type {
  SetNodeResultCallback,
  UpdateNodeDataCallback,
  ResolveVariableCallback,
  SetFlowContextVariableCallback,
} from '@/contracts/types/execution.types';
import {
  executeHttpRequestNodeLogic,
  executeDelayNodeLogic,
  executeVariableSetNodeLogic,
  executeTransformNodeLogic,
  executeConditionalNodeLogic,
  executeLoopNodeLogic,
  executeJsonNodeLogic,
  executeSelectFieldsNodeLogic,
  executeExportNodeLogic,
} from '@/services/executions/index';


function getMergedInput(node: Node, edges: Edge[], nodeResults: Record<string, any>) {
  const incomingEdges = edges.filter(e => e.target === node.id);
  const mergedInput: Record<string, any> = {};
  for (const edge of incomingEdges) {
    mergedInput[edge.source] = nodeResults[edge.source]?.data ?? null;
  }
  return mergedInput;
}


/**
 * Executes the entire flow, starting from nodes without incoming edges.
 */
export async function runFlowLogic(
    nodes: Node[],
    edges: Edge[],
    setNodeResult: SetNodeResultCallback,
    updateNodeData: UpdateNodeDataCallback,
    resolveVariable: ResolveVariableCallback,
    setFlowContextVariable: SetFlowContextVariableCallback
): Promise<void> { 

  const startIds = nodes
    .filter(n => !edges.some(e => e.target === n.id))
    .map(n => n.id);

  if (!startIds.length) {

      return;
    }

  await Promise.all(
    startIds.map(async id => {
      const node = nodes.find(n => n.id === id);
      if (!node) return;
      try {
        switch (node.type) {
          case 'httpRequest':
            await executeHttpRequestNodeLogic(
              node as Node<any>,
              nodes,
              edges,
              setNodeResult,
              updateNodeData,
              resolveVariable,
              setFlowContextVariable
            );
            break;
          case 'delayNode':
            await executeDelayNodeLogic(
              node as Node<any>,
              null,
              nodes,
              edges,
              setNodeResult,
              updateNodeData,
              resolveVariable,
              setFlowContextVariable
            );
            break;
          case 'variableSetNode':
            await executeVariableSetNodeLogic(
              node as Node<any>,
              null,
              nodes,
              edges,
              setNodeResult,
              updateNodeData,
              resolveVariable,
              setFlowContextVariable
            );
            break;
            case 'transformNode': {
              const mergedInput = getMergedInput(node, edges, (window as any).nodeResults || {});
              await executeTransformNodeLogic(
                node as Node<any>,
                mergedInput,
                nodes,
                edges,
                setNodeResult,
                updateNodeData,
                resolveVariable,
                setFlowContextVariable
              );
              break;
            }
            
          case 'conditionalNode':
            await executeConditionalNodeLogic(
              node as Node<any>,
              null,
              nodes,
              edges,
              setNodeResult,
              updateNodeData,
              resolveVariable,
              setFlowContextVariable
            );
            break;
          case 'loop':
            await executeLoopNodeLogic(
              node as Node<any>,
              null,
              nodes,
              edges,
              setNodeResult,
              updateNodeData,
              resolveVariable,
              setFlowContextVariable
            );
            break;
          case 'jsonNode':
            await executeJsonNodeLogic(
              node as Node<any>,
              null,
              nodes,
              edges,
              setNodeResult,
              updateNodeData,
              resolveVariable,
              setFlowContextVariable
            );
            break;
          case 'selectFieldsNode':
            await executeSelectFieldsNodeLogic(
              node as Node<any>,
              null,
              nodes,
              edges,
              setNodeResult,
              updateNodeData,
              resolveVariable,
              setFlowContextVariable
            );
            break;
          case 'exportNode':
            await executeExportNodeLogic(
              node as Node<any>,
              null,
              nodes,
              edges,
              setNodeResult,
              updateNodeData,
              resolveVariable,
              setFlowContextVariable
            );
            break;
          default:
        
            setNodeResult(node.id, {
              status: 'error',
              error: `Node type ${node.type} cannot be a starting node`,
            });
        }
      } catch (err: any) {
    
        setNodeResult(id, { status: 'error', error: err.message });
      }
    })
  );


}

/**
 * Executes a single node in isolation.
 */
export async function executeSingleNodeLogic(
    nodeId: string,
    nodes: Node[],
    edges: Edge[],
    setNodeResult: SetNodeResultCallback,
    updateNodeData: UpdateNodeDataCallback,
    resolveVariable: ResolveVariableCallback,
    setFlowContextVariable: SetFlowContextVariableCallback
): Promise<void> { 
  const node = nodes.find(n => n.id === nodeId);
  if (!node) {

      return; 
    }
  const input = (node.data as any)?.inputData ?? null;

  try {
    switch (node.type) {
        case 'httpRequest':
        await executeHttpRequestNodeLogic(
          node as Node<any>,
          nodes,
          edges,
          setNodeResult,
          updateNodeData,
          resolveVariable,
          setFlowContextVariable
        );
            break;
        case 'delayNode':
        await executeDelayNodeLogic(
          node as Node<any>,
          null,
          nodes,
          edges,
          setNodeResult,
          updateNodeData,
          resolveVariable,
          setFlowContextVariable
        );
            break;
        case 'variableSetNode':
        await executeVariableSetNodeLogic(
          node as Node<any>,
          null,
          nodes,
          edges,
          setNodeResult,
          updateNodeData,
          resolveVariable,
          setFlowContextVariable
        );
            break;
            case 'transformNode': {
              const mergedInput = getMergedInput(node, edges, (window as any).nodeResults || {}); // Removed window.nodeResults reference
              await executeTransformNodeLogic(
                node as Node<any>,
                mergedInput,
                nodes,
                edges,
                setNodeResult,
                updateNodeData,
                resolveVariable,
                setFlowContextVariable
              );
              break;
            }
        case 'conditionalNode': 
        await executeConditionalNodeLogic(
          node as Node<any>,
          null,
          nodes,
          edges,
          setNodeResult,
          updateNodeData,
          resolveVariable,
          setFlowContextVariable
        );
            break;
        case 'loop':
        await executeLoopNodeLogic(
          node as Node<any>,
          null,
          nodes,
          edges,
          setNodeResult,
          updateNodeData,
          resolveVariable,
          setFlowContextVariable
        );
          break;
                case 'jsonNode':
        await executeJsonNodeLogic(
          node as Node<any>,
          null,
        nodes,
        edges,
        setNodeResult,
        updateNodeData,
        resolveVariable,
          setFlowContextVariable
        );
        break;
      case 'selectFieldsNode':
        await executeSelectFieldsNodeLogic(
          node as Node<any>,
          null,
      nodes,
      edges,
      setNodeResult,
      updateNodeData,
      resolveVariable,
          setFlowContextVariable
        );
        break;
      case 'exportNode':

        await executeExportNodeLogic(
          node as Node<any>,
          input,
          nodes,
          edges,
          setNodeResult,
          updateNodeData,
          resolveVariable,
          setFlowContextVariable
        );
        break;
      default:
       
        setNodeResult(nodeId, {
          status: 'error',
          error: `Type ${node.type} cannot be executed single`,
        });
    }
  } catch (err: any) {
    setNodeResult(nodeId, { status: 'error', error: err.message });
  }
}
