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

/**
 * Executes a Transform Node...
 */
export async function executeTransformNodeLogic(
  node: Node<TransformNodeData>,
  inputData: any,
  nodes: Node[],
  edges: Edge[],
  setNodeResult: SetNodeResultCallback,
  updateNodeData: UpdateNodeDataCallback,
  resolveVariable: ResolveVariableCallback,
  setFlowContextVariable: SetFlowContextVariableCallback
): Promise<NodeResult> {
  const { id, data } = node;
  const { mappingRules = [] } = data;
  const startTime = Date.now();

  setNodeResult(id, { status: 'loading', timestamp: startTime });
  let finalResult: NodeResult = { status: 'idle' };
  let outputData: any = {}; // Start with an empty object for the output

  try {
    // 1. Validate input data
    if (inputData === undefined || inputData === null) {
      throw new Error('Input data is missing or null.');
    }
    // Optionally add stricter type check if needed:
    // if (typeof inputData !== 'object') {
    //   throw new Error('Input data must be a JSON object or array.');
    // }

    // 2. Filter enabled rules
    const activeRules = mappingRules.filter(p => p.enabled && p.inputPath?.trim() && p.outputPath?.trim());

    if (activeRules.length === 0) {

      outputData = {}; // Output is empty if no rules
    } else {
        // 3. Process each active rule
        for (const rule of activeRules) {
          // Resolve variables in paths (optional for now, depends on desired complexity)
          const resolvedInputPath = resolveVariable(rule.inputPath); // Assuming paths might contain refs
          const resolvedOutputPath = resolveVariable(rule.outputPath);

          if (!resolvedInputPath || !resolvedOutputPath) {
            throw new Error(`Failed to resolve variables in rule paths: Input="${rule.inputPath}", Output="${rule.outputPath}"`);
          }

          try {
            // Extract value using JSONPath
            const extractedValues = JSONPath({ path: resolvedInputPath, json: inputData });

            // Handle different extraction results
            let valueToSet: any;
            if (extractedValues === undefined || extractedValues.length === 0) {
              // If JSONPath finds nothing, set null or skip? Let's set null for now.
              valueToSet = null;

            } else if (extractedValues.length === 1) {
              // If single value, use it directly
              valueToSet = extractedValues[0];
            } else {
              // If multiple values, keep as array
              valueToSet = extractedValues;
            }

            // Set value in the output object using lodash.set for nested paths
            // Note: lodash.set mutates the object directly
            set(outputData, resolvedOutputPath, valueToSet);

          } catch (e: any) {

            throw new Error(`Error processing rule (Input: "${resolvedInputPath}"): ${e.message}`);
          }
        }
    }

    // 4. Set success result
    const successResult: NodeResult = {
      status: 'success',
      data: outputData,
      timestamp: Date.now()
    };
    setNodeResult(id, successResult);
    finalResult = successResult;

  } catch (error: any) {

    const errorResult: NodeResult = {
      status: 'error',
      error: error.message || 'Transform node execution failed',
      timestamp: Date.now()
    };
    setNodeResult(id, errorResult);
    finalResult = errorResult;
  }

  // 5. Trigger next nodes if successful
  if (finalResult.status === 'success') {
    // Pass the source handle ID, usually 'output'
    await triggerNextNodes(id, finalResult.data, nodes, edges, setNodeResult, updateNodeData, resolveVariable, setFlowContextVariable, 'output');
  }

  return finalResult;
} 