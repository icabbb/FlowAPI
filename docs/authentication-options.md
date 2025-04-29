# Authentication Options for HTTP Requests

This document provides information about the authentication methods available for HTTP requests in the API Tester.

## Available Authentication Methods

The following authentication methods are supported:

### No Authentication

Default option. No authentication credentials are sent with the request.

### Basic Authentication

Basic HTTP authentication using a username and password. The credentials are encoded and sent in the `Authorization` header.

**Configuration:**
- **Username**: The username for authentication
- **Password**: The password for authentication

**How it works:**
The system encodes the `username:password` pair in Base64 and includes it in the request header as:

```
Authorization: Basic {base64_encoded_credentials}
```

### Bearer Token

Bearer token authentication, commonly used with OAuth 2.0 and JWT tokens.

**Configuration:**
- **Token**: The access token

**How it works:**
The system includes the token in the request header as:

```
Authorization: Bearer {token}
```

### API Key

Authentication using an API key, which can be sent either as a header or a query parameter.

**Configuration:**
- **Key Name**: The name of the API key (e.g., "X-API-Key", "api_key")
- **Key Value**: The actual API key value
- **Add To**: Where to add the key ("Header" or "Query Parameter")

**How it works:**
Depending on the "Add To" setting, the system either:
- Adds a header: `{Key Name}: {Key Value}`
- Adds a query parameter: `?{Key Name}={Key Value}`

### OAuth 2.0

OAuth 2.0 authentication support. While full OAuth 2.0 flow is not implemented in the proxy, you can configure the parameters and use a pre-obtained access token.

**Configuration:**
- **Grant Type**: The OAuth 2.0 grant type (Client Credentials, Authorization Code, Password)
- **Client ID**: The OAuth 2.0 client ID
- **Client Secret**: The OAuth 2.0 client secret
- **Access Token URL**: The URL to obtain access tokens
- **Scope** (optional): The requested scopes for the token

**How it works:**
If you have a pre-obtained access token, you can use Bearer Token authentication instead. The full OAuth 2.0 flow requires additional implementation.

### Digest Authentication

Digest authentication is a more secure alternative to Basic Authentication. It uses a challenge-response mechanism.

**Configuration:**
- **Username**: The username for authentication
- **Password**: The password for authentication
- **Realm** (optional): The authentication realm

**How it works:**
Digest authentication requires a challenge-response flow that is not fully implemented in the current proxy. For production use, consider using Basic or Bearer authentication.

## Tips for Using Authentication

1. **Environment Variables**: You can use environment variables for sensitive credentials like passwords and tokens. This helps avoid hardcoding secrets.

2. **Security**: Remember that in Basic authentication and some other methods, credentials are sent with every request. Use HTTPS to secure the transmission.

3. **Token Management**: For OAuth 2.0, you'll need to manage token acquisition and refreshing separately for now.

4. **Debugging**: If authentication fails, check the response headers and status codes for clues. Common status codes for authentication issues are 401 (Unauthorized) and 403 (Forbidden).

## Implementation Details

Authentication is processed both client-side and server-side:

1. **Client-side**: Most authentication methods are processed in the frontend by adding appropriate headers or query parameters before sending the request to the proxy.

2. **Server-side**: The proxy handles special cases such as Digest authentication, although some methods require additional implementation for full support.

## Example Usage

1. Select the "Auth" tab in the HTTP Request node settings.
2. Choose the authentication method from the dropdown.
3. Fill in the required fields based on the selected method.
4. Save your changes and run the node to make the authenticated request. 