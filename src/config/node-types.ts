import { HttpRequestNode } from '@/components/nodes/http-request-node';
import { JsonNode } from '@/components/nodes/json-node';
import { SelectFieldsNode } from '@/components/nodes/select-fields-node';

// Import other node components as needed
import { DelayNode } from '@/components/nodes/delay-node';
import { VariableSetNode } from '@/components/nodes/variable-set-node';
import { TransformNode } from '@/components/nodes/transform-node';
import { ConditionalNode } from '@/components/nodes/conditional-node';
import { LoopNode } from '@/components/nodes/loop-node';
import { ExportNode } from '@/components/nodes/export-node';

/**
 * Defines the available node types for the React Flow canvas.
 * Keys are the node type identifiers (e.g., 'trigger', 'httpRequest').
 * Values are the corresponding React components used to render the nodes.
 */
export const nodeTypes = {
  httpRequest: HttpRequestNode,
  jsonNode: JsonNode,
  selectFields: SelectFieldsNode,
  delayNode: DelayNode,
  variableSetNode: VariableSetNode,
  transformNode: TransformNode,
  conditionalNode: ConditionalNode,
  loop: LoopNode,
  exportNode: ExportNode,
  // Add other custom node types here
} as const;

/**
 * Type representing the valid node type identifiers.
 * Derived from the keys of the `nodeTypes` object.
 */
export type NodeType = keyof typeof nodeTypes;

/**
 * Array of node type identifiers.
 * Useful for iterating over or listing available node types.
 */
export const nodeTypeArray = Object.keys(nodeTypes) as NodeType[]; 