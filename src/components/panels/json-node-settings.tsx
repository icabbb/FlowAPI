'use client';;
import { useMemo, useCallback, useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Download,
  AlertCircle,
  CheckCircle2,
  Copy,
  Search,
  Code,
  FileText,
  MonitorPlay,
  Info,
  Filter,
} from 'lucide-react';
import { useFlowStore } from '@/store/index';
 // Need NodeResult and results
import { JSONPath } from 'jsonpath-plus';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { NodeResult } from '@/contracts/types';

// Define view types
type JsonViewType = 'pretty' | 'raw' | 'preview';

// Define types locally or import
interface JsonNodeData {
  label?: string;
  jsonData?: any;
  width?: number; // Añadir propiedad de ancho
  [key: string]: any; // Add index signature
}

// Helper function (could be shared)
const formatJson = (data: any): string => {
  if (data === undefined || data === null) return '';
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return String(data);
  }
};

// Calculate JSON data size
const getDataSize = (data: any): string => {
  if (data === undefined || data === null) return '0 B';
  
  try {
    const jsonString = JSON.stringify(data);
    const bytes = new TextEncoder().encode(jsonString).length;
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } catch (e) {
    return 'unknown size';
  }
};

// Function to safely get header case-insensitively
const getHeaderValue = (headers: Record<string, string> | undefined, headerName: string): string | undefined => {
  if (!headers) return undefined;
  const lowerCaseHeader = headerName.toLowerCase();
  const foundKey = Object.keys(headers).find(key => key.toLowerCase() === lowerCaseHeader);
  return foundKey ? headers[foundKey] : undefined;
};

// Function to define cartoon button styles based on theme
const getCartoonButtonStyles = (isDark: boolean) => {
  const baseCartoonButtonStyle = cn(
    "gap-1 rounded-xl border-2 px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60",
    isDark ? "border-blue-500" : "border-neutral-800"
  );

  const primaryCartoonButtonStyle = cn(
    baseCartoonButtonStyle,
    isDark 
      ? "bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-400 focus:ring-offset-neutral-900" 
      : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
  );

  const outlineCartoonButtonStyle = cn(
    baseCartoonButtonStyle,
    isDark 
      ? "bg-neutral-800 hover:bg-neutral-700 text-blue-300 focus:ring-blue-500 focus:ring-offset-neutral-900" 
      : "bg-white hover:bg-neutral-100 text-neutral-800 focus:ring-blue-500"
  );

  const iconCartoonButtonStyle = cn(
    "h-9 w-9 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center",
    isDark 
      ? "border-blue-500 text-blue-300 hover:bg-neutral-700 hover:text-blue-200 focus:ring-blue-500 focus:ring-offset-neutral-900" 
      : "border-neutral-800 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 focus:ring-blue-500"
  );

  return { baseCartoonButtonStyle, primaryCartoonButtonStyle, outlineCartoonButtonStyle, iconCartoonButtonStyle };
};

interface JsonNodeSettingsProps {
  node: Node<JsonNodeData>;
  executionResult: NodeResult | undefined; // Pass execution result as prop
}

