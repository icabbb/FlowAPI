'use client';
import { useMemo, useCallback, useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { Button } from "@/components/ui/button";
import {
  Download,
  CheckCircle2,
  Copy,
  Search,
  Info,
  Filter,
  Expand,
  Minimize2,
  AlertCircle,
  X,
} from 'lucide-react';
import { JSONPath } from 'jsonpath-plus';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { NodeResult } from '@/contracts/types';

type JsonViewType = 'pretty' | 'raw' | 'preview';
interface JsonNodeData { label?: string; jsonData?: any; width?: number; [key: string]: any; }

const formatJson = (data: any): string => {
  if (data === undefined || data === null) return '';
  try { return JSON.stringify(data, null, 2); }
  catch (e) { return String(data); }
};
const getDataSize = (data: any): string => {
  if (data === undefined || data === null) return '0 B';
  try {
    const jsonString = JSON.stringify(data);
    const bytes = new TextEncoder().encode(jsonString).length;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } catch (e) { return 'unknown size'; }
};
const getHeaderValue = (headers: Record<string, string> | undefined, headerName: string): string | undefined => {
  if (!headers) return undefined;
  const lowerCaseHeader = headerName.toLowerCase();
  const foundKey = Object.keys(headers).find(key => key.toLowerCase() === lowerCaseHeader);
  return foundKey ? headers[foundKey] : undefined;
};

interface JsonNodeSettingsProps {
  node: Node<JsonNodeData>;
  executionResult: NodeResult | undefined;
}

export function JsonNodeSettings({ node, executionResult }: JsonNodeSettingsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [jsonPath, setJsonPath] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [viewType, setViewType] = useState<JsonViewType>('pretty');
  const [jsonPathError, setJsonPathError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const PREVIEW_LINES = 15;

  const nodeData = useMemo(() => ({
    label: 'JSON Output',
    jsonData: undefined,
    width: 300,
    ...node.data,
  }), [node.data]);

  const jsonData = useMemo(() => (
    executionResult?.status === 'success'
      ? executionResult.data
      : nodeData.jsonData
  ), [executionResult, nodeData.jsonData]);

  const contentType = useMemo(() => {
    const headers = executionResult?.headers ?? undefined;
    return getHeaderValue(headers, 'content-type') || 'application/json';
  }, [executionResult?.headers]);

  useEffect(() => {
    if (contentType.includes('html')) setViewType('preview');
    else if (contentType.includes('json')) setViewType('pretty');
    else setViewType('raw');
  }, [contentType]);

  const jsonDataString = useMemo(() => formatJson(jsonData), [jsonData]);
  const rawDataString = useMemo(() => (
    jsonData === undefined || jsonData === null
      ? ''
      : typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData)
  ), [jsonData]);

  const hasData = rawDataString.length > 0;
  const dataSize = useMemo(() => getDataSize(jsonData), [jsonData]);
  const defaultFilename = useMemo(() => {
    let extension = 'txt';
    if (contentType.includes('json')) extension = 'json';
    else if (contentType.includes('html')) extension = 'html';
    else if (contentType.includes('xml')) extension = 'xml';
    return `${nodeData.label?.replace(/\s+/g, '_').toLowerCase() || 'output'}.${extension}`;
  }, [nodeData.label, contentType]);

  // Filtering
  const filteredJsonString = useMemo(() => {
    setJsonPathError(null);
    if (!jsonPath || !jsonData || !contentType.includes('json')) return jsonDataString;
    try {
      const result = JSONPath({ path: jsonPath, json: jsonData });
      if (result.length === 0) {
        setJsonPathError('Path returned no results.');
        return '[]';
      }
      if (result.length === 1 && typeof result[0] !== 'object') return formatJson(result[0]);
      return formatJson(result.length === 1 ? result[0] : result);
    } catch (e: any) {
      setJsonPathError(e.message || 'Invalid JSON path syntax.');
      return `Error: Invalid JSONPath expression`;
    }
  }, [jsonPath, jsonData, jsonDataString, contentType]);

  // Search highlight
  const displayedContent = useMemo(() => {
    const contentToSearch = viewType === 'pretty' ? filteredJsonString : rawDataString;
    setJsonPathError(null);
    if (!searchTerm) return contentToSearch;
    if (viewType === 'preview') return contentToSearch;
    try {
      const highlightClass = isDark
        ? "bg-yellow-700/50 text-yellow-200 rounded px-0.5"
        : "bg-yellow-200/80 text-yellow-900 rounded px-0.5";
      const parts = contentToSearch.split(new RegExp(`(${searchTerm})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === searchTerm.toLowerCase()
          ? `<span class="${highlightClass}">${part}</span>`
          : part
      ).join('');
    } catch (e) {
      return contentToSearch;
    }
  }, [filteredJsonString, rawDataString, searchTerm, viewType, isDark]);

  // Download
  const handleDataDownload = useCallback(() => {
    if (!hasData) return;
    const blob = new Blob([rawDataString], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [rawDataString, defaultFilename, hasData, contentType]);

  // Copy
  const handleCopy = useCallback(() => {
    let contentToCopy = '';
    switch(viewType) {
      case 'pretty': contentToCopy = filteredJsonString; break;
      case 'raw':
      case 'preview':
        contentToCopy = rawDataString;
        break;
    }
    if (!contentToCopy) return;
    navigator.clipboard.writeText(contentToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [filteredJsonString, rawDataString, viewType, isCopied]);

  // UI Handlers
  const handleJsonPathChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setJsonPath(e.target.value), []);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value), []);
  const handleClearFilters = useCallback(() => { setJsonPath(''); setSearchTerm(''); }, []);
  const handleExpandToggle = useCallback(() => setIsExpanded(v => !v), []);

  // Cartoon (gris en light, azul en dark)
  const cartoonBg = isDark
    ? "bg-[#151e2d] border-blue-500/90"
    : "bg-blue-50 border-neutral-300";
  const cartoonCard = isDark
    ? "bg-[#192844] border-blue-400/80"
    : "bg-white border-neutral-300";
  const cartoonShadow = isDark
    ? "shadow-[0_8px_30px_4px_rgba(8,45,126,0.3)]"
    : "shadow-[0_8px_24px_2px_rgba(0,0,0,0.08)]";

  // Preview lines (fade)
  const previewLines = useMemo(() => {
    const lines = displayedContent.split('\n');
    if (lines.length <= PREVIEW_LINES) return displayedContent;
    return lines.slice(0, PREVIEW_LINES).join('\n');
  }, [displayedContent]);

  return (
    <div className={cn("flex flex-col h-full w-full font-sans", isExpanded && "fixed z-50 top-0 left-0 w-full h-full bg-neutral-900/90 p-8")} style={isExpanded ? { maxWidth: "100vw", maxHeight: "100vh" } : {}}>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <span className={cn(
          "inline-flex items-center gap-2 px-2 py-1 rounded-xl text-xs font-bold border-2",
          cartoonBg
        )}>
          Response Output
        </span>
        <span className={cn(
          "inline-flex items-center gap-2 px-2 py-1 rounded-xl text-xs font-mono border-2",
          isDark
            ? "bg-[#23315d] border-blue-500 text-blue-100"
            : "bg-blue-100 border-neutral-300 text-blue-800"
        )}>
          {contentType}
        </span>
        <span className={cn("text-xs px-2 py-1 rounded-lg font-mono", isDark ? "text-blue-100/80" : "text-blue-800/80")}>
          Size: {dataSize}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleExpandToggle}
          className={cn("h-8 w-8 border-2 ml-auto rounded-xl", cartoonBg)}
          title={isExpanded ? "Minimize" : "Expand"}
        >
          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDataDownload}
          disabled={!hasData}
          className={cn("h-8 w-8 border-2 rounded-xl", cartoonBg, "ml-1")}
          title={`Download ${defaultFilename}`}
        >
          <Download className="h-4.5 w-4.5" />
        </Button>
      </div>

      {/* Filters */}
      {(viewType === 'pretty' || viewType === 'raw') && (
        <div className="flex flex-wrap gap-2 w-full mb-2">
          <div className="relative flex-grow min-w-[120px]">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none", isDark ? "text-blue-300/50" : "text-blue-600/70")} />
            <input
              type="text"
              placeholder="Search content…"
              value={searchTerm}
              onChange={handleSearchChange}
              onMouseDown={e => e.stopPropagation()}
              className={cn(
                "w-full rounded-xl h-9 pl-10 pr-2 text-sm shadow border-2",
                isDark
                  ? "bg-[#192844] border-blue-500 text-blue-100 placeholder:text-blue-200/60"
                  : "bg-white border-neutral-300 text-blue-900 placeholder:text-blue-400"
              )}
            />
          </div>
          {viewType === 'pretty' && contentType.includes('json') && (
            <div className="relative flex-grow min-w-[140px]">
              <Filter className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none", isDark ? "text-blue-300/50" : "text-blue-600/70")} />
              <input
                type="text"
                placeholder="Filter with JSONPath (e.g., $.data)"
                value={jsonPath}
                onChange={handleJsonPathChange}
                onMouseDown={e => e.stopPropagation()}
                className={cn(
                  "w-full rounded-xl h-9 pl-10 pr-2 text-sm font-mono shadow border-2",
                  isDark
                    ? "bg-[#192844] border-blue-500 text-blue-100 placeholder:text-blue-200/60"
                    : "bg-white border-neutral-300 text-blue-900 placeholder:text-blue-400",
                  jsonPathError ? (isDark ? "border-red-500" : "border-red-500") : ""
                )}
              />
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {jsonPathError && (
        <div className="mt-1">
          <div className={cn(
            "p-2 text-xs rounded-xl flex items-center gap-2 shadow border-2",
            isDark ? "bg-red-900/30 border-red-700 text-red-300" : "bg-red-100 border-red-700 text-red-800"
          )}>
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{jsonPathError}</span>
          </div>
        </div>
      )}

      {/* --- JSON Card --- */}
      <div className="flex-1 flex flex-col mt-2 min-h-[200px] relative">
        {!hasData ? (
          <div className={cn(
            "flex-1 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-2xl p-6 min-h-[200px]",
            isDark ? "border-blue-500/40 bg-neutral-800/30 text-blue-100/70" : "border-blue-500/60 bg-blue-50/60 text-blue-600"
          )}>
            <Info className={cn("h-7 w-7 mb-2", isDark ? "text-blue-300/50" : "text-blue-500")} />
            <p className="text-sm font-medium">No data available yet!</p>
            <p className="text-xs">Run the flow or connect an input.</p>
          </div>
        ) : viewType === 'preview' ? (
          <iframe
            srcDoc={rawDataString}
            title="HTML Preview"
            sandbox="allow-scripts allow-same-origin"
            className={cn(
              "w-full min-h-[300px] border-2 rounded-2xl shadow-lg flex-1",
              cartoonCard, cartoonShadow
            )}
            style={{ minHeight: "300px", height: "100%" }}
          />
        ) : (
          <div className={cn("relative w-full flex-1 mt-1")}>
            {/* Copy button inside JSON card (absolute) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              disabled={!hasData}
              title={isCopied ? "Copied!" : "Copy content"}
              className={cn(
                "absolute top-2 right-2 z-10 border-2 rounded-xl bg-opacity-90",
                cartoonBg
              )}
            >
              {isCopied ? <CheckCircle2 className="h-5 w-5 text-lime-400" /> : <Copy className="h-5 w-5" />}
            </Button>
            <div
              className={cn(
                "relative border-2 rounded-2xl shadow-lg",
                cartoonCard, cartoonShadow
              )}
              style={{
                minHeight: 160,
                maxHeight: isExpanded ? 640 : 260,
                overflow: "hidden",
                paddingBottom: isExpanded ? 0 : undefined
              }}
            >
              <pre
                className={cn(
                  "text-xs font-mono p-4 whitespace-pre-wrap break-all allow-text-selection cartoon-scroll",
                  isDark ? "text-blue-100" : "text-blue-800"
                )}
                style={
                  isExpanded
                    ? { maxHeight: 620, minHeight: 160, overflowY: "auto", borderRadius: "18px" }
                    : { maxHeight: 220, minHeight: 100, overflow: "hidden", borderRadius: "18px" }
                }
              >
                <code
                  dangerouslySetInnerHTML={{
                    __html: isExpanded ? displayedContent : previewLines
                  }}
                ></code>
              </pre>
              {!isExpanded && displayedContent.split('\n').length > PREVIEW_LINES && (
                <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
                  style={{
                    background: isDark
                      ? "linear-gradient(180deg, rgba(25,40,68,0.3) 10%, #192844 90%)"
                      : "linear-gradient(180deg, rgba(255,255,255,0.1) 10%, #fff 95%)"
                  }}
                />
              )}
              {!isExpanded && displayedContent.split('\n').length > PREVIEW_LINES && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExpandToggle}
                  className={cn(
                    "absolute bottom-3 right-3 z-20 rounded-lg border-2 font-semibold px-3 py-1",
                    cartoonBg
                  )}
                >Ver completo <Expand className="h-4 w-4 ml-1" /></Button>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Limpiar filtros btn */}
      {(jsonPath || searchTerm) && (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClearFilters}
        className={cn(
          "flex gap-1 items-center h-9 px-3 rounded-xl font-semibold border-2 ml-auto",
          isDark
            ? "border-blue-500 bg-[#1a2440] hover:bg-blue-800/40 text-blue-100"
            : "border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
        )}
        title="Clear Filters"
      >
        <X className="h-4 w-4" />
        Clear Filters
      </Button>
    )}
    </div>
  );
}
