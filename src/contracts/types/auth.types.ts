/**
 * Configuration for Basic Authentication.
 */
export interface BasicAuthConfig {
  type: 'basic';
  username?: string;
  password?: string;
}

/**
 * Configuration for Bearer Token Authentication.
 */
export interface BearerAuthConfig {
  type: 'bearer';
  token?: string;
}

/**
 * Configuration for API Key Authentication.
 */
export interface ApiKeyConfig {
  type: 'apiKey';
  key?: string;
  value?: string;
  addTo?: 'header' | 'query';
}

/**
 * Represents no authentication.
 */
export interface NoAuthConfig {
    type: 'none';
}

/**
 * Union type representing all possible authentication configurations.
 */
export type AuthConfig = NoAuthConfig | BasicAuthConfig | BearerAuthConfig | ApiKeyConfig; 