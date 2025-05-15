import type { Node, Edge } from '@xyflow/react';
import type {
    SetNodeResultCallback,
    UpdateNodeDataCallback,
    ResolveVariableCallback,
    SetFlowContextVariableCallback,
} from '@/contracts/types/execution.types';
import type {
    VariableSetNodeData,
} from '@/contracts/types/nodes.types';

import { triggerNextNodes } from '@/utils/triggerNextNodes';
import { NodeResult } from '@/contracts/types';

/**
 * Executes a Variable Set Node...
 */
export async function executeVariableSetNodeLogic(
  node: Node<VariableSetNodeData>,
  inputData: any, // Input data is usually passed through
  nodes: Node[],
  edges: Edge[],
  setNodeResult: SetNodeResultCallback,
  updateNodeData: UpdateNodeDataCallback,
  resolveVariable: ResolveVariableCallback,
  setFlowContextVariable: SetFlowContextVariableCallback // Keep context setter
): Promise<NodeResult> {
  const startTime = Date.now();
  // Destructure all relevant fields from node.data
  const { variableName, variableValue, target = 'flowContext', markAsSecret = false } = node.data;

  setNodeResult(node.id, { status: 'loading', timestamp: startTime });
  console.log(`[VarSet:${node.id}] Executing. Target: ${target}, Name: ${variableName}, InputValue: ${variableValue}, Secret: ${markAsSecret}`); // Log start details

  try {
    if (!variableName || variableName.trim() === '') {
      throw new Error('Variable Name is required.');
    }

    let result: NodeResult;

    if (target === 'selectedEnvironment') {
      // --- Environment Target ---
      // **RESOLVE** the variableValue first to get the actual value to save.

      const resolvedValueForEnv = resolveVariable(String(variableValue ?? '')); // Handle potential undefined/null




      result = {
        status: 'success',
        data: inputData, // Pass input data through
        timestamp: Date.now(),
        saveToEnvironment: {
          variableName: variableName.trim(), // Ensure trimmed name
          value: resolvedValueForEnv, // Pass the RESOLVED value
          isSecret: markAsSecret,
        },
      };
      // Do NOT set in flow context if target is environment

    } else {
      // --- Flow Context Target (Default) ---
      // Resolve the value using environment, context, or previous node results

      // Ensure variableValue is treated as a string before resolving
      const resolvedValueForContext = resolveVariable(String(variableValue ?? '')); // Handle potential undefined/null
      console.log(`[VarSet:${node.id}] Resolved value for flow context:`, resolvedValueForContext); // Log after resolve


      setFlowContextVariable(variableName.trim(), resolvedValueForContext); // Ensure trimmed name
      console.log(`[VarSet:${node.id}] Flow context variable set.`); // Log after set

      result = {
        status: 'success',
        data: inputData, // Pass input data through unchanged
        timestamp: Date.now(),
      };
    }

    // Set the final node result (which includes the saveToEnvironment signal if applicable)
    setNodeResult(node.id, result);

    // Trigger next nodes - Pass the source handle ID, usually 'output'
    // Pass inputData as the data payload for the next nodes
    await triggerNextNodes(node.id, inputData, nodes, edges, setNodeResult, updateNodeData, resolveVariable, setFlowContextVariable, 'output');

    return result;

  } catch (error: any) {

    const result: NodeResult = {
      status: 'error',
      error: error.message || 'Failed to set variable',
      timestamp: Date.now(),
    };
    setNodeResult(node.id, result);
    return result;
  }
} 