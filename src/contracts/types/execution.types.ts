 // Corrected import path

import { NodeResult } from "./flow.types";

/**
 * Callback function signature for updating a node's execution result.
 */
export type SetNodeResultCallback = (nodeId: string, result: Partial<NodeResult>) => void;

/**
 * Callback function signature for updating a node's internal data.
 */
export type UpdateNodeDataCallback = (nodeId: string, data: object) => void;

/**
 * Callback function signature for resolving variables (from env, context, etc.).
 */
export type ResolveVariableCallback = (value: string | undefined) => any; // Keep 'any' for now based on VariableSetNode logic

/**
 * Callback function signature for setting a variable in the flow's execution context.
 */
export type SetFlowContextVariableCallback = (key: string, value: any) => void;

/**
 * Callback function signature for triggering the execution of the next node(s).
 * (Note: This might be refactored later, but keeping for consistency for now)
 */
export type TriggerNextNodeCallback = (nodeId: string, inputData: any, sourceHandleId?: string) => Promise<void>; 