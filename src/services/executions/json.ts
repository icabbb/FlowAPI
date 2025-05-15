import type { Node, Edge } from '@xyflow/react';
import type {
    SetNodeResultCallback,
    UpdateNodeDataCallback,
    ResolveVariableCallback,
    SetFlowContextVariableCallback,
} from '@/contracts/types/execution.types';
import { NodeResult } from '@/contracts/types';
import { triggerNextNodes } from '@/utils/triggerNextNodes';

/**
 * Executes a JSON node, which typically passes through data or transforms JSON.
 */
export async function executeJsonNodeLogic(
  node: Node,
  inputData: any,
  nodes: Node[],
  edges: Edge[],
  setNodeResult: SetNodeResultCallback,
  updateNodeData: UpdateNodeDataCallback,
  resolveVariable: ResolveVariableCallback, // Parameter kept for signature consistency
  setFlowContextVariable: SetFlowContextVariableCallback // Parameter kept for signature consistency
): Promise<NodeResult> {
  const { id } = node;

  setNodeResult(id, { status: 'loading', error: undefined, data: undefined });
  let finalResult: NodeResult = { status: 'idle' };

  try {
    // Update the node's inputData property first
    updateNodeData(id, { inputData });

    const result: NodeResult = {
      status: 'success',
      data: inputData,
      timestamp: Date.now()
    };
    setNodeResult(id, result);
    finalResult = result;

  } catch (error: any) {

    const errorResult: NodeResult = {
      status: 'error',
      error: error.message || 'JSON node execution failed',
      timestamp: Date.now()
    };
    setNodeResult(id, errorResult);
    finalResult = errorResult;
  }

  // Trigger next nodes if this node succeeded
  if (finalResult.status === 'success') {
    // Pass the source handle ID, usually 'output'
    await triggerNextNodes(id, finalResult.data, nodes, edges, setNodeResult, updateNodeData, resolveVariable, setFlowContextVariable, 'output');
  }

  return finalResult;
} 