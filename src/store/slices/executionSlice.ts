import { StateCreator } from 'zustand';
import { executeSingleNodeLogic, runFlowLogic } from '@/services/execution-service';
import type {
  NodeResult,
} from '@/contracts/types';
import type { FlowStore } from '../index';
import { JSONPath } from 'jsonpath-plus';

// Define FlowExecutionContext locally
export type FlowExecutionContext = Record<string, any>;

export interface ExecutionSlice {
  nodeResults: Record<string, NodeResult>;
  flowExecutionContext: FlowExecutionContext | null;
  isRunning: boolean;

  setNodeResult(id: string, res: Partial<NodeResult>): void;
  clearFlowExecutionContext(): void;
  setFlowContextVariable(k: string, v: any): void;
  runFlow(): Promise<void>;
  executeSingleNode(id: string): Promise<void>;
  resolveVariable(v: string | undefined): string | undefined;
}

export const createExecutionSlice: StateCreator<
  FlowStore, [], [], ExecutionSlice
> = (set, get) => ({
  nodeResults: {},
  flowExecutionContext: null,
  isRunning: false,

  setNodeResult(nodeId, result) {
    const { saveToEnvironment, ...restOfResult } = result;
    const finalNodeResult = { ...restOfResult, timestamp: Date.now() };

    set((state) => ({
      nodeResults: {
        ...state.nodeResults,
        [nodeId]: { ...(state.nodeResults[nodeId] || {}), ...finalNodeResult },
      },
    }));

    if (saveToEnvironment && saveToEnvironment.variableName) {
      const { variableName, value, isSecret } = saveToEnvironment;
      const { selectedEnvironmentId, userId, saveEnvironmentVariable } = get(); // Asumimos que saveEnvironmentVariable existe en environmentSlice

      if (selectedEnvironmentId && userId) {
        saveEnvironmentVariable(selectedEnvironmentId, {
          id: crypto.randomUUID(), // O manejar IDs existentes si la variable ya existe
          key: variableName,
          value: value,
          enabled: true, // Por defecto habilitada
          isSecret: isSecret,
        });
      } else {

      }
    }
  },

  clearFlowExecutionContext: () => set({ flowExecutionContext: null }),

  setFlowContextVariable: (k, v) => set((s: { flowExecutionContext: any; }) => ({
    flowExecutionContext: { ...(s.flowExecutionContext || {}), [k]: v },
  })),

  async runFlow() {
    const { nodes, edges, setNodeResult,
            updateNodeData, resolveVariable,
            clearFlowExecutionContext, setFlowContextVariable } = get();

    set({ isRunning: true });
    set({ nodeResults: Object.fromEntries(
      nodes.map((n: { id: any; }) => [n.id, { status: 'idle' }])) });

    clearFlowExecutionContext(); set({ flowExecutionContext: {} });

    try {
      await runFlowLogic(
        nodes, edges,
        setNodeResult, updateNodeData,
        resolveVariable, setFlowContextVariable,
      );
    } finally { set({ isRunning: false }); }
  },

  async executeSingleNode(nodeId) {
    const { nodes, edges, setNodeResult,
            updateNodeData, resolveVariable,
            setEdgeStatus, setFlowContextVariable } = get();

    set({ isRunning: true });
    edges.filter((e: { source: string; }) => e.source === nodeId)
         .forEach((e: { id: any; }) => setEdgeStatus(e.id, 'loading'));

    try {
      await executeSingleNodeLogic(
        nodeId, nodes, edges,
        setNodeResult, updateNodeData,
        resolveVariable, setFlowContextVariable,
      );
    } finally { set({ isRunning: false }); }
  },

  resolveVariable(valueToResolve) {
    const { flowExecutionContext, nodeResults, getActiveEnvironment } = get();

    if (typeof valueToResolve !== 'string' || !valueToResolve.includes('{{') || !valueToResolve.includes('}}')) {
      return valueToResolve; // No es una cadena o no parece ser una plantilla
    }

    // Regex para encontrar {{expresion}}
    const resolvedValue = valueToResolve.replace(/\{\{\s*(.*?)\s*\}\}/g, (match, expression: string) => {
      const parts = expression.split('::');
      const sourceAndPath = parts[0].split('.');
      const source = sourceAndPath[0];
      const path = parts.length > 1 ? parts[1] : (sourceAndPath.length > 1 ? sourceAndPath.slice(1).join('.') : undefined);

      // 1. Resolver {{env.VAR_NAME}}
      if (source === 'env') {
        const activeEnv = getActiveEnvironment(); // Necesitas getActiveEnvironment del environmentSlice
        const envVarName = path;
        if (activeEnv && envVarName) {
          const envVar = activeEnv.variables.find(v => v.key === envVarName && v.enabled);
          if (envVar) {
            // Aquí podrías tener lógica adicional si las variables de entorno necesitaran desencriptación al leerse,
            // pero usualmente se desencriptan al cargarse en el store.
            return String(envVar.value);
          }
        }

        return match; // Variable de entorno no encontrada
      }

      // 2. Resolver {{context.VAR_NAME}}
      if (source === 'context') {
        const contextVarName = path;
        if (flowExecutionContext && contextVarName && flowExecutionContext.hasOwnProperty(contextVarName)) {
          return String(flowExecutionContext[contextVarName]);
        }

        return match; // Variable de contexto no encontrada
      }

      // 3. Resolver {{nodeId::JSONPath}}
      // Asumimos que 'source' es el nodeId si no es 'env' o 'context'
      const nodeId = source;
      const jsonPath = path; // path aquí es el JSONPath, ej: $.data.token

      if (nodeResults[nodeId] && nodeResults[nodeId].status === 'success' && nodeResults[nodeId].data) {
        if (jsonPath) {
          try {
            // Usar JSONPath para extraer el valor. ¡Necesitarás importar JSONPath!
            const extracted = JSONPath({ path: jsonPath, json: nodeResults[nodeId].data });
            if (extracted && extracted.length > 0) {
              // Devolver el primer resultado. Puede ser string, número, booleano, objeto, array.
              // Convertir a String para consistencia, o manejar tipos según necesidad.
              if (typeof extracted[0] === 'object'){
                return JSON.stringify(extracted[0]); // Si es objeto/array, stringify
              }
              return String(extracted[0]);
            }

            return match; // JSONPath no encontró nada
          } catch (e) {

            return match; // Error en JSONPath
          }
        } else {
          // Si no hay JSONPath, devolver todo el 'data' del nodo (stringify si es objeto)
           if (typeof nodeResults[nodeId].data === 'object'){
                return JSON.stringify(nodeResults[nodeId].data);
           }
          return String(nodeResults[nodeId].data);
        }
      }

      return match; // Nodo no encontrado o sin datos exitosos, o JSONPath faltante
    });

    return resolvedValue;
  },
});
    

