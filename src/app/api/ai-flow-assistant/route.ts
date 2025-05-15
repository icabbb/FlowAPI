import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Node, Edge } from '@xyflow/react'; // Assuming types are globally available or adjust import
import JSON5 from 'json5'; // Importar JSON5

// Define the expected structure of the AI's response content (must be valid JSON)
interface AiFlowResponseStructure {
  explanation: string;
  flow: {
    nodes: Node[];
    edges: Edge[];
  } | null;
}

// Placeholder for the actual prompt engineering
function buildPrompt(userInput: string): string {
  const promptInstructions = `
Eres un asistente experto en APIs y React Flow.
Tu objetivo es generar un objeto JSON para React Flow basado en la petición del usuario.

**REGLAS PRINCIPALES:**
1. Responde **ÚNICAMENTE** con el objeto JSON solicitado.
2. El JSON debe tener 2 claves: 'explanation' (string breve) y 'flow' (objeto con 'nodes' y 'edges').
3. Genera IDs únicos para nodos y aristas (ej: 'ai-node-1', 'ai-edge-1').
4. Posiciona los nodos secuencialmente (incrementa 'x' ~350px por paso).

**NODOS:**
- 'nodes' es un array. Cada nodo necesita: 'id', 'type', 'position', 'data'.
- Tipos de nodos disponibles: 'httpRequest', 'jsonNode', 'selectFields', 'variableSetNode', 'transformNode', 'conditionalNode', 'loopNode', 'delayNode', 'exportNode'.
- Estructura de 'data' (simplificada, añade solo lo necesario):
  - httpRequest: { label, method, url, queryParams?, headers?, bodyType?, body?, auth? }
  - jsonNode: { label }
  - selectFields: { label, jsonPaths: [ { id, path, enabled } ] }
  - variableSetNode: { label, variableName, variableValue, target: 'flowContext'|'selectedEnvironment', markAsSecret? }
  - transformNode: { label, mappingRules: [ { id, inputPath, outputPath, enabled } ] }
  - conditionalNode: { label, conditions: [ { id, expression, outputHandleId } ], defaultOutputHandleId }
  - loopNode: { label, inputArrayPath }
  - delayNode: { label, delayMs }
  - exportNode: { label, exportFormat, fileName }

**ARISTAS (EDGES):**
- 'edges' es un array. Cada arista necesita: 'id', 'source' (nodeId), 'target' (nodeId), 'sourceHandle', 'targetHandle', 'type': 'animated'.

**HANDLES (Puntos de Conexión):**
- **IMPORTANTE:** Debes especificar 'sourceHandle' y 'targetHandle' correctos en cada arista.
  Es **ABSOLUTAMENTE CRUCIAL** que los valores de \`sourceHandle\` y \`targetHandle\` coincidan EXACTAMENTE con los IDs definidos en esta sección (ej: 'input', 'output', o los IDs dinámicos de 'conditionalNode'/'loopNode'). Si los nombres no coinciden perfectamente, los nodos NO SE CONECTARÁN VISUALMENTENTE en la interfaz.
- Default Handles: Para la mayoría de los nodos, el \`sourceHandle\` es 'output' y el \`targetHandle\` es 'input'.
- conditionalNode Handles:
  - Salidas (sourceHandle): Deben ser los \`outputHandleId\` definidos dentro de \`data.conditions\` o el \`defaultOutputHandleId\` del nodo.
  - Entrada (targetHandle): Es 'input'.
- loopNode Handles:
  - Salidas (sourceHandle): Son 'loopBody' (para el cuerpo del bucle) y 'loopEnd' (para la salida después del bucle).
  - Entrada (targetHandle): Es 'input'.

**REFERENCIAS DINÁMICAS (en valores de 'data'):**
- {{env.NOMBRE_VAR}} -> Variable de entorno.
- {{context.NOMBRE_VAR}} -> Variable de contexto del flujo.
- {{idDelNodoAnterior::jsonPath}} -> Valor extraído del resultado del nodo con ese ID usando JSONPath (ej: {{ai-extract-token::$.token}}).
- {{input}} -> Se refiere a la entrada directa del nodo actual (útil en 'conditionalNode' y dentro de 'loopNode').

**EJEMPLO DE USO:**
- Login y extraer token: httpRequest (POST /login) -> selectFields (path: '$.token')
- Usar token: httpRequest (GET /me, header 'Authorization': 'Bearer {{idSelectFields::$.token}}')

**INSTRUCCIÓN FINAL:**
Procesa la siguiente petición y devuelve **SOLO el objeto JSON**:\n\n`;

  // Limpiar backticks internos por si acaso y añadir userInput de forma segura
  const finalPrompt = promptInstructions.replace(/`([^`]*)`/g, "'$1'");
  return `${finalPrompt}\"${userInput.replace(/"/g, '\\\"')}\"`;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt: userInput } = await request.json();

    if (!userInput) {
      return NextResponse.json({ error: 'User input prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured on server' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' }); // Or another suitable model

    const generationConfig = {
      temperature: 0.7, // Adjust creativity/predictability
      topK: 1,
      topP: 1,
      maxOutputTokens: 8192, // Adjust based on expected response size
      // Ensure response is JSON
      response_mime_type: "application/json",
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const fullPrompt = buildPrompt(userInput);




    const result = await model.generateContent(
      fullPrompt, 
      // generationConfig, // Config included directly in generateContent now
      // safetySettings // Safety settings included directly
    );

    // --- Temporary Simulated Response --- 
    // Remove/comment this block out once you have a valid API key and want to test the real AI

    // const simulatedResponse: AiFlowResponseStructure = {
    //   explanation: "Simulated: Created a GET node and a JSON output node.",
    //   flow: {
    //     nodes: [
    //       { id: 'ai-node-1', type: 'httpRequest', position: { x: 100, y: 100 }, data: { label: 'Simulated GET', method: 'GET', url: '/posts/1' } },
    //       { id: 'ai-node-2', type: 'jsonNode', position: { x: 450, y: 100 }, data: { label: 'Simulated Output' } },
    //     ],
    //     edges: [
    //       { id: 'ai-edge-1', source: 'ai-node-1', target: 'ai-node-2', type: 'animated' }
    //     ]
    //   }
    // };
    // return NextResponse.json(simulatedResponse);
    // --- End of Temporary Simulated Response --- 
    
    // --- Process Real Gemini Response --- 
    const response = result.response;
    let responseText = response.text(); // Make it mutable



    
    // Clean the response text: remove markdown code block fences
    responseText = responseText.replace(/^```json\s*/, '').replace(/```$/, '').trim();



    
    try {
      // Extract the main JSON block (handling potential extra text outside braces)
      const firstBraceIndex = responseText.indexOf('{');
      const lastBraceIndex = responseText.lastIndexOf('}');

      if (firstBraceIndex === -1 || lastBraceIndex === -1 || lastBraceIndex < firstBraceIndex) {
        throw new Error('Could not find valid JSON braces in the cleaned AI response.');
      }

      const jsonToParse = responseText.substring(firstBraceIndex, lastBraceIndex + 1);




      // Attempt to parse the EXTRACTED JSON string
      const parsedResponse: AiFlowResponseStructure = JSON5.parse(jsonToParse);
      
      // Basic validation of the parsed structure
      if (!parsedResponse || !parsedResponse.explanation || !parsedResponse.flow || !Array.isArray(parsedResponse.flow.nodes) || !Array.isArray(parsedResponse.flow.edges)) {
         throw new Error('AI response is not in the expected JSON format.');
      }

      // Add simple validation for node/edge structure if needed
      // e.g., check if nodes have id, type, position, data
      // e.g., check if edges have id, source, target
      
      return NextResponse.json(parsedResponse);

    } catch (parseError: any) {

      console.error("Raw AI response text:", responseText); // Log raw text on error
      return NextResponse.json({ error: `Failed to parse AI response. Error: ${parseError.message}. Raw: ${responseText.substring(0, 200)}...` }, { status: 500 });
    }

  } catch (error: any) {

    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 