'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

// Auth Types
export type AuthType = 'none' | 'basic' | 'bearer' | 'apiKey' | 'oauth2' | 'digest';

// Base Auth Config
export interface AuthConfig {
  type: AuthType;
}

// Basic Auth Config
export interface BasicAuthConfig extends AuthConfig {
  type: 'basic';
  username: string;
  password: string;
}

// Bearer Token Config
export interface BearerAuthConfig extends AuthConfig {
  type: 'bearer';
  token: string;
}

// API Key Config
export interface ApiKeyConfig extends AuthConfig {
  type: 'apiKey';
  key: string;
  value: string;
  addTo: 'header' | 'query';
}

// OAuth2 Config
export interface OAuth2Config extends AuthConfig {
  type: 'oauth2';
  clientId: string;
  clientSecret: string;
  accessTokenUrl: string;
  scopes: string;
  grantType: 'client_credentials' | 'authorization_code' | 'password';
  refreshToken?: string;
  accessToken?: string;
}

// Digest Auth Config
export interface DigestConfig extends AuthConfig {
  type: 'digest';
  username: string;
  password: string;
  realm?: string;
  nonce?: string;
}

// Union type for all auth configs
export type SpecificAuthConfig =
  | AuthConfig
  | BasicAuthConfig
  | BearerAuthConfig
  | ApiKeyConfig
  | OAuth2Config
  | DigestConfig;

// Default OAuth2 configuration
const defaultOAuth2Config: OAuth2Config = {
  type: 'oauth2',
  clientId: '',
  clientSecret: '',
  accessTokenUrl: '',
  scopes: '',
  grantType: 'client_credentials',
};

// Component Props
interface AuthSettingsProps {
  authConfig: SpecificAuthConfig;
  onChange: (config: SpecificAuthConfig) => void;
}

