import type { Node, Edge } from '@xyflow/react';
import type {
  SetNodeResultCallback,
  UpdateNodeDataCallback,
  ResolveVariableCallback,
  SetFlowContextVariableCallback,
} from '@/contracts/types/execution.types';
import type {
  HttpRequestNodeData,
  SelectFieldsNodeData,
  DelayNodeData,
  VariableSetNodeData,
  TransformNodeData,
  ConditionalNodeData,
  LoopNodeData,
  ExportNodeData,
} from '@/contracts/types/nodes.types';

import { executeHttpRequestNodeLogic } from '@/services/executions/http-request';
import { executeJsonNodeLogic } from '@/services/executions/json';
import { executeSelectFieldsNodeLogic } from '@/services/executions/select-fields';
import { executeDelayNodeLogic } from '@/services/executions/delay';
import { executeVariableSetNodeLogic } from '@/services/executions/variable-set';
import { executeTransformNodeLogic } from '@/services/executions/transform';
import { executeConditionalNodeLogic } from '@/services/executions/conditional';
import { executeLoopNodeLogic } from '@/services/executions/loop';
import { executeExportNodeLogic } from '@/services/executions/export';
import { useFlowStore } from '@/store';


function getMergedInput(targetNode: Node, edges: Edge[]): Record<string, any> {
  const nodeResults = useFlowStore.getState().nodeResults;
  const incomingEdges = edges.filter(e => e.target === targetNode.id);

  const mergedInput: Record<string, any> = {};
  for (const edge of incomingEdges) {
    mergedInput[edge.source] = nodeResults[edge.source]?.data ?? null;
  }
  return mergedInput;
}


export async function triggerNextNodes(
  currentNodeId: string,
  outputData: any,
  nodes: Node[],
  edges: Edge[],
  setNodeResult: SetNodeResultCallback,
  updateNodeData: UpdateNodeDataCallback,
  resolveVariable: ResolveVariableCallback,
  setFlowContextVariable: SetFlowContextVariableCallback,
  sourceHandleId?: string
): Promise<void> {

  const outgoing = edges.filter(
    e => e.source === currentNodeId && e.sourceHandle === sourceHandleId
  );

  if (!outgoing.length) {
    console.warn(
      `[triggerNextNodes] No outgoing edges from ${currentNodeId} (${sourceHandleId}).`
    );
  }

  for (const edge of outgoing) {
    const target = nodes.find(n => n.id === edge.target);
    if (!target) {
      console.warn(
        `[triggerNextNodes] target ${edge.target} not found for edge ${edge.id}`
      );
      continue;
    }
    console.log(
      `[triggerNextNodes] executing ${target.id} (${target.type}) via edge ${edge.id}`
    );
    try {
      switch (target.type) {
        case 'httpRequest':
          await executeHttpRequestNodeLogic(
            target as Node<HttpRequestNodeData>,
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
            target,
            outputData,
            nodes,
            edges,
            setNodeResult,
            updateNodeData,
            resolveVariable,
            setFlowContextVariable
          );
          break;
        case 'selectFields':
          await executeSelectFieldsNodeLogic(
            target as Node<SelectFieldsNodeData>,
            outputData,
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
            target as Node<DelayNodeData>,
            outputData,
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
            target as Node<VariableSetNodeData>,
            outputData,
            nodes,
            edges,
            setNodeResult,
            updateNodeData,
            resolveVariable,
            setFlowContextVariable
          );
          break;
          case 'transformNode':
            const mergedInput = getMergedInput(target, edges);
            await executeTransformNodeLogic(
              target as Node<TransformNodeData>,
              mergedInput,
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
            target as Node<ConditionalNodeData>,
            outputData,
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
            target as Node<LoopNodeData>,
            outputData,
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
            target as Node<ExportNodeData>,
            outputData,
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
            `[triggerNextNodes] Unhandled node type: ${target.type}`
          );
          setNodeResult(target.id, {
            status: 'error',
            error: `Execution logic for type ${target.type} not found.`,
          });
      }
    } catch (error: any) {
      console.error(
        `[triggerNextNodes] Error executing node ${target.id}:`, error
      );
      setNodeResult(target.id, { status: 'error', error: error.message });
    }
  }
}