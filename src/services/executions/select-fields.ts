import type { Node, Edge } from '@xyflow/react';
import { JSONPath } from 'jsonpath-plus';
import type {
    SetNodeResultCallback,
    UpdateNodeDataCallback,
    ResolveVariableCallback,
    SetFlowContextVariableCallback,
} from '@/contracts/types/execution.types';
import type { SelectFieldsNodeData } from '@/contracts/types/nodes.types';
import { NodeResult } from '@/contracts/types';
import { triggerNextNodes } from '@/utils/triggerNextNodes';

/**
 * Executes a Select Fields node, extracting data based on JSONPath expressions.
 */
export async function executeSelectFieldsNodeLogic(
  node: Node<SelectFieldsNodeData>,
  inputData: any,
  nodes: Node[],
  edges: Edge[],
  setNodeResult: SetNodeResultCallback,
  updateNodeData: UpdateNodeDataCallback,
  resolveVariable: ResolveVariableCallback,
  setFlowContextVariable: SetFlowContextVariableCallback
): Promise<NodeResult> {
  const { id, data } = node;
  const { jsonPaths = [] } = data;

  setNodeResult(id, { status: 'loading', error: undefined, data: undefined });
  let finalResult: NodeResult = { status: 'idle' };

  try {
    // 1. Validate input data
    if (typeof inputData !== 'object' || inputData === null) {
      throw new Error('Input data must be a JSON object or array.');
    }

    // 2. Filter enabled and valid paths
    const activePaths = jsonPaths.filter(p => p.enabled && p.path.trim());

    if (activePaths.length === 0) {
      (`[ExecutionService] Node ${id} (SelectFields) has no active paths. Outputting empty array.`);
      const result: NodeResult = {
        status: 'success',
        data: [], // Return empty array if no paths are active
        timestamp: Date.now()
      };
      setNodeResult(id, result);
      finalResult = result;
    } else {
        let combinedResults: any[] = [];
        for (const pathEntry of activePaths) {
          const resolvedPath = resolveVariable(pathEntry.path);
          if (!resolvedPath) {
            throw new Error(`Failed to resolve variables in path: "${pathEntry.path}"`);
          }
          
          try {
            const pathResults = JSONPath({ path: resolvedPath, json: inputData, wrap: false });
            if (pathResults !== undefined) {
               if (Array.isArray(pathResults)) {
                 combinedResults = combinedResults.concat(pathResults);
               } else {
                 combinedResults.push(pathResults);
               }
            }
          } catch (e: any) {

            throw new Error(`Error executing JSONPath "${resolvedPath}": ${e.message}`);
          }
        }
        
        const result: NodeResult = {
          status: 'success',
          data: combinedResults,
          timestamp: Date.now()
        };
        setNodeResult(id, result);
        finalResult = result;
    }

  } catch (error: any) {

    const errorResult: NodeResult = {
      status: 'error',
      error: error.message || 'SelectFields node execution failed',
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