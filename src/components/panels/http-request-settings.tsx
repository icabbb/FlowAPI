'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KeyValueEditor, type KeyValueEntry } from '@/components/shared/key-value-editor';
import { useFlowStore } from '@/store/index';
import { Braces, Lock, Settings2, User, Layers, FileText, Code, ListChecks } from 'lucide-react';
import { AuthSettings, type AuthConfig } from '@/components/shared/auth-settings';
import { useTheme } from 'next-themes';
import { cn } from "@/lib/utils";

// ---- Body types, default node data ----
type BodyType = 'none' | 'json' | 'text';
interface HttpRequestNodeData {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  label: string;
  queryParams?: KeyValueEntry[];
  headers?: KeyValueEntry[];
  bodyType: BodyType;
  body?: string;
  auth?: AuthConfig;
  preRequestScript?: string;
  testScript?: string;
  [key: string]: any;
}
const defaultHttpRequestData: HttpRequestNodeData = {
  method: 'GET',
  url: '',
  label: 'HTTP Request',
  queryParams: [],
  headers: [],
  bodyType: 'none',
  body: '',
  auth: { type: 'none' },
  preRequestScript: '',
  testScript: '',
};
const ensureUrlHasProtocol = (url: string): string => {
  if (!url) return url;
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) return `https://${url}`;
  return url;
};
const TABS = [
  { key: 'params', name: 'Params', icon: <Settings2 className="h-4 w-4" /> },
  { key: 'auth', name: 'Auth', icon: <User className="h-4 w-4" /> },
  { key: 'headers', name: 'Headers', icon: <Layers className="h-4 w-4" /> },
  { key: 'body', name: 'Body', icon: <FileText className="h-4 w-4" /> },
  { key: 'preRequest', name: 'Pre-request', icon: <Code className="h-4 w-4" /> },
  { key: 'tests', name: 'Tests', icon: <ListChecks className="h-4 w-4" /> },
];

