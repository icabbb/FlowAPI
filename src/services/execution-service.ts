import type { Node, Edge } from '@xyflow/react';
import type { NodeResult } from '@/store/flow-store'; // Assuming types are exported from store
import { JSONPath } from 'jsonpath-plus';
import type { PathEntry } from '@/components/shared/path-list-editor';

// Define callback types explicitly for clarity
type SetNodeResultCallback = (nodeId: string, result: Partial<NodeResult>) => void;
type UpdateNodeDataCallback = (nodeId: string, data: object) => void;
// FIX: Export the type so it can be imported by the store
export type ResolveVariableCallback = (value: string | undefined) => string | undefined; // Type for the resolver
// Add callback type for triggering next node execution
type TriggerNextNodeCallback = (nodeId: string, inputData: any) => Promise<void>;

// Define KeyValueEntry locally (matching the structure used elsewhere)
interface KeyValueEntry {
  id: string; 
  key: string;
  value: string;
  enabled: boolean;
}

// Define the specific data structure for HttpRequestNode
interface HttpRequestNodeData {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  label?: string; // Make label optional if it always exists
  queryParams?: KeyValueEntry[]; // Use KeyValueEntry type
  headers?: KeyValueEntry[]; // Use KeyValueEntry type
  bodyType?: 'none' | 'json' | 'text'; 
  body?: string; 
  [key: string]: any; // Keep index signature for flexibility if needed
}

// Define the specific data structure for SelectFieldsNode
interface SelectFieldsNodeData {
  label?: string;
  jsonPaths?: PathEntry[];
  [key: string]: any; // Index signature for flexibility
}

// Helper to resolve variables in KeyValueEntry arrays
function resolveKeyValueEntries(
  entries: KeyValueEntry[] | undefined, 
  resolveVariable: ResolveVariableCallback
): KeyValueEntry[] {
  if (!entries) return [];
  return entries.map(entry => ({
    ...entry,
    value: resolveVariable(entry.value) || entry.value, 
  }));
}

/**
 * Helper function to find and trigger the execution of the next node(s).
 */
async function triggerNextNodes(
  currentNodeId: string,
  outputData: any,
  nodes: Node[],
  edges: Edge[],
  setNodeResult: SetNodeResultCallback,
  updateNodeData: UpdateNodeDataCallback,
  resolveVariable: ResolveVariableCallback
): Promise<void> {
  const outgoingEdges = edges.filter(e => e.source === currentNodeId);
  console.log(`[ExecutionService] Propagating data from ${currentNodeId} via ${outgoingEdges.length} edge(s).`);

  for (const edge of outgoingEdges) {
    const targetNode = nodes.find(n => n.id === edge.target);
    if (targetNode) {
      console.log(` -> Triggering execution for ${targetNode.id} (${targetNode.type})`);
      // Call the appropriate logic function based on target node type
      // We pass all necessary context down
      switch (targetNode.type) {
        case 'jsonNode':
          await executeJsonNodeLogic(targetNode, outputData, nodes, edges, setNodeResult, updateNodeData, resolveVariable);
          break;
        case 'selectFields':
          await executeSelectFieldsNodeLogic(targetNode as Node<SelectFieldsNodeData>, outputData, nodes, edges, setNodeResult, updateNodeData, resolveVariable);
          break;
        // Add cases for other node types here as they are implemented
        default:
          console.warn(`[ExecutionService] Propagation to node type ${targetNode.type} not implemented yet.`);
          // Optionally set the target node state to idle/error if needed
          // setNodeResult(targetNode.id, { status: 'idle' });
      }
    } else {
        console.warn(`[ExecutionService] Target node ${edge.target} not found for edge ${edge.id}`);
    }
  }
}

/**
 * Executes an HTTP Request node by calling the backend proxy.
 * Updates the node's result status during execution.
 * Resolves environment variables in URL, query params, headers, and body.
 * 
 * @param node The HTTP Request node to execute.
 * @param nodes All nodes in the flow.
 * @param edges All edges in the flow.
 * @param setNodeResult Callback function to update the node's result in the store.
 * @param updateNodeData Callback to update node data (might not be needed here directly).
 * @param resolveVariable Callback function to resolve environment variables
 * @returns A promise resolving to the execution result.
 */
