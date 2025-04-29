import { NextRequest, NextResponse } from 'next/server';

// Helper para convertir array de KeyValueEntry a objeto Record<string, string>
function entriesToRecord(entries: { key: string; value: string; enabled: boolean }[] | undefined): Record<string, string> {
  if (!entries) return {};
  return entries.reduce((acc, entry) => {
    if (entry.enabled && entry.key) {
      acc[entry.key] = entry.value;
    }
    return acc;
  }, {} as Record<string, string>);
}

// Tipos para TypeScript - Removing unused AuthConfig
// interface AuthConfig {
//   type: 'none' | 'basic' | 'bearer' | 'oauth2' | 'api-key' | 'digest';
//   [key: string]: any;
// }

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    console.log('Proxy received request:', {
      ...requestData,
      body: requestData.body ? '[BODY]' : undefined, // No mostrar el body en logs por seguridad
    });

    const { 
      url,
      method = 'GET',
      headers: headerEntries,
      queryParams: queryParamEntries,
      body,
      bodyType = 'none',
      // auth, // Removed unused auth variable
    } = requestData;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
    }

    // Define a base URL for relative paths
    const defaultBaseUrl = process.env.DEFAULT_PROXY_BASE_URL || 'https://jsonplaceholder.typicode.com';

    // Check if the URL is relative (starts with '/') and construct the full URL
    let targetUrl: string;
    try {
      // Try parsing directly - if it works, it's already absolute
      new URL(url);
      targetUrl = url;
    } catch /* (e) - Removed unused e */ {
      // If parsing fails, assume it's relative and prepend the base URL
      if (url.startsWith('/')) {
        targetUrl = defaultBaseUrl + url;
      } else {
        // If it doesn't start with '/' and isn't absolute, it's truly invalid
        return NextResponse.json({ error: 'Invalid relative URL format. Must start with / or be absolute.' }, { status: 400 });
      }
    }
    
    // Use targetUrl for constructing the final URL with query parameters
    const finalUrl = new URL(targetUrl);
    const queryParams = entriesToRecord(queryParamEntries);
    Object.keys(queryParams).forEach(key => finalUrl.searchParams.append(key, queryParams[key]));

    // Preparar Headers
    const headers = new Headers(entriesToRecord(headerEntries));
    // Eliminar headers que el navegador/servidor gestionan automáticamente si se envían desde el cliente
    headers.delete('host');
    headers.delete('content-length'); 
    
    // Ahora procesamos las cabeceras especiales de autenticación
    // (aunque la mayoría del procesamiento ya se realizó en el frontend)
    let digestAuthCredentials: { username: string; password: string; realm?: string } | null = null;
    let oauth2Credentials: any = null;

    // Extraer y eliminar cabeceras especiales para manejo del proxy
    if (headers.has('X-Auth-Type')) {
      const authType = headers.get('X-Auth-Type');
      headers.delete('X-Auth-Type');

      if (authType === 'digest') {
        // Extraer credenciales de digest auth
        digestAuthCredentials = {
          username: headers.get('X-Auth-Username') || '',
          password: headers.get('X-Auth-Password') || '',
        };

        if (headers.has('X-Auth-Realm')) {
          digestAuthCredentials.realm = headers.get('X-Auth-Realm') || undefined;
          headers.delete('X-Auth-Realm');
        }

        // Eliminar cabeceras especiales
        headers.delete('X-Auth-Username');
        headers.delete('X-Auth-Password');
      } 
      else if (authType === 'oauth2') {
        // Extraer información OAuth2
        oauth2Credentials = {
          grantType: headers.get('X-OAuth-Grant-Type'),
          clientId: headers.get('X-OAuth-Client-ID'),
          clientSecret: headers.get('X-OAuth-Client-Secret'),
          tokenUrl: headers.get('X-OAuth-Token-URL'),
          scope: headers.get('X-OAuth-Scope')
        };

        // Eliminar cabeceras especiales
        headers.delete('X-OAuth-Grant-Type');
        headers.delete('X-OAuth-Client-ID');
        headers.delete('X-OAuth-Client-Secret');
        headers.delete('X-OAuth-Token-URL');
        headers.delete('X-OAuth-Scope');
        
        // Si tenemos credenciales OAuth2 completas, intentar obtener un token
        if (oauth2Credentials.clientId && oauth2Credentials.clientSecret && oauth2Credentials.tokenUrl) {
          try {
            // En un entorno real, aquí realizaríamos la solicitud de token OAuth2
            // Para este ejemplo, solo devolvemos un error informando al usuario
            // que esta funcionalidad requiere implementación específica adicional
            return NextResponse.json({ 
              error: 'OAuth2 token acquisition not implemented in this proxy. Please obtain a token manually and use Bearer auth.' 
            }, { status: 501 });
          } catch (error) {
            return NextResponse.json({ 
              error: `Failed to acquire OAuth2 token: ${(error as Error).message}` 
            }, { status: 500 });
          }
        }
      }
    }

    // Manejar Digest Auth si está presente
    if (digestAuthCredentials) {
      try {
        // En un entorno real, aquí implementaríamos el algoritmo completo de Digest Auth
        // Para este ejemplo, solo devolvemos un error informando al usuario
        // que esta funcionalidad requiere implementación específica adicional
        return NextResponse.json({ 
          error: 'Digest authentication not implemented in this proxy. Use Basic or Bearer authentication instead.' 
        }, { status: 501 });
      } catch (error) {
        return NextResponse.json({ 
          error: `Digest auth failed: ${(error as Error).message}` 
        }, { status: 500 });
      }
    }

    // Añadir Content-Type según bodyType
    if (bodyType === 'json' && body) {
        headers.set('Content-Type', 'application/json');
    } else if (bodyType === 'text' && body) {
        headers.set('Content-Type', 'text/plain');
    }

    // Preparar Body
    let requestBody: BodyInit | null | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
        if (bodyType === 'json' || bodyType === 'text') {
            requestBody = body;
        } // Podríamos añadir soporte para form-data, etc. aquí
    }
    
    // Log the final URL before fetching
    console.log(`Proxy making fetch to: ${method} ${finalUrl.toString()}`);

    // Realizar la petición fetch desde el servidor
    const response = await fetch(finalUrl.toString(), {
      method: method,
      headers: headers,
      body: requestBody,
      // Importante: deshabilitar caché para obtener respuestas frescas
      cache: 'no-store',
      // Podríamos necesitar configurar redirect, referrerPolicy, etc.
    });

    console.log(`Proxy received response status: ${response.status}`);

    // Procesar la respuesta
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Intentar leer como texto primero, luego intentar parsear como JSON
    let responseBody: any;
    const responseText = await response.text();
    try {
        responseBody = JSON.parse(responseText);
    } catch /* (e) - Removed unused e */ {
        // Si falla el parseo JSON, devolver como texto plano
        responseBody = responseText;
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
    });

  } catch (error: any) {
    console.error("Proxy Error:", error);
    // Devolver error genérico o más específico si es posible
    let errorMessage = 'Proxy failed to execute request.';
    if (error.cause) { // Node fetch a menudo incluye detalles en 'cause'
        errorMessage += ` Cause: ${error.cause.code || error.cause.message || 'Unknown'}`;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 