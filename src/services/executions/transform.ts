import type { Node, Edge } from '@xyflow/react';
import { JSONPath } from 'jsonpath-plus';
import set from 'lodash.set';
import type {
  SetNodeResultCallback,
  UpdateNodeDataCallback,
  ResolveVariableCallback,
  SetFlowContextVariableCallback,
} from '@/contracts/types/execution.types';
import type {
  TransformNodeData,
} from '@/contracts/types/nodes.types';

import { triggerNextNodes } from '@/utils/triggerNextNodes';
import { NodeResult } from '@/contracts/types';


function resolveVariable(inputPath: string): string {
  // Transforma {{get-user::$}} en $['get-user']
  return inputPath.replace(/{{([\w-]+)::\$\$?}}/g, (_match, nodeId) => `$['${nodeId}']`);
}

export async function executeTransformNodeLogic(
  node: Node<TransformNodeData>,
  inputData: any, // mergedInput
  nodes: Node[],
  edges: Edge[],
  setNodeResult: SetNodeResultCallback,
  updateNodeData: UpdateNodeDataCallback,
  resolveVariableCB: ResolveVariableCallback,
  setFlowContextVariable: SetFlowContextVariableCallback
): Promise<NodeResult> {
  const { id, data } = node;
  const { mappingRules = [] } = data;
  const startTime = Date.now();

  setNodeResult(id, { status: 'loading', timestamp: startTime });
  let finalResult: NodeResult = { status: 'idle' };
  let outputData: any = {};

  try {
    if (!inputData || typeof inputData !== 'object') {
      throw new Error('Input data is missing or not an object.');
    }

    const activeRules = mappingRules.filter(p => p.enabled && p.inputPath?.trim() && p.outputPath?.trim());

    for (const rule of activeRules) {
      const resolvedInputPath = resolveVariable(rule.inputPath);
      const resolvedOutputPath = resolveVariable(rule.outputPath);

      const extractedValues = JSONPath({ path: resolvedInputPath, json: inputData });
      let valueToSet = extractedValues?.length === 1 ? extractedValues[0] : (extractedValues ?? null);

      set(outputData, resolvedOutputPath, valueToSet);
    }

    finalResult = {
      status: 'success',
      data: outputData,
      timestamp: Date.now(),
    };
    setNodeResult(id, finalResult);

  } catch (error: any) {
    finalResult = {
      status: 'error',
      error: error.message || 'Transform node execution failed',
      timestamp: Date.now(),
    };
    setNodeResult(id, finalResult);
  }

  // Sigue el flujo solo si éxito
  if (finalResult.status === 'success') {
    await triggerNextNodes(
      id,
      finalResult.data,
      nodes,
      edges,
      setNodeResult,
      updateNodeData,
      resolveVariableCB,
      setFlowContextVariable,
      'output'
    );
  }

  return finalResult;
}