export async function executeHttpRequestNodeLogic(
  node: Node<HttpRequestNodeData>,
  nodes: Node[],
  edges: Edge[],
  setNodeResult: SetNodeResultCallback,
  updateNodeData: UpdateNodeDataCallback,
  resolveVariable: ResolveVariableCallback
): Promise<NodeResult> {
  const { id, data } = node;
  const { method, url, queryParams, headers, bodyType, body } = data;
  
  setNodeResult(id, { status: 'loading', error: undefined, data: undefined }); 

  let finalResult: NodeResult = { status: 'idle' }; // Variable to hold the final status

  try {
    // Resolve variables before sending
    const resolvedUrl = resolveVariable(url);
    const resolvedQueryParams = resolveKeyValueEntries(queryParams, resolveVariable);
    const resolvedHeaders = resolveKeyValueEntries(headers, resolveVariable);
    // Resolve body only if it's string-based (JSON or Text)
    const resolvedBody = (bodyType === 'json' || bodyType === 'text') 
                         ? resolveVariable(body) 
                         : body; 

    if (!resolvedUrl) {
      throw new Error('URL is required after variable resolution.');
    }

    const proxyResponse = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: resolvedUrl, 
          method, 
          queryParams: resolvedQueryParams, 
          headers: resolvedHeaders, 
          bodyType, 
          body: resolvedBody 
        }),
      });

      const resultData = await proxyResponse.json();

      if (!proxyResponse.ok) {
         // Error from proxy/target API
         const errorResult: NodeResult = { 
           status: 'error', 
           error: resultData.error || `Proxy Error: ${proxyResponse.statusText}`, 
           statusCode: proxyResponse.status, 
           data: resultData.body // Include body even on error if available
         };
         setNodeResult(id, errorResult);
         finalResult = errorResult;
      } else {
          // Success
          const successResult: NodeResult = { 
            status: 'success', 
            data: resultData.body, 
            statusCode: resultData.status, 
            headers: resultData.headers 
          };
          setNodeResult(id, successResult);
          finalResult = successResult; // Set success result
      }
  } catch (error: any) {
      // Network error or other fetch-related issue
      console.error(`[ExecutionService] Fetch failed for node ${id}:`, error);
      const errorResult: NodeResult = { 
        status: 'error', 
        error: error.message || 'Network request failed' 
      };
      setNodeResult(id, errorResult);
      finalResult = errorResult; // Set error result
  }

  // After try-catch, trigger next nodes ONLY if successful
  if (finalResult.status === 'success') {
    await triggerNextNodes(id, finalResult.data, nodes, edges, setNodeResult, updateNodeData, resolveVariable);
  }

  return finalResult; // Return the actual result of this node
}

/**
 * Executes a JSON node, which typically passes through data or transforms JSON.
 * 
 * @param node The JSON node to execute
 * @param inputData Data received from the previous node
 * @param nodes All nodes in the flow
 * @param edges All edges in the flow
 * @param setNodeResult Callback function to update the node result in the store
 * @param updateNodeData Callback function to update the node data
 * @param resolveVariable Callback function to resolve environment variables
 * @returns A promise resolving to the execution result
 */
export async function executeJsonNodeLogic(
  node: Node,
  inputData: any,
  nodes: Node[],
  edges: Edge[],
  setNodeResult: SetNodeResultCallback,
  updateNodeData: UpdateNodeDataCallback,
  resolveVariable: ResolveVariableCallback
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
    console.error(`[ExecutionService] JSON node execution failed for node ${id}:`, error);
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
    await triggerNextNodes(id, finalResult.data, nodes, edges, setNodeResult, updateNodeData, resolveVariable);
  }

  return finalResult;
}

/**
 * Executes a Select Fields node, extracting data based on JSONPath expressions.
 *
 * @param node The Select Fields node to execute.
 * @param inputData Data received from the previous node.
 * @param nodes All nodes in the flow
 * @param edges All edges in the flow
 * @param setNodeResult Callback function to update the node result in the store.
 * @param updateNodeData Callback function to update the node data
 * @param resolveVariable Callback function to resolve environment variables.
 * @returns A promise resolving to the execution result.
 */
export async function executeSelectFieldsNodeLogic(
  node: Node<SelectFieldsNodeData>,
  inputData: any,
  nodes: Node[],
  edges: Edge[],
  setNodeResult: SetNodeResultCallback,
  updateNodeData: UpdateNodeDataCallback,
  resolveVariable: ResolveVariableCallback
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
      console.log(`[ExecutionService] Node ${id} (SelectFields) has no active paths. Outputting empty array.`);
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
            console.error(`[ExecutionService] JSONPath execution failed for node ${id}, path "${resolvedPath}":`, e);
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
    console.error(`[ExecutionService] SelectFields node execution failed for node ${id}:`, error);
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
    await triggerNextNodes(id, finalResult.data, nodes, edges, setNodeResult, updateNodeData, resolveVariable);
  }

  return finalResult;
}

/**
 * Executes the entire flow sequentially starting from the input/first node.
 * 
 * @param nodes The current list of nodes.
 * @param edges The current list of edges.
 * @param setNodeResult Callback to update a node's execution result.
 * @param updateNodeData Callback to update a node's data.
 * @param resolveVariable Callback function to resolve environment variables
 */
