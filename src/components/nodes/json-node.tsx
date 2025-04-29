'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import React, { useState, useCallback, useMemo } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useFlowStore } from '@/store/flow-store';
import { cn } from "@/lib/utils";
import { 
  ChevronsUpDown, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Search,
  FileJson,
  Maximize2,
  Eye,
  GripHorizontal,
  Info,
  Filter,
  Braces
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JSONPath } from 'jsonpath-plus';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from 'next-themes';

// Interfaz para los datos esperados por este nodo
interface JsonNodeData {
  label?: string;
  inputData?: any; // Standard field for incoming data
  width?: number; // Añadir propiedad para el ancho personalizado
  [key: string]: any; // Index signature added previously
}

const formatJson = (data: any): string => {
  if (data === undefined || data === null) return '';
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return String(data);
  }
};

// Extract a small preview of JSON data
const getJsonPreview = (data: any): string => {
  if (data === undefined || data === null) return '';
  
  try {
    // If it's an array, show length and first few items
    if (Array.isArray(data)) {
      const preview = data.slice(0, 2);
      const previewString = preview.map(item => JSON.stringify(item)).join(', ');
      return `Array(${data.length}) [${previewString}${data.length > 2 ? ', ...' : ''}]`;
    }
    
    // If it's an object, show a subset of properties
    if (typeof data === 'object') {
      const keys = Object.keys(data).slice(0, 3);
      const previewObj = keys.reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
      }, {} as Record<string, any>);
      
      return JSON.stringify(previewObj) + (Object.keys(data).length > 3 ? '...' : '');
    }
    
    // For primitives or other types (like the HTML string in this case)
    return "[Datos Recibidos (No JSON)]"; // Return a more informative preview
  } catch (e) {
    return String(data); 
  }
};

// Estimate the size of the JSON data
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

// Define cartoon button styles
const cartoonIconButtonStyle = "h-9 w-9 rounded-lg border-2 border-neutral-800 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-lime-500 shadow-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center";

// Define dark mode cartoon button styles
const darkCartoonIconButtonStyle = "h-9 w-9 rounded-lg border-2 border-lime-500 text-lime-300 hover:bg-neutral-700 hover:text-lime-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-lime-400 shadow-md transition-all duration-200 disabled:opacity-50 flex items-center justify-center";