export function AuthSettings({ authConfig, onChange }: AuthSettingsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Local state to manage form values
  const [localConfig, setLocalConfig] = useState<SpecificAuthConfig>(authConfig);

  // Update local state when authConfig changes
  useEffect(() => {
    setLocalConfig(authConfig);
  }, [authConfig]);

  // Handle auth type change
  const handleAuthTypeChange = (type: string) => {
    let newConfig: SpecificAuthConfig;

    switch (type) {
      case 'basic':
        newConfig = { type: 'basic', username: '', password: '' };
        break;
      case 'bearer':
        newConfig = { type: 'bearer', token: '' };
        break;
      case 'apiKey':
        newConfig = { type: 'apiKey', key: '', value: '', addTo: 'header' };
        break;
      case 'oauth2':
        newConfig = { ...defaultOAuth2Config };
        break;
      case 'digest':
        newConfig = { type: 'digest', username: '', password: '' };
        break;
      default:
        newConfig = { type: 'none' };
    }

    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const updatedConfig = { ...localConfig, [name]: value };
    setLocalConfig(updatedConfig);
    onChange(updatedConfig);
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    const updatedConfig = { ...localConfig, [name]: value };
    setLocalConfig(updatedConfig);
    onChange(updatedConfig);
  };

  // Render form based on auth type
  const renderAuthForm = () => {
    switch (localConfig.type) {
      case 'basic':
        return renderBasicAuthForm(localConfig as BasicAuthConfig);
      case 'bearer':
        return renderBearerTokenForm(localConfig as BearerAuthConfig);
      case 'apiKey':
        return renderApiKeyForm(localConfig as ApiKeyConfig);
      case 'oauth2':
        return renderOAuth2Form(localConfig as OAuth2Config);
      case 'digest':
        return renderDigestForm(localConfig as DigestConfig);
      default:
        return renderNoAuthForm();
    }
  };

  // No Auth Form
  const renderNoAuthForm = () => (
    <div className={cn(
      "text-sm py-2",
      isDark ? "text-blue-100/70" : "text-neutral-400"
    )}>
      No authentication will be applied to the request.
    </div>
  );

  // Basic Auth Form
  const renderBasicAuthForm = (config: BasicAuthConfig) => (
    <div className="space-y-4">
      <Alert className={cn(
        "px-3 py-2",
        isDark ? "bg-blue-900/20 border-blue-800/40" : "bg-cyan-50 border-cyan-100"
      )}>
        <AlertDescription className={cn(
          "text-xs",
          isDark ? "text-blue-100/70" : "text-neutral-600"
        )}>
          Credentials will be Base64 encoded and sent in the Authorization header.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="username" className={cn(
            "text-sm font-medium mb-1.5 block",
            isDark ? "text-blue-200" : "text-neutral-700"
          )}>
            Username
          </Label>
          <Input
            id="username"
            name="username"
            value={config.username}
            onChange={handleInputChange}
            placeholder="Enter username"
            className={cn(
              "nodrag w-full rounded-lg focus:outline-none h-9 px-3 text-sm shadow-sm",
              isDark 
                ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400" 
                : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
            )}
          />
        </div>
        
        <div>
          <Label htmlFor="password" className={cn(
            "text-sm font-medium mb-1.5 block",
            isDark ? "text-blue-200" : "text-neutral-700"
          )}>
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={config.password}
            onChange={handleInputChange}
            placeholder="Enter password"
            className={cn(
              "nodrag w-full rounded-lg focus:outline-none h-9 px-3 text-sm shadow-sm",
              isDark 
                ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400" 
                : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
            )}
          />
        </div>
      </div>
    </div>
  );

  // Bearer Token Form
  const renderBearerTokenForm = (config: BearerAuthConfig) => (
    <div className="space-y-4">
      <Alert className={cn(
        "px-3 py-2",
        isDark ? "bg-blue-900/20 border-blue-800/40" : "bg-cyan-50 border-cyan-100"
      )}>
        <AlertDescription className={cn(
          "text-xs",
          isDark ? "text-blue-100/70" : "text-neutral-600"
        )}>
          Token will be sent in the Authorization header as "Bearer {config.token}".
        </AlertDescription>
      </Alert>
      
      <div>
        <Label htmlFor="token" className={cn(
          "text-sm font-medium mb-1.5 block",
          isDark ? "text-blue-200" : "text-neutral-700"
        )}>
          Token
        </Label>
        <Input
          id="token"
          name="token"
          value={config.token}
          onChange={handleInputChange}
          placeholder="Enter token"
          className={cn(
            "nodrag w-full rounded-lg focus:outline-none h-9 px-3 text-sm shadow-sm",
            isDark 
              ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400" 
              : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
          )}
        />
      </div>
    </div>
  );

  // API Key Form
  const renderApiKeyForm = (config: ApiKeyConfig) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="key" className={cn(
            "text-sm font-medium mb-1.5 block",
            isDark ? "text-blue-200" : "text-neutral-700"
          )}>
            Key Name
          </Label>
          <Input
            id="key"
            name="key"
            value={config.key}
            onChange={handleInputChange}
            placeholder="X-API-Key"
            className={cn(
              "nodrag w-full rounded-lg focus:outline-none h-9 px-3 text-sm shadow-sm",
              isDark 
                ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400" 
                : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
            )}
          />
        </div>
        
        <div>
          <Label htmlFor="value" className={cn(
            "text-sm font-medium mb-1.5 block",
            isDark ? "text-blue-200" : "text-neutral-700"
          )}>
            Key Value
          </Label>
          <Input
            id="value"
            name="value"
            value={config.value}
            onChange={handleInputChange}
            placeholder="your-api-key"
            className={cn(
              "nodrag w-full rounded-lg focus:outline-none h-9 px-3 text-sm shadow-sm",
              isDark 
                ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400" 
                : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
            )}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="addTo" className={cn(
          "text-sm font-medium mb-1.5 block",
          isDark ? "text-blue-200" : "text-neutral-700"
        )}>
          Add To
        </Label>
        <Select 
          value={config.addTo} 
          onValueChange={(value) => handleSelectChange('addTo', value)}
        >
          <SelectTrigger 
            id="addTo" 
            className={cn(
              "nodrag h-9 focus:outline-none rounded-lg shadow-sm",
              isDark 
                ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400"
                : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
            )}
          >
            <SelectValue placeholder="Select where to add the API key" />
          </SelectTrigger>
          <SelectContent 
            className={cn(
              "rounded-lg shadow-md",
              isDark 
                ? "bg-neutral-800 border-2 border-blue-500 text-white" 
                : "bg-white border-2 border-neutral-800 text-neutral-800"
            )}
          >
            <SelectItem 
              value="header" 
              className={cn(
                "cursor-pointer rounded",
                isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
              )}
            >
              Header
            </SelectItem>
            <SelectItem 
              value="query" 
              className={cn(
                "cursor-pointer rounded",
                isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
              )}
            >
              Query Parameter
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // OAuth2 Form
  const renderOAuth2Form = (config: OAuth2Config) => (
    <div className="space-y-4">
      <Alert className={cn(
        "rounded-xl p-3 flex items-start gap-2 shadow-sm",
        isDark ? "bg-blue-900/30 border-2 border-blue-800/60" : "bg-amber-100 border-2 border-amber-700 text-amber-800"
      )}>
        <AlertTriangle className={cn(
          "h-4 w-4 flex-shrink-0 mt-0.5",
          isDark ? "text-amber-400" : "text-amber-600"
        )} />
        <AlertDescription className={cn(
          "text-xs font-medium",
          isDark ? "text-blue-100/80" : "text-amber-800"
        )}>
          OAuth2 configuration is complex. Currently, only client credentials flow is fully supported.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="grantType" className={cn(
            "text-sm font-semibold mb-1.5 block",
            isDark ? "text-blue-200" : "text-neutral-700"
          )}>
            Grant Type
          </Label>
          <Select 
            value={config.grantType} 
            onValueChange={(value) => handleSelectChange('grantType', value)}
          >
            <SelectTrigger 
              id="grantType" 
              className={cn(
                "nodrag h-10 focus:outline-none rounded-lg shadow-sm",
                isDark 
                  ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400"
                  : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
              )}
            >
              <SelectValue placeholder="Select grant type" />
            </SelectTrigger>
            <SelectContent 
              className={cn(
                "rounded-lg shadow-md",
                isDark 
                  ? "bg-neutral-800 border-2 border-blue-500 text-white" 
                  : "bg-white border-2 border-neutral-800 text-neutral-800"
              )}
            >
              <SelectItem 
                value="client_credentials" 
                className={cn(
                  "cursor-pointer rounded",
                  isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
                )}
              >
                Client Credentials
              </SelectItem>
              <SelectItem 
                value="authorization_code" 
                className={cn(
                  "cursor-pointer rounded",
                  isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
                )}
              >
                Authorization Code
              </SelectItem>
              <SelectItem 
                value="password" 
                className={cn(
                  "cursor-pointer rounded",
                  isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
                )}
              >
                Password
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="accessTokenUrl" className={cn(
            "text-sm font-semibold mb-1.5 block",
            isDark ? "text-blue-200" : "text-neutral-700"
          )}>
            Access Token URL
          </Label>
          <Input
            id="accessTokenUrl"
            name="accessTokenUrl"
            value={config.accessTokenUrl}
            onChange={handleInputChange}
            placeholder="https://auth.example.com/oauth/token"
            className={cn(
              "nodrag w-full rounded-lg focus:outline-none h-10 px-3 text-sm shadow-sm",
              isDark 
                ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400" 
                : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="clientId" className={cn(
              "text-sm font-semibold mb-1.5 block",
              isDark ? "text-blue-200" : "text-neutral-700"
            )}>
              Client ID
            </Label>
            <Input
              id="clientId"
              name="clientId"
              value={config.clientId}
              onChange={handleInputChange}
              placeholder="Client ID"
              className={cn(
                "nodrag w-full rounded-lg focus:outline-none h-10 px-3 text-sm shadow-sm",
                isDark 
                  ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400" 
                  : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
              )}
            />
          </div>
          
          <div>
            <Label htmlFor="clientSecret" className={cn(
              "text-sm font-semibold mb-1.5 block",
              isDark ? "text-blue-200" : "text-neutral-700"
            )}>
              Client Secret
            </Label>
            <Input
              id="clientSecret"
              name="clientSecret"
              type="password"
              value={config.clientSecret}
              onChange={handleInputChange}
              placeholder="Client Secret"
              className={cn(
                "nodrag w-full rounded-lg focus:outline-none h-10 px-3 text-sm shadow-sm",
                isDark 
                  ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400" 
                  : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
              )}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="scopes" className={cn(
            "text-sm font-semibold mb-1.5 block",
            isDark ? "text-blue-200" : "text-neutral-700"
          )}>
            Scopes (space separated)
          </Label>
          <Input
            id="scopes"
            name="scopes"
            value={config.scopes}
            onChange={handleInputChange}
            placeholder="profile email"
            className={cn(
              "nodrag w-full rounded-lg focus:outline-none h-10 px-3 text-sm shadow-sm",
              isDark 
                ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400" 
                : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
            )}
          />
        </div>
      </div>
    </div>
  );

  // Digest Auth Form
  const renderDigestForm = (config: DigestConfig) => (
    <div className="space-y-4">
      <Alert className={cn(
        "rounded-xl p-3 flex items-start gap-2 shadow-sm",
        isDark ? "bg-blue-900/30 border-2 border-blue-800/60" : "bg-amber-100 border-2 border-amber-700 text-amber-800"
      )}>
        <AlertTriangle className={cn(
          "h-4 w-4 flex-shrink-0 mt-0.5",
          isDark ? "text-amber-400" : "text-amber-600"
        )} />
        <AlertDescription className={cn(
          "text-xs font-medium",
          isDark ? "text-blue-100/80" : "text-amber-800"
        )}>
          Digest authentication requires server challenges. The first request might fail; the second one uses the challenge.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="username" className={cn(
            "text-sm font-semibold mb-1.5 block",
            isDark ? "text-blue-200" : "text-neutral-700"
          )}>
            Username
          </Label>
          <Input
            id="username"
            name="username"
            value={config.username}
            onChange={handleInputChange}
            placeholder="Enter username"
            className={cn(
              "nodrag w-full rounded-lg focus:outline-none h-10 px-3 text-sm shadow-sm",
              isDark 
                ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400" 
                : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
            )}
          />
        </div>
        
        <div>
          <Label htmlFor="password" className={cn(
            "text-sm font-semibold mb-1.5 block",
            isDark ? "text-blue-200" : "text-neutral-700"
          )}>
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={config.password}
            onChange={handleInputChange}
            placeholder="Enter password"
            className={cn(
              "nodrag w-full rounded-lg focus:outline-none h-10 px-3 text-sm shadow-sm",
              isDark 
                ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400" 
                : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
            )}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <Label 
          htmlFor="authType" 
          className={cn(
            "text-sm font-medium mb-1.5 block",
            isDark ? "text-blue-200" : "text-neutral-700"
          )}
        >
          Authentication Type
        </Label>
        <Select 
          value={localConfig.type} 
          onValueChange={handleAuthTypeChange}
        >
          <SelectTrigger 
            id="authType" 
            className={cn(
              "nodrag h-10 focus:outline-none rounded-lg shadow-sm", 
              isDark 
                ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400"
                : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
            )}
          >
            <SelectValue placeholder="Select authentication type" />
          </SelectTrigger>
          <SelectContent 
            className={cn(
              "rounded-lg shadow-md",
              isDark 
                ? "bg-neutral-800 border-2 border-blue-500 text-white" 
                : "bg-white border-2 border-neutral-800 text-neutral-800"
            )}
          >
            <SelectItem 
              value="none" 
              className={cn(
                "cursor-pointer rounded",
                isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
              )}
            >
              No Auth
            </SelectItem>
            <SelectItem 
              value="basic" 
              className={cn(
                "cursor-pointer rounded",
                isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
              )}
            >
              Basic Auth
            </SelectItem>
            <SelectItem 
              value="bearer" 
              className={cn(
                "cursor-pointer rounded",
                isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
              )}
            >
              Bearer Token
            </SelectItem>
            <SelectItem 
              value="apiKey" 
              className={cn(
                "cursor-pointer rounded",
                isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
              )}
            >
              API Key
            </SelectItem>
            <SelectItem 
              value="oauth2" 
              className={cn(
                "cursor-pointer rounded",
                isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
              )}
            >
              OAuth 2.0
            </SelectItem>
            <SelectItem 
              value="digest" 
              className={cn(
                "cursor-pointer rounded",
                isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
              )}
            >
              Digest Auth
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className={cn(
        "space-y-4 p-4 rounded-lg shadow-sm border-2",
        isDark 
          ? "bg-neutral-800 border-blue-500" 
          : "bg-white border-neutral-800"
      )}>
        {renderAuthForm()}
      </div>
    </div>
  );
} 