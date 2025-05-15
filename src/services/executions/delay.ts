import type { Node, Edge } from '@xyflow/react';
import type {
  SetNodeResultCallback,
  UpdateNodeDataCallback,
  ResolveVariableCallback,
  SetFlowContextVariableCallback,
} from '@/contracts/types/execution.types';
import type {
  DelayNodeData,
} from '@/contracts/types/nodes.types';

import { triggerNextNodes } from '@/utils/triggerNextNodes';
import { NodeResult } from '@/contracts/types';

/**
 * Executes a Delay Node...
 */
export async function executeDelayNodeLogic(
  node: Node<DelayNodeData>,
  inputData: any,
  nodes: Node[],
  edges: Edge[],
  setNodeResult: SetNodeResultCallback,
  updateNodeData: UpdateNodeDataCallback,
  resolveVariable: ResolveVariableCallback,
  setFlowContextVariable: SetFlowContextVariableCallback
): Promise<NodeResult> {
  const startTime = Date.now();
  const nodeData = { delayMs: 1000, ...node.data }; // Default delay if undefined
  const delayMs = nodeData.delayMs ?? 1000;

  (`[ExecutionService] Executing Delay Node ${node.id} for ${delayMs}ms`);
  setNodeResult(node.id, { status: 'loading', timestamp: startTime });

  try {
    await new Promise(resolve => setTimeout(resolve, delayMs));

    const endTime = Date.now();
    const result: NodeResult = {
      status: 'success',
      data: inputData, // Pass input data through
      timestamp: endTime,
    };
    setNodeResult(node.id, result);

    // Pass the source handle ID, usually 'output'
    await triggerNextNodes(node.id, inputData, nodes, edges, setNodeResult, updateNodeData, resolveVariable, setFlowContextVariable, 'output');

    return result;

  } catch (error: any) {

    const result: NodeResult = {
      status: 'error',
      error: error.message || 'Delay execution failed',
      timestamp: Date.now(),
    };
    setNodeResult(node.id, result);
    return result;
  }
} 