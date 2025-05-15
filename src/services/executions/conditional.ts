import type { Node, Edge } from '@xyflow/react';
import type {
    SetNodeResultCallback,
    UpdateNodeDataCallback,
    ResolveVariableCallback,
    SetFlowContextVariableCallback,
} from '@/contracts/types/execution.types';
import type {
    ConditionalNodeData,
    SelectFieldsNodeData, // Needed for downstream type casting
    DelayNodeData,
    VariableSetNodeData,
    TransformNodeData,
    LoopNodeData,
} from '@/contracts/types/nodes.types';

// Import downstream execution functions - THIS CREATES A CIRCULAR DEPENDENCY RISK
// A better approach would use a registry/map in the main service
import { executeJsonNodeLogic } from './json';
import { executeSelectFieldsNodeLogic } from './select-fields';
import { executeDelayNodeLogic } from './delay';
import { executeVariableSetNodeLogic } from './variable-set';
import { executeTransformNodeLogic } from './transform';
import { NodeResult } from '@/contracts/types';
import { executeLoopNodeLogic } from './loop';

/**
 * Executes a Conditional Node...
 */
export async function executeConditionalNodeLogic(
  node: Node<ConditionalNodeData>,
  inputData: any,
  nodes: Node[],
  edges: Edge[],
  setNodeResult: SetNodeResultCallback,
  updateNodeData: UpdateNodeDataCallback,
  resolveVariable: ResolveVariableCallback,
  setFlowContextVariable: SetFlowContextVariableCallback
): Promise<NodeResult> {
  const { id, data } = node;
  const { conditions = [], defaultOutputHandleId = 'default' } = data;
  const startTime = Date.now();

  setNodeResult(id, { status: 'loading', timestamp: startTime });
  let finalResult: NodeResult = { status: 'idle' };
  let chosenHandleId: string | null = null;

  try {
    // 1. Iterate through conditions (top-down)
    for (const condition of conditions) {
      if (!condition.expression || !condition.outputHandleId) continue; // Skip invalid conditions

      // 2. Resolve the expression string
      const resolvedExpression = resolveVariable(condition.expression);


      // 3. Basic Truthiness Check (TODO: Implement robust evaluator later)
      let conditionMet = false;
      if (resolvedExpression) {
         const lowerCaseResolved = resolvedExpression.toLowerCase();
         if (lowerCaseResolved === 'true') {
             conditionMet = true;
         } else if (lowerCaseResolved !== 'false' && lowerCaseResolved !== 'null' && lowerCaseResolved !== 'undefined' && lowerCaseResolved !== '0' && resolvedExpression.trim() !== '') {
             // Consider non-empty, non-falsey strings as potentially true
             // This is very basic and might need refinement
             conditionMet = true;
         }
      }

      if (conditionMet) {

        chosenHandleId = condition.outputHandleId;
        break; // Stop at the first matching condition
      }
    }

    // 4. If no condition met, use the default handle
    if (!chosenHandleId) {

      chosenHandleId = defaultOutputHandleId;
    }

    // 5. Set success result (Conditional node itself succeeds)
    const successResult: NodeResult = {
      status: 'success',
      data: inputData, // Pass input data through unchanged
      timestamp: Date.now(),
      // We could potentially add which path was taken to the result data
      // data: { ...inputData, _conditionPathTaken: chosenHandleId }
      
    };
    setNodeResult(id, successResult);
    finalResult = successResult;

  } catch (error: any) {

    const errorResult: NodeResult = {
      status: 'error',
      error: error.message || 'Conditional node execution failed',
      timestamp: Date.now()
    };
    setNodeResult(id, errorResult);
    finalResult = errorResult;
  }

  // 6. Trigger next nodes ONLY from the chosen handle
  if (finalResult.status === 'success' && chosenHandleId) {
    const outgoingEdges = edges.filter(e => e.source === id && e.sourceHandle === chosenHandleId);


    // Trigger only the nodes connected to the chosen source handle
    // NOTE: This approach creates circular dependencies if not careful. Refactoring to a central dispatcher is better.
    for (const edge of outgoingEdges) {
        const targetNode = nodes.find(n => n.id === edge.target);
        if (targetNode) {

            // Re-call the appropriate logic function based on target node type
            switch (targetNode.type) {
                case 'jsonNode':
                    await executeJsonNodeLogic(targetNode, inputData, nodes, edges, setNodeResult, updateNodeData, resolveVariable, setFlowContextVariable);
                    break;
                case 'selectFields':
                    await executeSelectFieldsNodeLogic(targetNode as Node<SelectFieldsNodeData>, inputData, nodes, edges, setNodeResult, updateNodeData, resolveVariable, setFlowContextVariable);
                    break;
                case 'delayNode':
                    // Casting needed here for the imported function
                    await executeDelayNodeLogic(targetNode as Node<DelayNodeData>, inputData, nodes, edges, setNodeResult, updateNodeData, resolveVariable, setFlowContextVariable);
                    break;
                case 'variableSetNode':
                    await executeVariableSetNodeLogic(targetNode as Node<VariableSetNodeData>, inputData, nodes, edges, setNodeResult, updateNodeData, resolveVariable, setFlowContextVariable);
                    break;
                case 'transformNode':
                    await executeTransformNodeLogic(targetNode as Node<TransformNodeData>, inputData, nodes, edges, setNodeResult, updateNodeData, resolveVariable, setFlowContextVariable);
                    break;
                case 'conditionalNode': // Allow chaining conditionals
                    // Recursive call to self - ensure proper termination logic exists in flows
                    await executeConditionalNodeLogic(targetNode as Node<ConditionalNodeData>, inputData, nodes, edges, setNodeResult, updateNodeData, resolveVariable, setFlowContextVariable);
                    break;
                case 'loopNode':
                    await executeLoopNodeLogic(targetNode as Node<LoopNodeData>, inputData, nodes, edges, setNodeResult, updateNodeData, resolveVariable, setFlowContextVariable);
                    break;
                case 'delayNode':
                    await executeDelayNodeLogic(targetNode as Node<DelayNodeData>, inputData, nodes, edges, setNodeResult, updateNodeData, resolveVariable, setFlowContextVariable);
                    break;
                    
                // Add other cases as needed
                default:

            }
        } else {

        }
    }
  }
  // If status is error, or no chosen handle (shouldn't happen with default), no propagation occurs.


  return finalResult;
} 