// ---- Main settings panel ----
interface HttpRequestSettingsProps {
  node: Node<HttpRequestNodeData>;
}
export function HttpRequestSettings({ node }: HttpRequestSettingsProps) {
  const { updateNodeData } = useFlowStore();
  const nodeId = node.id;
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const data = useMemo(() => ({
    ...defaultHttpRequestData,
    ...node.data
  }), [node.data]);

  // --- State
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

  // --- Sync with node data
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

  // --- Handlers
  const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'url' && value !== data.url) {
      const updatedUrl = ensureUrlHasProtocol(value);
      updateNodeData(nodeId, { url: updatedUrl });
      setUrl(updatedUrl);
    } else if (name === 'label' && value !== data.label) {
      updateNodeData(nodeId, { label: value });
    }
  };
  const handleMethodChange = useCallback((value: string) => {
    setMethod(value as HttpRequestNodeData['method']);
    updateNodeData(nodeId, { method: value });
  }, [nodeId, updateNodeData]);
  const handleBodyTypeChange = useCallback((value: string) => {
    setBodyType(value as BodyType);
    updateNodeData(nodeId, { bodyType: value as BodyType });
  }, [nodeId, updateNodeData]);
  const handleBodyBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    const { value } = event.target;
    if (value !== data.body) {
      setBody(value);
      updateNodeData(nodeId, { body: value });
    }
  };
  const handleQueryParamsChange = useCallback((params: KeyValueEntry[]) => {
    setQueryParams(params);
    updateNodeData(nodeId, { queryParams: params });
  }, [nodeId, updateNodeData]);
  const handleHeadersChange = useCallback((newHeaders: KeyValueEntry[]) => {
    setHeaders(newHeaders);
    updateNodeData(nodeId, { headers: newHeaders });
  }, [nodeId, updateNodeData]);
  const handleAuthChange = useCallback((newAuthConfig: AuthConfig) => {
    setAuth(newAuthConfig);
    updateNodeData(nodeId, { auth: newAuthConfig });
  }, [nodeId, updateNodeData]);
  const handlePreRequestScriptBlur = useCallback((event: React.FocusEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    if (value !== data.preRequestScript) {
      setPreRequestScript(value);
      updateNodeData(nodeId, { preRequestScript: value });
    }
  }, [nodeId, data.preRequestScript, updateNodeData]);
  const handleTestScriptBlur = useCallback((event: React.FocusEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    if (value !== data.testScript) {
      setTestScript(value);
      updateNodeData(nodeId, { testScript: value });
    }
  }, [nodeId, data.testScript, updateNodeData]);

  // ---- UI Colors & Styles ----
  const sectionTitle = isDark ? "text-blue-100 drop-shadow" : "text-neutral-900";
  const cartoonTab = cn(
    "flex flex-col items-center gap-1 px-2 py-2 rounded-xl shadow-md border-2 font-bold text-xs transition-all",
    "hover:-translate-y-1 hover:shadow-xl hover:scale-[1.05] duration-200 cursor-pointer",
    "select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
  );
  const cartoonActive = isDark
    ? "bg-blue-700 border-blue-400 text-white shadow-blue-400/30 z-10"
    : "bg-blue-200 border-neutral-300 text-blue-900 shadow-blue-300/20 z-10";
  const cartoonInactive = isDark
    ? "bg-[#151a22] border-neutral-700 text-blue-200/80"
    : "bg-white border-neutral-300 text-neutral-700";

  return (
    <div className="w-full h-full flex flex-col">
      {/* --- Tabs: 2 filas de 3 columnas, cartoon style --- */}
      <div
        className={cn(
          "grid grid-cols-3 grid-rows-2 gap-2 mb-4 px-2 pt-2",
          "bg-transparent"
        )}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            data-active={activeTab === tab.key}
            className={cn(
              cartoonTab,
              activeTab === tab.key ? cartoonActive : cartoonInactive
            )}
            tabIndex={0}
            style={{
              minWidth: 0,
              minHeight: "52px",
              boxShadow: activeTab === tab.key ? "0 4px 18px 0 rgba(0,0,0,0.10)" : undefined,
            }}
          >
            <span>{tab.icon}</span>
            <span className="truncate leading-4">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* --- Main editable area --- */}
      <div className="flex-1 min-h-0 overflow-y-auto px-1 sm:px-2">
        {/* Header Inputs */}
        <div className="mb-6 flex flex-wrap gap-2 items-center justify-between">
          <Input
            id="label"
            name="label"
            value={label}
            onChange={e => setLabel(e.target.value)}
            onBlur={handleInputBlur}
            placeholder="Node Label"
            className={cn(
              "h-9 w-[120px] rounded-xl border-2 shadow-cartoon text-xs px-3",
              isDark ? "bg-neutral-800 border-blue-400 text-white" : "bg-white border-neutral-300 text-blue-900"
            )}
          />
          <Select value={method} onValueChange={handleMethodChange}>
            <SelectTrigger id="method" className={cn(
              "h-9 w-20 rounded-xl border-2 shadow-cartoon text-xs font-bold uppercase",
              isDark ? "bg-neutral-800 border-blue-400 text-white" : "bg-white border-neutral-300 text-blue-900"
            )}>
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-neutral-900 border-blue-400" : "bg-white border-neutral-300"}>
              {["GET", "POST", "PUT", "DELETE", "PATCH"].map(val => (
                <SelectItem key={val} value={val}>{val}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1 min-w-[100px] relative">
            <Input
              id="url"
              name="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onBlur={handleInputBlur}
              placeholder="https://api.example.com"
              className={cn(
                "h-9 rounded-xl border-2 shadow-cartoon text-xs pr-9",
                isDark ? "bg-neutral-800 border-blue-400 text-white" : "bg-white border-neutral-300 text-blue-900"
              )}
            />
            {auth.type !== 'none' && (
              <Lock className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
            )}
          </div>
        </div>
        {/* Content by tab */}
        {activeTab === "params" && (
          <section className="mb-8">
            <div className={cn("font-bold mb-2 flex items-center gap-2 text-sm", sectionTitle)}>
              <Settings2 className="h-4 w-4" /> Query Parameters
            </div>
            <KeyValueEditor
              entries={queryParams}
              onChange={handleQueryParamsChange}
              keyPlaceholder="param"
              valuePlaceholder="value"
            />
          </section>
        )}
        {activeTab === "headers" && (
          <section className="mb-8">
            <div className={cn("font-bold mb-2 flex items-center gap-2 text-sm", sectionTitle)}>
              <Layers className="h-4 w-4" /> Headers
            </div>
            <KeyValueEditor
              entries={headers}
              onChange={handleHeadersChange}
              keyPlaceholder="Content-Type"
              valuePlaceholder="application/json"
            />
          </section>
        )}
        {activeTab === "body" && (
          <section className="mb-8">
            <div className={cn("font-bold mb-2 flex items-center gap-2 text-sm", sectionTitle)}>
              <FileText className="h-4 w-4" /> Body
            </div>
            <div className="flex gap-2 mb-3">
              <Label className="flex items-center gap-2 text-xs">
                Type
                <Select value={bodyType} onValueChange={handleBodyTypeChange}>
                  <SelectTrigger className={cn(
                    "h-8 w-20 rounded-xl border-2 shadow-cartoon text-xs",
                    isDark ? "bg-neutral-800 border-blue-400 text-white" : "bg-white border-neutral-300 text-blue-900"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={isDark ? "bg-neutral-900 border-blue-400" : "bg-white border-neutral-300"}>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </Label>
            </div>
            {bodyType !== "none" && (
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                onBlur={handleBodyBlur}
                placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Enter text here...'}
                className={cn(
                  "rounded-xl text-xs font-mono shadow-cartoon border-2 min-h-24 px-3 py-2",
                  isDark ? "bg-neutral-800 border-blue-400 text-white" : "bg-white border-neutral-300 text-blue-900"
                )}
              />
            )}
            {bodyType === 'json' && (
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const formatted = JSON.stringify(JSON.parse(body || "{}"), null, 2);
                      setBody(formatted);
                      updateNodeData(nodeId, { body: formatted });
                    } catch {}
                  }}
                  className={cn(
                    "border-2 font-bold px-3 py-1 rounded-xl text-xs shadow-cartoon transition-all hover:scale-105 active:scale-95",
                    isDark ? "border-blue-400 text-blue-200 bg-blue-700/10" : "border-blue-500 text-blue-700 bg-blue-200/40"
                  )}
                >
                  <Braces className="h-3 w-3 mr-1" />
                  Format JSON
                </button>
              </div>
            )}
          </section>
        )}
        {activeTab === "auth" && (
          <section className="mb-8">
            <div className={cn("font-bold mb-2 flex items-center gap-2 text-sm", sectionTitle)}>
              <User className="h-4 w-4" /> Authorization
            </div>
            <AuthSettings authConfig={auth} onChange={handleAuthChange} />
          </section>
        )}
        {activeTab === "preRequest" && (
          <section className="mb-8">
            <div className={cn("font-bold mb-2 flex items-center gap-2 text-sm", sectionTitle)}>
              <Code className="h-4 w-4" /> Pre-request Script
            </div>
            <Textarea
              value={preRequestScript}
              onChange={e => setPreRequestScript(e.target.value)}
              onBlur={handlePreRequestScriptBlur}
              placeholder="// e.g. pm.request.headers.add(...)"
              className={cn(
                "rounded-xl text-xs font-mono shadow-cartoon border-2 min-h-20 px-3 py-2",
                isDark ? "bg-neutral-800 border-blue-400 text-white" : "bg-white border-neutral-300 text-blue-900"
              )}
            />
          </section>
        )}
        {activeTab === "tests" && (
          <section className="mb-8">
            <div className={cn("font-bold mb-2 flex items-center gap-2 text-sm", sectionTitle)}>
              <ListChecks className="h-4 w-4" /> Tests
            </div>
            <Textarea
              value={testScript}
              onChange={e => setTestScript(e.target.value)}
              onBlur={handleTestScriptBlur}
              placeholder="// e.g. pm.test('Status is 200', ...)"
              className={cn(
                "rounded-xl text-xs font-mono shadow-cartoon border-2 min-h-20 px-3 py-2",
                isDark ? "bg-neutral-800 border-blue-400 text-white" : "bg-white border-neutral-300 text-blue-900"
              )}
            />
          </section>
        )}
      </div>
    </div>
  );
}
