import type { Node, Edge } from '@xyflow/react';
import { JSONPath } from 'jsonpath-plus';
import type {
    SetNodeResultCallback,
    UpdateNodeDataCallback,
    ResolveVariableCallback,
    SetFlowContextVariableCallback,
} from '@/contracts/types/execution.types';
import type {
    LoopNodeData,
} from '@/contracts/types/nodes.types';
import type { NodeResult } from '@/contracts/types';
import { triggerNextNodes } from '@/utils/triggerNextNodes';

/**
 * Executes a Loop Node...
 */
export async function executeLoopNodeLogic(
  node: Node<LoopNodeData>,
  inputData: any,
  nodes: Node[],
  edges: Edge[],
  setNodeResult: SetNodeResultCallback,
  updateNodeData: UpdateNodeDataCallback,
  resolveVariable: ResolveVariableCallback,
  setFlowContextVariable: SetFlowContextVariableCallback
): Promise<NodeResult> {
  setNodeResult(node.id, { status: 'loading' });
  const startTime = Date.now();

  try {
    const { inputArrayPath = '$' } = node.data; // Default to root if path is missing
    const resolvedPath = resolveVariable(inputArrayPath);

    if (!resolvedPath) {
      throw new Error('Input array path is not defined or could not be resolved.');
    }




    // Use jsonpath-plus for robust path evaluation
    const arrayToIterate = JSONPath({ path: resolvedPath, json: inputData });

    if (!Array.isArray(arrayToIterate)) {
      // If the result is a single non-array value, maybe wrap it in an array?
      // Or throw an error, depending on desired behavior.
      // For now, let's error if it's not an array.
      const resultType = typeof arrayToIterate;
      const preview = JSON.stringify(arrayToIterate).substring(0, 100);
      const errorMessage = `Resolved path "${resolvedPath}" did not return an array. Got type: ${resultType}, value: ${preview}...`;

      // Return NodeResult compliant error
      return { status: 'error', error: errorMessage, timestamp: Date.now() };
    }
    


    // --- Loop Body Execution --- 
    for (let i = 0; i < arrayToIterate.length; i++) {
      const item = arrayToIterate[i];
      const itemIndex = i; // Could potentially add index to context if needed

      
      // Trigger nodes connected to 'loopBody' for EACH item
      await triggerNextNodes(
        node.id,
        item, // Pass the current item as input data
        nodes,
        edges,
        setNodeResult,
        updateNodeData,
        resolveVariable,
        setFlowContextVariable,
        'loopBody' // <<< Specify the source handle ID
      );
      // TODO: Consider adding a delay option between iterations?
      // TODO: Consider collecting results from loop body executions?
    }

    // --- Loop End Execution --- 

    await triggerNextNodes(
      node.id,
      inputData, // Pass original input data (or collected results) to the end branch
      nodes,
      edges,
      setNodeResult,
      updateNodeData,
      resolveVariable,
      setFlowContextVariable,
      'loopEnd' // <<< Specify the source handle ID
    );

    const duration = Date.now() - startTime;
    const successResult: NodeResult = { // Explicitly create NodeResult object
        status: 'success',
        data: { itemCount: arrayToIterate.length },
        timestamp: Date.now() // Add missing timestamp
    };
    setNodeResult(node.id, successResult); // Set the full success result
    console.log(`[Loop:${node.id}] Execution successful (${duration}ms).`); // Ensure closing backtick is present
    return successResult; // Return the full success result

  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMessage = error.message || 'Unknown error during loop execution';

    const errorResult: NodeResult = { // Explicitly create NodeResult object for error case too
        status: 'error',
        error: errorMessage,
        timestamp: Date.now() // Add timestamp to error case too
    };
    setNodeResult(node.id, errorResult);

    return errorResult; // Return the full error result
  }
} 