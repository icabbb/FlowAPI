'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Node } from '@xyflow/react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { KeyValueEditor, type KeyValueEntry } from '@/components/shared/key-value-editor';
import { useFlowStore } from '@/store/flow-store';
import { Braces, Lock, FileCode } from 'lucide-react';
import { AuthSettings, type AuthConfig } from '@/components/shared/auth-settings';
import { useTheme } from 'next-themes';
import { cn } from "@/lib/utils";

// Define body type
type BodyType = 'none' | 'json' | 'text';

// Update the data interface to include auth and scripts
interface HttpRequestNodeData {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  label: string;
  queryParams?: KeyValueEntry[];
  headers?: KeyValueEntry[];
  bodyType: BodyType;
  body?: string;
  auth?: AuthConfig;
  preRequestScript?: string; // Add pre-request script field
  testScript?: string; // Add test script field
  [key: string]: any; // Add index signature
}

// Default data for a new HTTP request node
const defaultHttpRequestData: HttpRequestNodeData = {
  method: 'GET',
  url: '',
  label: 'HTTP Request',
  queryParams: [],
  headers: [],
  bodyType: 'none',
  body: '',
  auth: { type: 'none' },
  preRequestScript: '', // Initialize script fields
  testScript: '', // Initialize script fields
};

// Validate and append protocol to URL if missing
const ensureUrlHasProtocol = (url: string): string => {
  if (!url) return url;
  
  // Only modify if the URL doesn't already have a protocol
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
    return `https://${url}`;
  }
  return url;
};

interface HttpRequestSettingsProps {
  node: Node<HttpRequestNodeData>; // Ensure node data type is specific if possible
}

