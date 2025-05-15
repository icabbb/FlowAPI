import type { Node, Edge } from '@xyflow/react';
import type {
    SetNodeResultCallback,
    UpdateNodeDataCallback,
    ResolveVariableCallback,
    SetFlowContextVariableCallback,
} from '@/contracts/types/execution.types';
import type {
    HttpRequestNodeData,
} from '@/contracts/types/nodes.types';
import type {
    BasicAuthConfig,
    BearerAuthConfig,
    ApiKeyConfig,
} from '@/contracts/types/auth.types';
import type { KeyValueEntry } from '@/contracts/types/common.types';
import type { NodeResult } from '@/contracts/types';
import { resolveKeyValueEntries } from '@/utils/resolveKeyValueEntries';
import { triggerNextNodes } from '@/utils/triggerNextNodes';

/**
 * Executes an HTTP Request node by calling the backend proxy.
 * Updates the node's result status during execution.
 * Resolves environment variables in URL, query params, headers, body, and auth fields.
 */
export async function executeHttpRequestNodeLogic(
  node: Node<HttpRequestNodeData>,
  nodes: Node[],
  edges: Edge[],
  setNodeResult: SetNodeResultCallback,
  updateNodeData: UpdateNodeDataCallback,
  resolveVariable: ResolveVariableCallback,
  setFlowContextVariable: SetFlowContextVariableCallback
): Promise<NodeResult> {
  const { id, data } = node;
  const { method, url, queryParams, headers, bodyType, body, auth } = data;
  
  setNodeResult(id, { status: 'loading', error: undefined, data: undefined });

  let finalResult: NodeResult = { status: 'idle' }; // Variable to hold the final status

  try {
    // --- Variable Resolution ---
    const resolvedUrl = resolveVariable(url);
    let resolvedQueryParams = resolveKeyValueEntries(queryParams, resolveVariable);
    let resolvedHeaders = resolveKeyValueEntries(headers, resolveVariable);
    
    // --- Body Resolution Logic --- 
    let bodyToSendToProxy: any = undefined;
    if (bodyType === 'json') {
      if (body && body.includes('{{')) {
        const resolvedBodyValue = resolveVariable(body);
        if (typeof resolvedBodyValue === 'string') {
          try {
            bodyToSendToProxy = JSON.parse(resolvedBodyValue);
          } catch (e) {

            bodyToSendToProxy = resolvedBodyValue;
          }
        } else {
          bodyToSendToProxy = resolvedBodyValue;
        }
      } else if (body) {
        try {
          bodyToSendToProxy = JSON.parse(body);
        } catch (e) {

          throw new Error(`Invalid JSON format in body: ${(e as Error).message}`);
        }
      } else {
        bodyToSendToProxy = null;
      }
    } else if (bodyType === 'text') {
      bodyToSendToProxy = resolveVariable(body);
    }

    if (!resolvedUrl) {
      throw new Error('URL is required after variable resolution.');
    }

    // --- Authentication Variable Resolution & Header/Param Injection ---
    if (auth && auth.type !== 'none') {
        const authHeaders: Record<string, string> = {};
        const authQueryParams: Record<string, string> = {};

        switch (auth.type) {
            case 'bearer':
                const bearerAuth = auth as BearerAuthConfig;
                const resolvedToken = resolveVariable(bearerAuth.token);
                if (resolvedToken) {
                    authHeaders['Authorization'] = `Bearer ${resolvedToken}`;
                } else {

                }
                break;

            case 'basic':
                const basicAuth = auth as BasicAuthConfig;
                const resolvedUsername = resolveVariable(basicAuth.username);
                const resolvedPassword = resolveVariable(basicAuth.password);
                if (resolvedUsername !== undefined && resolvedPassword !== undefined) {
                    try {
                        const encoded = btoa(`${resolvedUsername}:${resolvedPassword}`);
                        authHeaders['Authorization'] = `Basic ${encoded}`;
                    } catch (e) {

                        throw new Error('Failed to encode Basic Auth credentials.');
                    }
                } else {

                }
                break;

            case 'apiKey':
                const apiKeyAuth = auth as ApiKeyConfig;
                const resolvedApiKey = resolveVariable(apiKeyAuth.key);
                const resolvedApiValue = resolveVariable(apiKeyAuth.value);
                if (resolvedApiKey && resolvedApiValue) {
                    if (apiKeyAuth.addTo === 'header') {
                        authHeaders[resolvedApiKey] = resolvedApiValue;
                    } else { // addTo === 'query'
                        authQueryParams[resolvedApiKey] = resolvedApiValue;
                    }
                } else {

                }
                break;
        }

        resolvedHeaders = resolvedHeaders.filter((h: KeyValueEntry) => h.key.toLowerCase() !== 'authorization');
        resolvedHeaders = resolvedHeaders.concat(Object.entries(authHeaders).map(([key, value]) => ({ id: `auth-${key}`, key, value, enabled: true })));
        resolvedQueryParams = resolvedQueryParams.concat(Object.entries(authQueryParams).map(([key, value]) => ({ id: `auth-${key}`, key, value, enabled: true })));
        

    }

    // --- Fetch Call to Proxy ---

    const proxyPayload = {
      url: resolvedUrl,
      method,
      queryParams: resolvedQueryParams,
      headers: resolvedHeaders,
      bodyType,
      body: bodyToSendToProxy
    };


    const proxyResponse = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proxyPayload),
    });

    const resultData = await proxyResponse.json();

    if (!proxyResponse.ok) {
      const errorResult: NodeResult = {
        status: 'error',
        error: resultData.error || `Proxy Error: ${proxyResponse.statusText}`,
        statusCode: proxyResponse.status,
        headers: resultData.headers,
        data: resultData.body
      };
      setNodeResult(id, errorResult);
      finalResult = errorResult;
    } else {
          const successResult: NodeResult = {
            status: 'success',
            data: resultData.body,
            statusCode: resultData.status,
            headers: resultData.headers
          };
          setNodeResult(id, successResult);
          finalResult = successResult;
      }
  } catch (error: any) {

      const errorResult: NodeResult = {
        status: 'error',
        error: error.message || 'Network request failed'
      };
      setNodeResult(id, errorResult);
      finalResult = errorResult;
  }

  if (finalResult.status === 'success') {
    await triggerNextNodes(id, finalResult.data, nodes, edges, setNodeResult, updateNodeData, resolveVariable, setFlowContextVariable, 'output');
  }

  return finalResult;
} 