function JsonNodeComponent({ data, id, isConnectable }: NodeProps) {
  // Obtener resultados y funciones del store
  const { nodeResults, updateNodeData } = useFlowStore();
  const executionResult = nodeResults[id];
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [jsonPath, setJsonPath] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [jsonPathError, setJsonPathError] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Merge data
  const nodeData: JsonNodeData = {
    label: 'JSON Output',
    inputData: undefined,
    width: 300, // Default width
    ...data,
  };
  const { label, inputData, width } = nodeData;
  
  // Track resize operations
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = width || 300;
    let currentWidth = startWidth; // Variable to track width during drag
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(250, startWidth + moveEvent.clientX - startX);
      currentWidth = newWidth; // Update the tracked width
      
      // Visually update the node width directly via style for immediate feedback
      // Note: This might cause a slight flicker if React Flow also tries to manage size.
      // Alternatively, rely on React Flow's node resize handling if available/preferred.
      const nodeElement = (e.target as HTMLElement).closest('.react-flow__node');
      if (nodeElement) {
        (nodeElement as HTMLElement).style.width = `${currentWidth}px`;
      }
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setIsResizing(false);
      // --- UPDATE store only on mouse up ---
      updateNodeData(id, { width: currentWidth }); 
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [id, width, updateNodeData]);
  
  const jsonData = useMemo(() => inputData, [inputData]);
  const jsonDataString = useMemo(() => formatJson(jsonData), [jsonData]);
  const hasData = useMemo(() => jsonDataString.length > 0, [jsonDataString]);
  const dataSize = useMemo(() => getDataSize(jsonData), [jsonData]);
  const dataPreview = useMemo(() => getJsonPreview(jsonData), [jsonData]);
  
  // Filter JSON by path if specified, using JSONPath
  const filteredJsonString = useMemo(() => {
    setJsonPathError(null);
    if (!jsonPath || !jsonData) {
      return jsonDataString; 
    }
    
    try {
      // Use JSONPath library
      const result = JSONPath({ path: jsonPath, json: jsonData });
      
      if (result.length === 0) {
        setJsonPathError('Path returned no results.');
        return '[]';
      }
      // If the result is a single primitive value, JSONPath might return it directly
      // We format it nicely for display.
      if (result.length === 1 && typeof result[0] !== 'object') {
        return formatJson(result[0]);
      }
      // Otherwise, format the array of results (or single object/array result)
      return formatJson(result.length === 1 ? result[0] : result);

    } catch (e: any) {
      // Catch errors from JSONPath library (e.g., invalid syntax)
      setJsonPathError(e.message || 'Invalid JSON path syntax.');
      return `Error: Invalid JSON path`;
    }
  }, [jsonPath, jsonData, jsonDataString]);
  
  // Filtered content with search highlighting
  const displayedContent = useMemo(() => {
    if (!searchTerm) return filteredJsonString;
    
    try {
      // Simple highlighting by splitting on search term and joining with highlighted spans
      // This is a simple approach - a proper JSON viewer would use syntax highlighting
      const parts = filteredJsonString.split(new RegExp(`(${searchTerm})`, 'gi'));
      
      return parts.map((part, i) => 
        part.toLowerCase() === searchTerm.toLowerCase() 
          ? `<span class="${isDark ? 'bg-yellow-500 text-black' : 'bg-yellow-200 text-black'} font-bold">${part}</span>` 
          : part
      ).join('');
    } catch (e) {
      return filteredJsonString;
    }
  }, [filteredJsonString, searchTerm, isDark]);

  // Colored top border for status indication with cartoon style
  const topBorderClass = cn(
    "border-t-[3px]",
    executionResult?.status === 'loading' ? (isDark ? "border-blue-400" : "border-blue-500") :
    executionResult?.status === 'success' ? (isDark ? "border-lime-400" : "border-lime-500") :
    executionResult?.status === 'error' ? (isDark ? "border-red-400" : "border-red-500") :
    "border-transparent" 
  );

  // Función para descargar el JSON
  const handleDownload = useCallback(() => {
    if (!jsonDataString) return;
    const blob = new Blob([jsonDataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = label ? `${label.replace(/\s+/g, '_').toLowerCase()}.json` : 'output.json';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [jsonDataString, label]);
  
  // Copy to clipboard function
  const handleCopy = useCallback(() => {
    if (!jsonDataString) return;
    
    navigator.clipboard.writeText(filteredJsonString).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [filteredJsonString, jsonDataString]);
  
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

  return (
    // Cartoon style node with width and status border
    <div 
      className={cn(
        "nowheel rounded-xl shadow-md text-sm overflow-hidden", // Base classes + Added overflow-hidden
        isDark 
          ? "bg-neutral-800 border-2 border-lime-500 text-white backdrop-blur-sm backdrop-saturate-150" 
          : "bg-white border-2 border-neutral-800 text-neutral-800", // Cartoon appearance
        topBorderClass // Status indicator
      )}
      style={{ width: `${width || 300}px` }} // Apply dynamic width
    >
      {/* Cartoon Handles */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="input"
        isConnectable={isConnectable} 
        className={cn(
          "!w-3 !h-3 !border-2 !shadow-sm",
          isDark 
            ? "!bg-blue-400 !border-blue-600" 
            : "!bg-blue-500 !border-neutral-800"
        )}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="output"
        isConnectable={isConnectable}
        className={cn(
          "!w-3 !h-3 !border-2 !shadow-sm",
          isDark 
            ? "!bg-lime-400 !border-lime-600" 
            : "!bg-lime-500 !border-neutral-800"
        )}
      />

      {/* Collapsible Container */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Cartoon Header */}
        <div className={cn(
          "px-3 py-2 border-b-2 rounded-t-xl flex items-center justify-between gap-2",
          isDark 
            ? "border-lime-500 bg-neutral-900" 
            : "border-neutral-800 bg-lime-50"
        )}>
          {/* Title and Status Icons */}
          <div className="flex items-center gap-2 overflow-hidden">
              <Braces className={cn(
                "h-4 w-4 flex-shrink-0",
                isDark ? "text-lime-300" : "text-lime-600"
              )} />
              <h3 className={cn(
                "text-sm font-bold truncate",
                isDark ? "text-white" : "text-neutral-800"
              )} title={label}>
                {label}
              </h3>
              {executionResult?.status === 'loading' && <Loader2 className={cn(
                "h-4 w-4 animate-spin flex-shrink-0",
                isDark ? "text-blue-300" : "text-blue-600"
              )} />}
              {executionResult?.status === 'success' && <CheckCircle2 className={cn(
                "h-4 w-4 flex-shrink-0",
                isDark ? "text-lime-300" : "text-lime-600"
              )} />}
              {executionResult?.status === 'error' && <AlertCircle className={cn(
                "h-4 w-4 flex-shrink-0",
                isDark ? "text-red-300" : "text-red-600"
              )} />}
          </div>
          {/* Collapse Trigger Button with Cartoon Style */}
          <CollapsibleTrigger asChild>
             <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 rounded-lg border",
                  isDark 
                    ? "bg-neutral-700 border-lime-500 hover:bg-neutral-600 text-lime-300" 
                    : "bg-white border-neutral-300 hover:bg-neutral-100 text-neutral-600"
                )} 
                title={isOpen ? "Collapse" : "Expand"}
             >
                <ChevronsUpDown className="h-4 w-4" />
             </Button>
          </CollapsibleTrigger>
        </div>

        {/* Visible Content when Collapsed - Cartoon style */}
        <div className={cn(
          "p-3 space-y-1",
          isDark ? "bg-neutral-800" : "bg-white"
        )}>
          {/* Data Preview */}
          <div className="flex items-center justify-between text-xs text-neutral-600">
              <span className={cn(
                "font-mono truncate", 
                isDark ? "text-neutral-300" : "text-neutral-600"
              )} title={dataPreview}> 
                {hasData ? dataPreview : <span className={cn(
                  'italic', 
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                )}>No data received</span>} 
              </span>
              {hasData && (
                  <Badge className={cn(
                    "ml-2 flex-shrink-0 text-xs font-medium rounded-md px-2 py-0.5 border",
                    isDark 
                      ? "bg-lime-900 text-lime-300 border-lime-700"
                      : "bg-lime-100 text-lime-800 border-lime-300"
                  )}>
                      {dataSize}
                  </Badge>
              )}
          </div>
        </div>

        {/* Collapsible Content Area - Cartoon style */}
        <CollapsibleContent>
          <div className={cn(
            "border-t-2 p-3 space-y-3",
            isDark 
              ? "border-lime-500 bg-neutral-800" 
              : "border-neutral-800 bg-white"
          )}>
             {/* Toolbar: Search, Path, Copy, Download */}
             <div className="flex flex-col sm:flex-row gap-2 items-center">
                 {/* Search Input - Cartoon style */}
                 <div className="relative w-full sm:w-auto flex-grow">
                    <Search className={cn(
                      "absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4",
                      isDark ? "text-neutral-400" : "text-neutral-500"
                    )} />
                    <Input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className={cn(
                          "nodrag w-full rounded-lg focus:outline-none h-9 pl-8 pr-3 text-sm shadow-sm",
                          isDark 
                            ? "bg-neutral-700 border-2 border-lime-500 text-white focus:border-lime-400" 
                            : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
                        )}
                    />
                </div>
                {/* JSONPath Input - Cartoon style */}
                <div className="relative w-full sm:w-auto flex-grow">
                    <Filter className={cn(
                      "absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4",
                      isDark ? "text-neutral-400" : "text-neutral-500"
                    )} />
                    <Input
                        type="text"
                        placeholder="Filter with JSONPath..."
                        value={jsonPath}
                        onChange={handleJsonPathChange}
                        className={cn(
                            "nodrag w-full rounded-lg focus:outline-none h-9 pl-8 pr-3 text-sm font-mono shadow-sm",
                            isDark 
                              ? "bg-neutral-700 border-2 border-lime-500 text-white focus:border-lime-400" 
                              : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500",
                            jsonPathError && (isDark ? "border-red-500 focus:border-red-400" : "border-red-500 focus:border-red-500 focus:ring-red-500")
                        )}
                        title={jsonPathError || "Enter JSONPath expression"}
                    />
                </div>
                {/* Action Buttons - Cartoon style */}
                <div className="flex gap-1.5 flex-shrink-0">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleCopy} 
                        disabled={!hasData || isResizing} 
                        title={isCopied ? "Copied!" : "Copy filtered view"} 
                        className={cn(
                          isDark ? darkCartoonIconButtonStyle : cartoonIconButtonStyle
                        )}
                    >
                         {isCopied ? <CheckCircle2 className={cn(
                           "h-4 w-4",
                           isDark ? "text-lime-300" : "text-lime-600"
                         )} /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleDownload} 
                        disabled={!hasData || isResizing} 
                        title="Download raw JSON" 
                        className={cn(
                          isDark ? darkCartoonIconButtonStyle : cartoonIconButtonStyle
                        )}
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
             </div>
             
              {/* JSONPath Error Alert - Cartoon style */}
              {jsonPathError && (
                <Alert className={cn(
                  "p-3 text-xs rounded-lg flex items-center gap-2 shadow-sm",
                  isDark 
                    ? "bg-red-900/70 border-2 border-red-700 text-red-200" 
                    : "bg-red-100 border-2 border-red-700 text-red-800"
                )}>
                  <AlertCircle className={cn(
                    "h-4 w-4 flex-shrink-0",
                    isDark ? "text-red-300" : "text-red-600"
                  )} />
                  <AlertDescription className="font-medium">{jsonPathError}</AlertDescription>
                </Alert>
              )}
              
             {/* JSON Display - Cartoon style */}
             <ScrollArea className={cn(
                "h-[250px] w-full border-2 rounded-lg p-0 shadow-sm",
                isDark 
                  ? "border-lime-500 bg-neutral-900" 
                  : "border-neutral-800 bg-neutral-50"
             )}>
                <pre className={cn(
                  "text-xs font-mono p-3 whitespace-pre-wrap break-words",
                  isDark ? "text-neutral-300" : "text-neutral-800"
                )}>
                    {/* Use dangerouslySetInnerHTML for highlighting */}
                    <code dangerouslySetInnerHTML={{ __html: displayedContent }}></code>
                </pre>
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Resize Handle - Cartoon style */}
      <div 
        onMouseDown={startResize} 
        className="absolute -right-1 bottom-0 top-0 w-2 cursor-col-resize flex items-center justify-center group"
      >
          <GripHorizontal className={cn(
            "h-4 w-4 group-hover:text-neutral-800 transition-colors",
            isDark ? "text-lime-300 group-hover:text-lime-200" : "text-neutral-600"
          )} />
      </div>
    </div>
  );
}

export const JsonNode = React.memo(JsonNodeComponent);