export function HttpRequestSettings({ node }: HttpRequestSettingsProps) {
  const { updateNodeData } = useFlowStore();
  const nodeId = node.id;
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Parse node data with defaults
  const data = useMemo(() => ({
    ...defaultHttpRequestData,
    ...node.data
  }), [node.data]);

  // State for form values
  const [url, setUrl] = useState(data.url || '');
  const [label, setLabel] = useState(data.label || defaultHttpRequestData.label);
  const [method, setMethod] = useState(data.method || defaultHttpRequestData.method);
  const [bodyType, setBodyType] = useState(data.bodyType || defaultHttpRequestData.bodyType);
  const [body, setBody] = useState(data.body || '');
  const [queryParams, setQueryParams] = useState<KeyValueEntry[]>(data.queryParams || []);
  const [headers, setHeaders] = useState<KeyValueEntry[]>(data.headers || []);
  const [auth, setAuth] = useState<AuthConfig>(data.auth || { type: 'none' });
  const [preRequestScript, setPreRequestScript] = useState(data.preRequestScript || '');
  const [testScript, setTestScript] = useState(data.testScript || '');

  const [activeTab, setActiveTab] = useState('params');

  // Update component state when node data changes
  useEffect(() => {
    setUrl(data.url || '');
    setLabel(data.label || defaultHttpRequestData.label);
    setMethod(data.method || defaultHttpRequestData.method);
    setBodyType(data.bodyType || defaultHttpRequestData.bodyType);
    setBody(data.body || '');
    setQueryParams(data.queryParams || []);
    setHeaders(data.headers || []);
    setAuth(data.auth || { type: 'none' });
    setPreRequestScript(data.preRequestScript || '');
    setTestScript(data.testScript || '');
  }, [data]);

  // Handlers for input changes
  const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    // Only update if value has changed
    if (name === 'url' && value !== data.url) {
      const updatedUrl = ensureUrlHasProtocol(value);
      updateNodeData(nodeId, { url: updatedUrl });
      setUrl(updatedUrl);
    } else if (name === 'label' && value !== data.label) {
      updateNodeData(nodeId, { label: value });
    }
  };

  // Handler for method changes
  const handleMethodChange = useCallback((value: string) => {
    setMethod(value as HttpRequestNodeData['method']);
    updateNodeData(nodeId, { method: value });
  }, [nodeId, updateNodeData]);

  // Handler for body type changes
  const handleBodyTypeChange = useCallback((value: string) => {
    setBodyType(value as BodyType);
    updateNodeData(nodeId, { bodyType: value as BodyType });
  }, [nodeId, updateNodeData]);

  // Handler for body content changes
  const handleBodyBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    const { value } = event.target;
    
    // Only update if value has changed
    if (value !== data.body) {
      setBody(value);
      updateNodeData(nodeId, { body: value });
    }
  };

  // Handler for query params changes
  const handleQueryParamsChange = useCallback((params: KeyValueEntry[]) => {
    setQueryParams(params);
    updateNodeData(nodeId, { queryParams: params });
  }, [nodeId, updateNodeData]);

  // Handler for headers changes
  const handleHeadersChange = useCallback((newHeaders: KeyValueEntry[]) => {
    setHeaders(newHeaders);
    updateNodeData(nodeId, { headers: newHeaders });
  }, [nodeId, updateNodeData]);

  // Handler for auth changes
  const handleAuthChange = useCallback((newAuthConfig: AuthConfig) => {
    setAuth(newAuthConfig);
    updateNodeData(nodeId, { auth: newAuthConfig });
  }, [nodeId, updateNodeData]);

  // Handler for Pre-request Script changes
  const handlePreRequestScriptBlur = useCallback((event: React.FocusEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    if (value !== data.preRequestScript) {
      setPreRequestScript(value);
      updateNodeData(nodeId, { preRequestScript: value });
    }
  }, [nodeId, data.preRequestScript, updateNodeData]);

  // Handler for Test Script changes
  const handleTestScriptBlur = useCallback((event: React.FocusEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
     if (value !== data.testScript) {
      setTestScript(value);
      updateNodeData(nodeId, { testScript: value });
    }
  }, [nodeId, data.testScript, updateNodeData]);

  // Determine if auth is active (not "none")
  const hasActiveAuth = useMemo(() => auth.type !== 'none', [auth.type]);
  // Determine if scripts are active
  const hasPreRequestScript = useMemo(() => preRequestScript.trim().length > 0, [preRequestScript]);
  const hasTestScript = useMemo(() => testScript.trim().length > 0, [testScript]);

  return (
    <div className="space-y-5 font-sans"> 
      {/* URL and Method Section */}
      <div className="space-y-4">
        <div>
          {/* Label: Cartoon Style with dark mode */}
          <Label htmlFor="label" className={cn(
            "text-sm font-semibold mb-1.5 block",
            isDark ? "text-blue-200" : "text-neutral-700"
          )}>
            Label
          </Label>
          {/* Input: Cartoon Style with dark mode */}
          <Input
            id="label"
            name="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleInputBlur}
            placeholder="HTTP Request Node Label"
            className={cn(
              "nodrag w-full rounded-lg focus:outline-none h-10 px-3 text-sm shadow-sm",
              isDark 
                ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400" 
                : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
            )}
          />
        </div>
        
        <div className="flex space-x-3">
          <div className="w-1/3">
            {/* Label: Cartoon Style with dark mode */}
            <Label htmlFor="method" className={cn(
              "text-sm font-semibold mb-1.5 block",
              isDark ? "text-blue-200" : "text-neutral-700"
            )}>
              Method
            </Label>
            {/* Select: Cartoon Style with dark mode */}
            <Select value={method} onValueChange={handleMethodChange}>
              <SelectTrigger id="method" className={cn(
                "nodrag h-10 focus:outline-none rounded-lg shadow-sm", 
                isDark 
                  ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400"
                  : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
              )}>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              {/* Select Content: Cartoon Style with dark mode */}
              <SelectContent className={cn(
                "rounded-lg shadow-md",
                isDark 
                  ? "bg-neutral-800 border-2 border-blue-500 text-white" 
                  : "bg-white border-2 border-neutral-800 text-neutral-800"
              )}>
                <SelectItem value="GET" className={cn(
                  "cursor-pointer rounded",
                  isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
                )}>GET</SelectItem>
                <SelectItem value="POST" className={cn(
                  "cursor-pointer rounded",
                  isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
                )}>POST</SelectItem>
                <SelectItem value="PUT" className={cn(
                  "cursor-pointer rounded",
                  isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
                )}>PUT</SelectItem>
                <SelectItem value="DELETE" className={cn(
                  "cursor-pointer rounded",
                  isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
                )}>DELETE</SelectItem>
                <SelectItem value="PATCH" className={cn(
                  "cursor-pointer rounded",
                  isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
                )}>PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            {/* Label: Cartoon Style with dark mode */}
            <Label htmlFor="url" className={cn(
              "text-sm font-semibold mb-1.5 block",
              isDark ? "text-blue-200" : "text-neutral-700"
            )}>
              URL
            </Label>
            <div className="relative">
              {/* Input: Cartoon Style with dark mode */}
              <Input
                id="url"
                name="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleInputBlur}
                placeholder="https://api.example.com"
                className={cn(
                  "nodrag w-full rounded-lg focus:outline-none h-10 px-3 text-sm shadow-sm pr-8",
                  isDark 
                    ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400" 
                    : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
                )}
              />
              {hasActiveAuth && (
                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                  <Lock className={cn(
                    "h-4 w-4", 
                    isDark ? "text-blue-300" : "text-blue-500"
                  )} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Cartoon Style with dark mode */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* TabsList: Cartoon Style with dark mode */}
        <TabsList className={cn(
          "w-full grid grid-cols-6 rounded-xl shadow-inner mb-3 border-2",
          isDark 
            ? "bg-neutral-800 border-blue-500" 
            : "bg-neutral-100 border-neutral-800"
        )}>
          {/* TabsTrigger: Cartoon Style with dark mode */}
          <TabsTrigger
            value="params"
            className={cn(
              "w-full text-center text-xs rounded-lg font-semibold transition-colors duration-200",
              isDark 
                ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-blue-200" 
                : "data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-neutral-600"
            )}
          >
            Params
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className={cn(
              "w-full text-center text-xs px-2 py-1.5 rounded-lg font-semibold transition-colors duration-200 relative",
              isDark 
                ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-blue-200" 
                : "data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-neutral-600"
            )}
          >
            Auth
            {hasActiveAuth && (
              <span className={cn(
                "absolute top-1 right-1 h-2 w-2 rounded-full border",
                isDark ? "bg-yellow-300 border-blue-400" : "bg-yellow-400 border-neutral-800"  
              )}></span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="headers"
            className={cn(
              "w-full text-center text-xs px-2 py-1.5 rounded-lg font-semibold transition-colors duration-200",
              isDark 
                ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-blue-200" 
                : "data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-neutral-600"
            )}
          >
            Headers
          </TabsTrigger>
          <TabsTrigger
            value="body"
            className={cn(
              "w-full text-center text-xs px-2 py-1.5 rounded-lg font-semibold transition-colors duration-200",
              isDark 
                ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-blue-200" 
                : "data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-neutral-600"
            )}
          >
            Body
          </TabsTrigger>
          <TabsTrigger
            value="preRequest"
            className={cn(
              "w-full text-center data-[state=active]:gap-2 text-xs px-2 py-1.5 rounded-lg font-semibold transition-colors duration-200 relative",
              isDark 
                ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-blue-200" 
                : "data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-neutral-600"
            )}
          >
            Pre-req
            {hasPreRequestScript && (
              <span className={cn(
                "absolute top-1 right-1 h-2 w-2 rounded-full border",
                isDark ? "bg-purple-300 border-blue-400" : "bg-purple-400 border-neutral-800"  
              )}></span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="tests"
            className={cn(
              "w-full text-center text-xs px-2 py-1.5 rounded-lg font-semibold transition-colors duration-200 relative",
              isDark 
                ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-blue-200" 
                : "data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-neutral-600"
            )}
          >
            Tests
            {hasTestScript && (
              <span className={cn(
                "absolute top-1 right-1 h-2 w-2 rounded-full border",
                isDark ? "bg-lime-300 border-blue-400" : "bg-lime-400 border-neutral-800"  
              )}></span>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* Query Parameters Tab Content */}
        <TabsContent value="params" className="mt-0 pt-2">
          <div className={cn(
            "space-y-3 p-4 rounded-lg shadow-sm border-2",
            isDark 
              ? "bg-neutral-800 border-blue-500" 
              : "bg-white border-neutral-800"
          )}>
            <Label className={cn(
              "text-sm font-semibold",
              isDark ? "text-blue-200" : "text-neutral-700"
            )}>
              Query Parameters
            </Label>
            {/* KeyValueEditor is already styled internally */}
            <KeyValueEditor
              entries={queryParams}
              onChange={handleQueryParamsChange}
              keyPlaceholder="param"
              valuePlaceholder="value"
            />
          </div>
        </TabsContent>
        
        {/* Headers Tab Content */}
        <TabsContent value="headers" className="mt-0 pt-2">
          <div className={cn(
            "space-y-3 p-4 rounded-lg shadow-sm border-2",
            isDark 
              ? "bg-neutral-800 border-blue-500" 
              : "bg-white border-neutral-800"
          )}>
            <Label className={cn(
              "text-sm font-semibold",
              isDark ? "text-blue-200" : "text-neutral-700"
            )}>
              Headers
            </Label>
            {/* KeyValueEditor is already styled internally */}
            <KeyValueEditor
              entries={headers}
              onChange={handleHeadersChange}
              keyPlaceholder="Content-Type"
              valuePlaceholder="application/json"
            />
          </div>
        </TabsContent>
        
        {/* Body Tab Content */}
        <TabsContent value="body" className="mt-0 pt-2">
          <div className={cn(
            "space-y-4 p-4 rounded-lg shadow-sm border-2",
            isDark 
              ? "bg-neutral-800 border-blue-500" 
              : "bg-white border-neutral-800"
          )}>
            <Label htmlFor="bodyType" className={cn(
              "text-sm font-semibold",
              isDark ? "text-blue-200" : "text-neutral-700"
            )}>
              Body Type
            </Label>
            {/* Select: Cartoon Style with dark mode */}
            <Select value={bodyType} onValueChange={handleBodyTypeChange}>
              <SelectTrigger id="bodyType" className={cn(
                "nodrag h-10 focus:outline-none rounded-lg shadow-sm", 
                isDark 
                  ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400"
                  : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
              )}>
                <SelectValue placeholder="Select body type" />
              </SelectTrigger>
              <SelectContent className={cn(
                "rounded-lg shadow-md",
                isDark 
                  ? "bg-neutral-800 border-2 border-blue-500 text-white" 
                  : "bg-white border-2 border-neutral-800 text-neutral-800"
              )}>
                <SelectItem value="none" className={cn(
                  "cursor-pointer rounded",
                  isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
                )}>None</SelectItem>
                <SelectItem value="json" className={cn(
                  "cursor-pointer rounded",
                  isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
                )}>JSON</SelectItem>
                <SelectItem value="text" className={cn(
                  "cursor-pointer rounded",
                  isDark ? "focus:bg-blue-700" : "focus:bg-blue-100"
                )}>Text</SelectItem>
              </SelectContent>
            </Select>
            
            {bodyType !== 'none' && (
              <div>
                <Label htmlFor="body" className="sr-only">Body Content</Label>
                {/* Textarea: Cartoon Style with dark mode */}
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onBlur={handleBodyBlur}
                  placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Enter text here...'}
                  className={cn(
                    "nodrag min-h-32 rounded-lg focus:outline-none text-sm font-mono shadow-sm p-3",
                    isDark 
                      ? "bg-neutral-900 border-2 border-blue-500 text-white focus:border-blue-400" 
                      : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
                  )}
                />
                {bodyType === 'json' && (
                  <div className="mt-3 flex justify-end">
                    {/* Button: Cartoon Style with dark mode */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        try {
                          const formatted = JSON.stringify(JSON.parse(body || "{}"), null, 2);
                          setBody(formatted);
                          updateNodeData(nodeId, { body: formatted });
                        } catch (e) {
                          console.error("Invalid JSON:", e);
                        }
                      }}
                      className={cn(
                        "h-9 px-3 gap-1 text-xs border-2 rounded-lg font-semibold shadow-sm transition-all duration-200 transform hover:scale-103",
                        isDark 
                          ? "border-blue-500 bg-neutral-800 text-blue-300 hover:bg-neutral-700" 
                          : "border-neutral-800 bg-white text-neutral-800 hover:bg-neutral-100 hover:border-neutral-900"
                      )}
                    >
                      <Braces className="h-3.5 w-3.5" />
                      Format JSON
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Auth Tab Content */}
        <TabsContent value="auth" className="mt-0 pt-2">
          {/* AuthSettings ya está estilizado internamente */}
          <AuthSettings 
            authConfig={auth} 
            onChange={handleAuthChange} 
          />
        </TabsContent>

        {/* Pre-request Script Tab Content */}
        <TabsContent value="preRequest" className="mt-0 pt-2">
          <div className={cn(
            "space-y-3 p-4 rounded-lg shadow-sm border-2",
            isDark 
              ? "bg-neutral-800 border-blue-500" 
              : "bg-white border-neutral-800"
          )}>
            <Label className={cn(
              "text-sm font-semibold flex items-center gap-1",
              isDark ? "text-blue-200" : "text-neutral-700"
            )}>
              <FileCode className={cn(
                "h-4 w-4",
                isDark ? "text-purple-300" : "text-purple-500"
              )}/> Pre-request Script
            </Label>
            <p className={cn(
              "text-xs",
              isDark ? "text-blue-100/70" : "text-neutral-500"
            )}>
              JavaScript code executed before the request is sent.
            </p>
            {/* Textarea: Cartoon Style with dark mode */}
            <Textarea
              value={preRequestScript}
              onChange={(e) => setPreRequestScript(e.target.value)}
              onBlur={handlePreRequestScriptBlur}
              placeholder="// Example: pm.request.headers.add(...)"
              className={cn(
                "nodrag min-h-40 rounded-lg focus:outline-none text-sm font-mono shadow-sm p-3",
                isDark 
                  ? "bg-neutral-900 border-2 border-purple-500/70 text-white focus:border-purple-400" 
                  : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-purple-500"
              )}
            />
          </div>
        </TabsContent>

        {/* Tests Tab Content */}
        <TabsContent value="tests" className="mt-0 pt-2">
           <div className={cn(
            "space-y-3 p-4 rounded-lg shadow-sm border-2",
            isDark 
              ? "bg-neutral-800 border-blue-500" 
              : "bg-white border-neutral-800"
           )}>
            <Label className={cn(
              "text-sm font-semibold flex items-center gap-1",
              isDark ? "text-blue-200" : "text-neutral-700"
            )}>
              <FileCode className={cn(
                "h-4 w-4",
                isDark ? "text-lime-300" : "text-lime-600"
              )}/> Tests
            </Label>
             <p className={cn(
              "text-xs",
              isDark ? "text-blue-100/70" : "text-neutral-500"
            )}>
              JavaScript code executed after the response is received.
            </p>
             {/* Textarea: Cartoon Style with dark mode */}
            <Textarea
              value={testScript}
              onChange={(e) => setTestScript(e.target.value)}
              onBlur={handleTestScriptBlur}
              placeholder="// Example: pm.test('Status is 200', ...)"
              className={cn(
                "nodrag min-h-40 rounded-lg focus:outline-none text-sm font-mono shadow-sm p-3",
                isDark 
                  ? "bg-neutral-900 border-2 border-lime-500/70 text-white focus:border-lime-400" 
                  : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-yellow-500"
              )}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// export default memo(HttpRequestSettings); 