export async function runFlowLogic(
    nodes: Node[],
    edges: Edge[],
    setNodeResult: SetNodeResultCallback,
    updateNodeData: UpdateNodeDataCallback,
    resolveVariable: ResolveVariableCallback
): Promise<void> { 
    console.log('[ExecutionService] --- Running Flow --- ');

    // Find start node (logic remains the same)
    const startNode = nodes.find(n => n.type === 'input') || 
                      nodes.find(n => !edges.some(e => e.target === n.id));
    
    if (!startNode) {
      console.error('[ExecutionService] No start node found!');
      return;
    }

    // Instead of looping, just trigger the first executable node's logic.
    // The propagation is now built into the individual logic functions.
    try {
      switch (startNode.type) {
          case 'input':
            // Input node needs special handling to start the chain
            setNodeResult(startNode.id, { status: 'loading' });
            await new Promise(resolve => setTimeout(resolve, 50)); 
            setNodeResult(startNode.id, { status: 'success', data: startNode.data });
            // Manually trigger the next node(s) after the input node
            await triggerNextNodes(startNode.id, startNode.data, nodes, edges, setNodeResult, updateNodeData, resolveVariable);
            break;
          case 'httpRequest':
            await executeHttpRequestNodeLogic(startNode as Node<HttpRequestNodeData>, nodes, edges, setNodeResult, updateNodeData, resolveVariable);
            break;
          // Add other node types that can be start nodes if necessary
          default:
            console.error(`[ExecutionService] Starting flow with node type ${startNode.type} is not supported yet.`);
            setNodeResult(startNode.id, { status: 'error', error: `Cannot start flow with node type ${startNode.type}` });
        }
    } catch (error) {
         console.error("[ExecutionService] Error during initial node execution in runFlowLogic:", error);
         // Handle error for the start node if execution fails immediately
         setNodeResult(startNode.id, { status: 'error', error: (error as Error).message || 'Flow start failed' });
    }

    // The while loop is removed as propagation is now recursive/chained
    console.log('[ExecutionService] --- Flow Finished (trigger initiated) --- ');
}

/**
 * Orchestrates the execution of a single node and propagates its result.
 * 
 * @param nodeId The ID of the node to execute.
 * @param nodes The current list of nodes.
 * @param edges The current list of edges.
 * @param setNodeResult Callback to update a node's execution result.
 * @param updateNodeData Callback to update a node's data.
 * @param resolveVariable Callback function to resolve environment variables
 */
export async function executeSingleNodeLogic(
    nodeId: string,
    nodes: Node[],
    edges: Edge[],
    setNodeResult: SetNodeResultCallback,
    updateNodeData: UpdateNodeDataCallback,
    resolveVariable: ResolveVariableCallback
): Promise<void> { 
    const nodeToExecute = nodes.find(n => n.id === nodeId);

    if (!nodeToExecute) {
      console.error(`[ExecutionService] Node with ID ${nodeId} not found for execution.`);
      return; 
    }

    console.log(`[ExecutionService] Executing Single Node: ${nodeId} (${nodeToExecute.type}) ---`);
    // No need to track executionResult here, the called function handles it.
    // No need for currentOutputData here, the called function handles propagation.
    
    // Set loading state immediately via callback is handled within each logic function
    // setNodeResult(nodeId, { status: 'loading', error: undefined, data: undefined });

    // Determine input data - GET INPUT DATA FROM PREVIOUS NODE?
    // This is tricky. If we execute node B, where does its input come from?
    // Option 1: Assume it uses its *current* `data.inputData` (if any).
    // Option 2: Find the node connected to its input, get *that* node's last successful output.
    // Option 2 seems more correct but adds complexity here.
    // Let's stick with Option 1 for now: Use existing inputData if present.
    const inputDataForSingleRun = nodeToExecute.data?.inputData; 
    console.log(`[ExecutionService] Input data for single run of ${nodeId}:`, inputDataForSingleRun);

    try {
      // --- Select Execution Logic Based on Node Type --- 
      switch (nodeToExecute.type) {
        case 'httpRequest':
          // HTTP request usually doesn't need input for single run
          await executeHttpRequestNodeLogic(nodeToExecute as Node<HttpRequestNodeData>, nodes, edges, setNodeResult, updateNodeData, resolveVariable);
          break;
        case 'jsonNode':
            await executeJsonNodeLogic(nodeToExecute, inputDataForSingleRun, nodes, edges, setNodeResult, updateNodeData, resolveVariable);
            break;
        case 'selectFields':
            await executeSelectFieldsNodeLogic(nodeToExecute as Node<SelectFieldsNodeData>, inputDataForSingleRun, nodes, edges, setNodeResult, updateNodeData, resolveVariable);
            break;
        default:
          console.warn(`[ExecutionService] Node type ${nodeToExecute.type} cannot be executed individually yet.`);
          setNodeResult(nodeId, { status: 'error', error: `Node type '${nodeToExecute.type}' cannot be executed individually.` }); 
          break;
      }
    } catch (error: any) { 
      console.error(`[ExecutionService] Error executing node ${nodeId} logic:`, error);
      // The called function should have already set the error state, but set again just in case.
      setNodeResult(nodeId, { status: 'error', error: error.message || 'Execution logic failed' }); 
    }
    
    // --- Data Propagation REMOVED --- 
    // Propagation is now handled within each successful node execution logic.
    console.log(`[ExecutionService] Finished request for single node execution: ${nodeId}`);
} 