export function JsonNodeSettings({ node, executionResult }: JsonNodeSettingsProps) {
  const { updateNodeData } = useFlowStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // State for JSON viewing options
  const [searchTerm, setSearchTerm] = useState('');
  const [jsonPath, setJsonPath] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [viewType, setViewType] = useState<JsonViewType>('pretty');
  const [jsonPathError, setJsonPathError] = useState<string | null>(null);
  const [nodeWidth, setNodeWidth] = useState<number>(node.data?.width || 300);
  
  const { iconCartoonButtonStyle } = getCartoonButtonStyles(isDark); // Get button styles

  const nodeData = useMemo(() => ({ // Memoize nodeData processing
    label: 'JSON Output', // Default label
    jsonData: undefined,
    width: 300, // Default width
    ...node.data,
  }), [node.data]);

  // Sync width state with node data
  useEffect(() => {
    setNodeWidth(node.data?.width || 300);
  }, [node.data?.width]);

  // Use the execution result data if successful, fallback to node data
  const jsonData = useMemo(() => {
    if (executionResult?.status === 'success') {
      return executionResult.data;
    }
    return nodeData.jsonData;
  }, [executionResult, nodeData.jsonData]);
  
  // Determine content type and set initial view
  const contentType = useMemo(() => {
    // Ensure headers are undefined if nullish, satisfying getHeaderValue's expected type
    const headers = executionResult?.headers ?? undefined; 
    return getHeaderValue(headers, 'content-type') || 'application/json'; // Default to json if no header
  }, [executionResult?.headers]);

  useEffect(() => {
    if (contentType.includes('html')) {
      setViewType('preview');
    } else if (contentType.includes('json')) {
      setViewType('pretty');
    } else {
      setViewType('raw'); // Default to raw for text, xml, etc.
    }
  }, [contentType]);

  // Process JSON data for display
  const jsonDataString = useMemo(() => formatJson(jsonData), [jsonData]);
  // Raw data string representation
  const rawDataString = useMemo(() => {
    if (jsonData === undefined || jsonData === null) return '';
    return typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData);
  }, [jsonData]);

  const hasData = useMemo(() => rawDataString.length > 0, [rawDataString]);
  const dataSize = useMemo(() => getDataSize(jsonData), [jsonData]);
  const defaultFilename = useMemo(() => {
    let extension = 'txt';
    if (contentType.includes('json')) extension = 'json';
    else if (contentType.includes('html')) extension = 'html';
    else if (contentType.includes('xml')) extension = 'xml';
    
    return `${nodeData.label?.replace(/\s+/g, '_').toLowerCase() || 'output'}.${extension}`;
  }, [nodeData.label, contentType]);

  // Filter JSON by path if specified (only applicable for pretty view)
  const filteredJsonString = useMemo(() => {
    setJsonPathError(null); // Reset error
    if (!jsonPath || !jsonData || !contentType.includes('json')) {
      // Return raw formatted string if no path, not JSON, or no data
      return jsonDataString; 
    }
    
    try {
      // Use JSONPath library ONLY if content is JSON
      const result = JSONPath({ path: jsonPath, json: jsonData });
      
      if (result.length === 0) {
        setJsonPathError('Path returned no results.');
        return '[]'; // Show empty array if no results
      }
      // If the result is a single primitive value, JSONPath might return it directly
      if (result.length === 1 && typeof result[0] !== 'object') {
        return formatJson(result[0]);
      }
      // Otherwise, format the array of results (or single object/array result)
      return formatJson(result.length === 1 ? result[0] : result);

    } catch (e: any) {
      // Catch errors from JSONPath library (e.g., invalid syntax)
      
      setJsonPathError(e.message || 'Invalid JSON path syntax.');
      // Return an error message instead of the original string on path error
      return `Error: Invalid JSONPath expression`; 
    }
  }, [jsonPath, jsonData, jsonDataString, contentType]); // Added contentType dependency
  
  // Filtered content with search highlighting
  const displayedContent = useMemo(() => {
    const contentToSearch = viewType === 'pretty' ? filteredJsonString : rawDataString;
    setJsonPathError(null); // Reset path error when search/view changes

    if (!searchTerm) return contentToSearch;

    if (viewType === 'preview') return contentToSearch; 
    
    try {
      // Highlight based on theme
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

  // Function to download data (downloads based on raw content)
  const handleDataDownload = useCallback(() => {
    if (!hasData) return;
    // Use rawDataString for download regardless of view type
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
  
  // Copy to clipboard function (copies based on current view)
  const handleCopy = useCallback(() => {
    let contentToCopy = '';
    switch(viewType) {
      case 'pretty': contentToCopy = filteredJsonString; break;
      case 'raw': 
      case 'preview': // Copy raw content for preview as well
        contentToCopy = rawDataString; 
        break;
    }

    if (!contentToCopy) return;
    
    navigator.clipboard.writeText(contentToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [filteredJsonString, rawDataString, viewType, isCopied]);
  
  // Handle JSON path change
  const handleJsonPathChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setJsonPath(e.target.value);
  }, []);
  
  // Handle search term change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);
  
  // Clear filters
  const handleClearFilters = useCallback(() => {
    setJsonPath('');
    setSearchTerm('');
  }, []);
  
  // Handle node width change
  const handleWidthChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(event.target.value);
    if (!isNaN(newWidth)) {
      setNodeWidth(newWidth);
    }
  }, []);
  
  // Update node width in store
  const handleWidthChangeCommit = useCallback(() => {
    updateNodeData(node.id, { width: nodeWidth });
  }, [node.id, updateNodeData, nodeWidth]);

  return (
    <div className="space-y-4 font-sans"> 
      
      {/* Top Info: Size, Type, Download - Cartoon Style with Dark Mode */}
      <div className={cn(
        "flex items-center justify-between gap-2 text-xs",
        isDark ? "text-blue-100/70" : "text-neutral-600"
      )}>
        <div className="flex items-center gap-3">
           <span className="whitespace-nowrap font-medium">Size: {dataSize}</span>
           <span className="whitespace-nowrap font-medium">Type: <code className={cn(
             "px-1 rounded border",
             isDark ? "bg-neutral-700 border-blue-500 text-blue-200" : "bg-neutral-100 border-neutral-300 text-neutral-700"
           )}>{contentType}</code></span>
        </div>
        <Button 
          variant="ghost"
          size="icon"
          onClick={handleDataDownload}
          disabled={!hasData}
          title={`Download ${defaultFilename}`}
          className={cn(iconCartoonButtonStyle)}
        >
          <Download className="h-4.5 w-4.5" />
        </Button>
      </div>

      {/* View Options and Actions - Cartoon Style with Dark Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className={cn(
          "inline-flex rounded-xl p-1 border-2 shadow-inner",
          isDark ? "bg-neutral-800 border-blue-500" : "bg-neutral-100 border-neutral-800"
        )}>
           <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewType('pretty')}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-semibold transition-colors duration-200", 
                  viewType === 'pretty' 
                    ? (isDark ? "bg-blue-600 text-white shadow-md" : "bg-blue-500 text-white shadow-sm")
                    : (isDark ? "text-blue-200 hover:bg-neutral-700" : "text-neutral-600 hover:bg-neutral-200")
                )}
                disabled={!contentType.includes('json') && !contentType.includes('html')}
            >
                <Code className="h-3.5 w-3.5 mr-1"/> Pretty
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewType('raw')}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-semibold transition-colors duration-200", 
                  viewType === 'raw' 
                    ? (isDark ? "bg-blue-600 text-white shadow-md" : "bg-blue-500 text-white shadow-sm")
                    : (isDark ? "text-blue-200 hover:bg-neutral-700" : "text-neutral-600 hover:bg-neutral-200")
                )}
             >
                 <FileText className="h-3.5 w-3.5 mr-1"/> Raw
             </Button>
             <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewType('preview')}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-semibold transition-colors duration-200", 
                  viewType === 'preview' 
                    ? (isDark ? "bg-blue-600 text-white shadow-md" : "bg-blue-500 text-white shadow-sm")
                    : (isDark ? "text-blue-200 hover:bg-neutral-700" : "text-neutral-600 hover:bg-neutral-200")
                )}
                disabled={!contentType.includes('html')}
            >
                <MonitorPlay className="h-3.5 w-3.5 mr-1"/> Preview
            </Button>
        </div>
        
        <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            disabled={!hasData}
            title={isCopied ? "Copied!" : "Copy content"}
            className={cn(iconCartoonButtonStyle, "ml-auto")}
        >
          {isCopied ? <CheckCircle2 className="h-5 w-5 text-lime-500" /> : <Copy className="h-4.5 w-4.5" />}
        </Button>
      </div>
      
      {/* Search and JSONPath Inputs - Replace Shadcn Inputs */}
      {(viewType === 'pretty' || viewType === 'raw') && (
         <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
                <Search className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4", isDark ? "text-blue-300/50" : "text-neutral-400")} />
                <input
                    type="text"
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={cn(
                      "w-full rounded-lg focus:outline-none h-10 pl-9 pr-3 text-sm shadow-sm",
                      "allow-text-selection",
                      isDark 
                        ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400 placeholder:text-blue-200/50" 
                        : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
                    )}
                />
            </div>
             {viewType === 'pretty' && contentType.includes('json') && (
                 <div className="relative flex-grow">
                     <Filter className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4", isDark ? "text-blue-300/50" : "text-neutral-400")} />
                    <input
                        type="text"
                        placeholder="Filter with JSONPath (e.g., $.data)"
                        value={jsonPath}
                        onChange={handleJsonPathChange}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={cn(
                            "w-full rounded-lg focus:outline-none h-10 pl-9 pr-3 text-sm font-mono shadow-sm",
                            "allow-text-selection",
                            isDark 
                              ? "bg-neutral-800 border-2 text-white focus:border-blue-400 placeholder:text-blue-200/50" 
                              : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500",
                            jsonPathError ? (isDark ? "border-red-500 focus:border-red-400" : "border-red-600 focus:border-red-600") : (isDark ? "border-blue-500" : "border-neutral-800")
                        )}
                    />
                </div>
             )}
        </div>
      )}
      
      {/* JSONPath Error Alert - Cartoon Style with Dark Mode */}
      {jsonPathError && (
        <Alert variant="destructive" className={cn(
          "p-3 text-sm rounded-xl flex items-start gap-2 shadow-sm",
          isDark 
            ? "bg-red-900/30 border-2 border-red-700 text-red-300" 
            : "bg-red-100 border-2 border-red-700 text-red-800"
        )}>
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <AlertDescription className="font-medium">{jsonPathError}</AlertDescription>
        </Alert>
      )}

      {/* Data Display Area - Cartoon Style with Dark Mode */} 
      <div className="flex-grow min-h-[200px]"> 
        {!hasData ? (
            <div className={cn(
              "h-full flex flex-col items-center justify-center text-center border-2 border-dashed rounded-xl p-6 min-h-[200px]",
              isDark 
                ? "border-blue-500/40 bg-neutral-800/30 text-blue-100/70"
                : "border-neutral-400 bg-neutral-50/50 text-neutral-500"
            )}>
                <Info className={cn("h-7 w-7 mb-2", isDark ? "text-blue-300/50" : "text-neutral-400")} />
                <p className="text-sm font-medium">No data available yet!</p>
                <p className="text-xs">Run the flow or connect an input.</p>
            </div>
        ) : viewType === 'preview' ? (
            <iframe
              srcDoc={rawDataString} 
              title="HTML Preview"
              sandbox="allow-scripts allow-same-origin" 
              className={cn(
                "w-full h-full min-h-[300px] border-2 rounded-lg shadow-sm",
                isDark ? "border-blue-500 bg-neutral-900" : "border-neutral-800 bg-white"
              )}
            />
        ) : (
             <ScrollArea className={cn(
               "h-full max-h-[40vh] min-h-[200px] w-full border-2 rounded-lg shadow-sm p-0",
               isDark ? "bg-neutral-900 border-blue-500" : "bg-white border-neutral-800"
             )}>
                <pre className={cn(
                  "text-xs font-mono p-3 whitespace-pre-wrap break-all",
                  isDark ? "text-neutral-200" : "text-neutral-800"
                )}>
                    {/* Use dangerouslySetInnerHTML with theme-aware highlight */}
                    <code dangerouslySetInnerHTML={{ __html: displayedContent }}></code>
                </pre>
            </ScrollArea>
        )}
      </div>
    </div>
  );
}

// Consider adding React.memo
// export default memo(JsonNodeSettings); 