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

// Basic environment variable resolver for the proxy
function resolveEnvVariableInProxy(value: string | undefined): string | undefined {
  if (!value || !value.includes('{{env.')) return value;
  return value.replace(/\{\{\s*env\.(.*?)\s*\}\}/g, (_match, varName) => {
    return process.env[varName] || _match; // Use environment variable or keep original
  });
}

export async function POST(request: NextRequest) {
  let rawBody = ''; // Variable to store raw body for logging
  try {
    // --- Debugging Step: Read raw body first ---
    rawBody = await request.text();


    // --- Now parse the raw body text ---
    const requestData = JSON.parse(rawBody);

    // --- End Debugging Step ---

    // Original line (commented out for now):
    // const requestData = await request.json();

    console.log('[Proxy] Parsed request data:', {
      ...requestData,
      // Log body type and a snippet for debugging, avoid logging full sensitive body
      body: requestData.body ? `[Type: ${typeof requestData.body}] ${JSON.stringify(requestData.body).substring(0, 50)}...` : undefined,
    });

    const {
      url,
      method = 'GET',
      headers: headerEntries,
      queryParams: queryParamEntries,
      body, // Use the body directly as received from execution-service
      bodyType = 'none',
    } = requestData;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
    }

    // Define a base URL for relative paths (remains useful)
    const defaultBaseUrl = process.env.DEFAULT_PROXY_BASE_URL || 'https://jsonplaceholder.typicode.com';
    let targetUrl: string;
    try {
      new URL(url);
      targetUrl = url;
    } catch {
      if (url.startsWith('/')) {
        targetUrl = defaultBaseUrl + url;
      } else {
        return NextResponse.json({ error: 'Invalid relative URL format. Must start with / or be absolute.' }, { status: 400 });
      }
    }

    const finalUrl = new URL(targetUrl);
    const queryParams = entriesToRecord(queryParamEntries);
    Object.keys(queryParams).forEach(key => finalUrl.searchParams.append(key, queryParams[key]));

    const headers = new Headers(entriesToRecord(headerEntries));
    headers.delete('host');
    headers.delete('content-length');

    // --- Simplified Authentication Header Handling ---
    // Remove specific proxy handling for digest/oauth2 for now,
    // as frontend prepares the correct headers (like Authorization: Bearer ...)
    if (headers.has('X-Auth-Type')) {
        // Just delete the helper headers without complex logic
        headers.delete('X-Auth-Type');
        headers.delete('X-Auth-Username');
        headers.delete('X-Auth-Password');
        headers.delete('X-Auth-Realm');
        headers.delete('X-OAuth-Grant-Type');
        headers.delete('X-OAuth-Client-ID');
        headers.delete('X-OAuth-Client-Secret');
        headers.delete('X-OAuth-Token-URL');
        headers.delete('X-OAuth-Scope');
    }
    // --- End Simplified Auth ---

    // Set Content-Type based on bodyType if body exists
    // This might override a Content-Type set by the user, which is standard proxy behavior
    if (body !== undefined && body !== null) {
        if (bodyType === 'json') {
            headers.set('Content-Type', 'application/json');
        } else if (bodyType === 'text') {
            headers.set('Content-Type', 'text/plain');
        } // If bodyType is 'none' or other, don't automatically set Content-Type
    }

    // --- Prepare Body for fetch (Simplified) ---
    let requestBodyForFetch: BodyInit | null | undefined;
    if (method !== 'GET' && method !== 'HEAD' && body !== undefined && body !== null) {
        // If the received body is an object/array, stringify it.
        // If it's already a string (e.g., from text input), use it directly.
        requestBodyForFetch = typeof body === 'string' ? body : JSON.stringify(body);
    } else {
        requestBodyForFetch = undefined; // No body for GET/HEAD or if body is null/undefined
    }
    // --- End Body Preparation ---



    const response = await fetch(finalUrl.toString(), {
      method: method,
      headers: headers,
      body: requestBodyForFetch,
      cache: 'no-store',
    });


    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let responseBody: any;
    const responseText = await response.text();
    try {
        responseBody = JSON.parse(responseText);
    } catch {
        responseBody = responseText;
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
    });

  } catch (error: any) {
    // Log the raw body specifically if JSON parsing fails here
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
       return NextResponse.json({ error: `Proxy failed to parse incoming JSON request body. Check client request format. Error: ${error.message}. Raw body: ${rawBody.substring(0, 200)}...` }, { status: 400 });
    }
    // Keep the check for body-parser specific errors (though less likely now)
    if (error instanceof SyntaxError && error.message.includes('JSON') && (error as any).body) {
       return NextResponse.json({ error: `Proxy failed to parse incoming JSON request body via internal parser. Error: ${error.message}` }, { status: 400 });
    }
    
    let errorMessage = 'Proxy failed to execute request.';
    if (error.cause) {
        errorMessage += ` Cause: ${error.cause.code || error.cause.message || 'Unknown'}`;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
