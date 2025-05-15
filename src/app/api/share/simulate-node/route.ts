import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Esquema para validar la configuración del HttpRequestNode recibida
const HttpRequestConfigSchema = z.object({
  url: z.string().url({ message: "Invalid URL format" }),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).optional().default('GET'),
  // Ignoramos headers, body, queryParams, bodyType por simplicidad y seguridad en la simulación pública
});

// Esquema para validar el cuerpo de la petición a nuestra API
const SimulationRequestSchema = z.object({
  nodeType: z.literal('httpRequest'),
  config: HttpRequestConfigSchema,
});

/**
 * POST /api/share/simulate-node
 *
 * Ejecuta una petición HTTP simple en nombre de la simulación de un nodo compartido.
 * Endpoint público (no requiere autenticación) pero con validaciones.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar el cuerpo de la petición
    const validation = SimulationRequestSchema.safeParse(body);
    if (!validation.success) {

      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { config } = validation.data;
    const { url, method } = config;

    (`Simulating ${method} request to: ${url}`);

    // --- Ejecutar la petición externa ---
    // Usamos fetch directamente desde el servidor
    // ¡IMPORTANTE! Añadir medidas de seguridad aquí en un entorno real:
    // - Lista blanca de dominios permitidos
    // - Timeout para las peticiones
    // - Limitar tamaño de respuesta
    // - Rate limiting para el endpoint

    const fetchOptions: RequestInit = {
      method: method,
      // No incluimos headers o body de la configuración original por seguridad
      headers: {
        'User-Agent': 'FlowShareSimulator/1.0', // Identificar nuestra simulación
        'Accept': 'application/json, text/plain, */*' // Aceptar varios tipos
      },
      redirect: 'follow', // Seguir redirecciones
    };

    const externalResponse = await fetch(url, fetchOptions);

    // --- Procesar la respuesta externa ---
    const status = externalResponse.status;
    const statusText = externalResponse.statusText;
    const responseHeaders: Record<string, string> = {};
    externalResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let responseData: any;
    const contentType = externalResponse.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      responseData = await externalResponse.json();
    } else if (contentType.includes('text')) {
      responseData = await externalResponse.text();
    } else {
      // Para otros tipos, intentar leer como texto o indicar tipo binario
      try {
        responseData = await externalResponse.text();
        if (responseData.length > 1000) responseData = responseData.substring(0, 1000) + '... (truncated)';
      } catch (e) {
         responseData = `[Non-text content type: ${contentType}]`;
      }
    }

    // Construir la respuesta para el frontend
    const simulationResult = {
      status: status,
      statusText: statusText,
      headers: responseHeaders,
      data: responseData,
    };

    // Si la petición externa falló (ej. 4xx, 5xx), devolver éxito=false pero con los datos del error
    if (!externalResponse.ok) {

      return NextResponse.json(
        { success: false, error: `External request failed: ${status} ${statusText}`, data: simulationResult },
        { status: 200 } // Devolvemos 200 OK a nuestro frontend, el error está en los datos
      );
    }

    // Éxito
    return NextResponse.json({ success: true, data: simulationResult });

  } catch (error: any) {

    // Diferenciar errores de fetch (ej. DNS no encontrado) de otros errores
    let errorMessage = 'Internal server error during simulation';
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
        errorMessage = `Network error while trying to fetch external URL: ${error.cause || error.message}`;
    } else if (error.message) {
        errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
