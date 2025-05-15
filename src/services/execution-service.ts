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
          case 'transformNode': 
            await executeTransformNodeLogic(
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
            console.warn(
              `[runFlowLogic] Cannot start node of type ${node.type}`
            );
            setNodeResult(node.id, {
              status: 'error',
              error: `Node type ${node.type} cannot be a starting node`,
            });
        }
      } catch (err: any) {
        console.error(
          `[runFlowLogic] Error on start node ${id}:`,
          err
        );
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
        case 'transformNode': 
        await executeTransformNodeLogic(
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
        console.warn(
          `[executeSingleNodeLogic] Type ${node.type} not executable individually`
        );
        setNodeResult(nodeId, {
          status: 'error',
          error: `Type ${node.type} cannot be executed single`,
        });
    }
  } catch (err: any) {
    console.error(
      `[executeSingleNodeLogic] Error on ${nodeId}:`,
      err
    );
    setNodeResult(nodeId, { status: 'error', error: err.message });
  }
}
