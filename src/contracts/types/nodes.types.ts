import type { AuthConfig } from "./auth.types"; // Assuming auth.types.ts exists
import type { KeyValueEntry } from "./common.types";
import type { PathEntry } from "@/components/shared/path-list-editor"; // Keep this specific import

/**
 * Data structure for the HttpRequestNode.
 */
export interface HttpRequestNodeData {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  label?: string;
  queryParams?: KeyValueEntry[];
  headers?: KeyValueEntry[];
  bodyType?: "none" | "json" | "text";
  body?: string;
  auth?: AuthConfig;
  [key: string]: any;
}

/**
 * Data structure for the SelectFieldsNode.
 */
export interface SelectFieldsNodeData {
  label?: string;
  jsonPaths?: PathEntry[];
  [key: string]: any;
}

/**
 * Data structure for the DelayNode.
 */
export interface DelayNodeData {
  label?: string;
  delayMs?: number;
  [key: string]: any;
}

/**
 * Data structure for the VariableSetNode.
 */
export interface VariableSetNodeData {
  label?: string;
  variableName?: string;
  variableValue?: string;
  target?: 'flowContext' | 'selectedEnvironment'; // Added target
  markAsSecret?: boolean; // Added markAsSecret
  [key: string]: any;
}

/**
 * Represents a single mapping rule within the TransformNode.
 */
export interface MappingRule {
  id: string;
  inputPath: string;
  outputPath: string;
  enabled: boolean;
}

/**
 * Data structure for the TransformNode.
 */
export interface TransformNodeData {
  label?: string;
  mappingRules?: MappingRule[];
  [key: string]: any;
}

/**
 * Represents a single condition rule within the ConditionalNode.
 */
export interface ConditionRule {
  id: string;
  expression: string;
  outputHandleId: string;
  enabled: boolean;
}

/**
 * Data structure for the ConditionalNode.
 */
export interface ConditionalNodeData {
  label?: string;
  conditions?: ConditionRule[];
  defaultOutputHandleId?: string;
  [key: string]: any;
}

/**
 * Data structure for the LoopNode.
 */
export interface LoopNodeData {
    label?: string;
    inputArrayPath?: string; // Path to the array in the input data
    [key: string]: any;
}

/**
 * Data structure for the ExportNode.
 * This node allows exporting data to various formats like CSV, PDF, DOCX, etc.
 */
export interface ExportNodeData {
    label?: string;
    exportFormat?: 'csv' | 'json' | 'txt' | 'html' | 'markdown';
    fileName?: string;
    includeTimestamp?: boolean;
    flatten?: boolean; // For CSV export of nested structures
    customSeparator?: string; // For CSV export, default is comma
    [key: string]: any;
} 

/**
 * Data structure for the JsonNode.
 */
export interface JsonNodeData {
  label?: string;
  inputData?: any;
}

/**
 * Data structure for the JsonNode.
 */

