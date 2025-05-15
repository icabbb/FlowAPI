'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, AlertCircle, CheckCircle, Clock, Tag, Info, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useFlowStore } from '@/store/index';
import { Node } from '@xyflow/react';
import { SavedFlow } from '@/contracts/types/flow.types';

// Shared view node result type
interface SharedViewNodeResult {
  status: 'success' | 'error' | 'pending' | 'idle' | 'loading';
  data?: any;
  error?: string | null;
  timestamp?: Date | number;
}

interface SharedNodePanelProps {
  flow: SavedFlow;
}

/**
 * A read-only node settings panel for the shared flow view.
 * Similar to the NodeSettingsPanel but without editing capabilities.
 */
export default function SharedNodePanel({ flow }: SharedNodePanelProps) {
  const {
    nodes,
    selectedNodeId,
    nodeResults,
    executeSingleNode,
    isRunning,
  } = useFlowStore();
  
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const selectedNode = nodes.find(node => node.id === selectedNodeId) as Node<any> | undefined;
  const [activeTab, setActiveTab] = useState('config');

  useEffect(() => {
    if (selectedNodeId) {
      setActiveTab('config');
    }
  }, [selectedNodeId]);

  // Display node properties as a formatted row
  const PropertyRow = ({ label, value }: { label: string; value: any }) => {
    let displayValue: ReactNode;
    const valueType = typeof value;

    if (value === null || value === undefined || value === '') {
      displayValue = <span className={cn("text-xs italic", isDark ? "text-blue-400/60" : "text-neutral-400")}>empty</span>;
    } else if (valueType === 'string' && value.length > 200) {
      displayValue = (
        <ScrollArea className={cn(
          "max-h-40 mt-1 rounded-xl border-2 p-2 font-mono text-xs", 
          isDark ? "bg-blue-950/30 border-blue-800" : "bg-blue-50 border-blue-300"
        )}>
          {value}
        </ScrollArea>
      );
    } else if (valueType === 'string' && (value.startsWith('http') || value.startsWith('/'))) {
      displayValue = (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={cn(
            "hover:underline break-all",
            isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
          )}
        >
          {value}
        </a>
      );
    } else if (valueType === 'boolean') {
      displayValue = (
        <span className={cn(
          "font-medium px-2 py-0.5 rounded-lg",
          value 
            ? isDark ? "bg-green-950/30 text-green-400 border border-green-800" : "bg-green-100 text-green-700" 
            : isDark ? "bg-red-950/30 text-red-400 border border-red-800" : "bg-red-100 text-red-700"
        )}>
          {value ? 'True' : 'False'}
        </span>
      );
    } else if (valueType === 'object') {
      try {
        const jsonString = JSON.stringify(value, null, 2);
        displayValue = (
          <ScrollArea className={cn(
            "max-h-40 mt-1 rounded-xl border-2 p-2 font-mono text-xs",
            isDark ? "bg-blue-950/30 border-blue-800" : "bg-blue-50 border-blue-300"
          )}>
            <pre>{jsonString}</pre>
          </ScrollArea>
        );
      } catch (e) {
        displayValue = <span className={cn("text-xs italic", isDark ? "text-blue-400/60" : "text-neutral-500")}>[Complex Object]</span>;
      }
    } else {
      displayValue = <span className={cn("break-words", isDark ? "text-blue-200" : "text-neutral-800")}>{String(value)}</span>;
    }

    return (
      <div className={cn(
        "pb-3 mb-3 border-b-2 last:border-b-0 last:mb-0",
        isDark ? "border-blue-800/30" : "border-blue-200"
      )}>
        <div className={cn(
          "text-xs mb-1 font-medium capitalize",
          isDark ? "text-blue-300" : "text-blue-700"
        )}>
          {label}
        </div>
        <div>{displayValue}</div>
      </div>
    );
  };

  // Status badge component
  const ResultStatusBadge = ({ status }: { status: SharedViewNodeResult['status'] }) => {
    const commonClasses = cn(
      "text-xs px-2.5 py-1 rounded-full border-2 flex items-center gap-1.5 font-medium",
      isDark ? "" : ""
    );
    
    switch (status) {
      case 'success':
        return (
          <Badge variant="outline" className={cn(
            commonClasses,
            isDark 
              ? "bg-green-900/30 text-green-300 border-green-700" 
              : "bg-green-50 text-green-700 border-green-300"
          )}>
            <CheckCircle className="w-3.5 h-3.5" /> Success
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className={cn(
            commonClasses,
            isDark 
              ? "bg-red-900/30 text-red-300 border-red-700" 
              : "bg-red-50 text-red-700 border-red-300"
          )}>
            <AlertCircle className="w-3.5 h-3.5" /> Error
          </Badge>
        );
      case 'pending':
      case 'loading':
        return (
          <Badge variant="outline" className={cn(
            commonClasses,
            isDark 
              ? "bg-yellow-900/30 text-yellow-300 border-yellow-700" 
              : "bg-yellow-50 text-yellow-700 border-yellow-300"
          )}>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing
          </Badge>
        );
      default: // idle
        return (
          <Badge variant="outline" className={cn(
            commonClasses,
            isDark 
              ? "bg-blue-900/30 text-blue-300 border-blue-700" 
              : "bg-blue-50 text-blue-600 border-blue-300"
          )}>
            <Clock className="w-3.5 h-3.5" /> Not Run
          </Badge>
        );
    }
  };

  // Display configuration properties
  const ConfigDisplay = ({ data }: { data: Record<string, any> | undefined }) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className={cn(
          "text-center py-6 px-4 rounded-xl border-2",
          isDark ? "bg-blue-950/20 border-blue-800 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-600"
        )}>
          No configuration data available for this node.
        </div>
      );
    }

    // Exclude internal properties
    const excludedKeys = ['isReadOnly', 'internalState', 'width', 'height', 'positionAbsolute', 'selected', 'dragging', 'resizing'];
    const displayData = Object.entries(data)
      .filter(([key]) => !excludedKeys.includes(key))
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    if (displayData.length === 0) {
       return (
         <div className={cn(
           "text-center py-6 px-4 rounded-xl border-2",
           isDark ? "bg-blue-950/20 border-blue-800 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-600"
         )}>
           No relevant configuration to display.
         </div>
       );
    }

    return (
      <div className="space-y-2 text-sm">
        {displayData.map(([key, value]) => (
          <PropertyRow key={key} label={key.replace(/([A-Z])/g, ' $1').trim()} value={value} />
        ))}
      </div>
    );
  };

  // Empty state when no node is selected
  if (!selectedNode) {
    return (
      <Card className={cn(
        "h-full flex items-center justify-center border-0 rounded-none shadow-none",
        isDark ? "dark-cartoon-panel bg-blue-950/20" : "bg-blue-50/50"
      )}>
        <div className={cn(
          "text-center p-6 rounded-xl border-2",
          isDark 
            ? "text-blue-300 border-blue-800/50 bg-blue-900/20" 
            : "text-blue-600 border-blue-200 bg-white"
        )}>
          <Info className="h-10 w-10 mx-auto mb-3 opacity-70" />
          <p className="text-sm font-medium">Select a node to view its details</p>
          <p className="text-xs mt-2 opacity-80">Click on any node in the flow canvas</p>
        </div>
      </Card>
    );
  }

  // Get the result state for the selected node
  const result: SharedViewNodeResult = nodeResults[selectedNode.id] || { status: 'idle' as const };
  const nodeType = selectedNode.type || 'unknown';
  const nodeLabel = selectedNode.data?.label || 'Unnamed Node';
  
  // Check if simulation is disabled
  const isSimulationDisabled = isRunning || result.status === 'pending' || result.status === 'loading';

  return (
    <Card className={cn(
      "h-full flex flex-col border-0 rounded-none shadow-none",
      isDark ? "dark-cartoon-panel bg-blue-950/20" : "bg-blue-50/50"
    )}>
      <CardHeader className={cn(
        "pb-3 border-b-2",
        isDark ? "border-blue-800" : "border-blue-200"
      )}>
        <div className="flex justify-between items-center mb-1">
          <Badge variant="secondary" className={cn(
            "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border-2",
            isDark 
              ? "bg-blue-900/50 text-blue-300 border-blue-700" 
              : "bg-blue-100 text-blue-700 border-blue-300"
          )}>
            <Tag className="w-3.5 h-3.5" />
            <span className="font-medium">{nodeType}</span>
          </Badge>
        </div>
        <CardTitle className={cn(
          "text-lg font-bold truncate",
          isDark ? "text-blue-200" : "text-blue-800"
        )} title={nodeLabel}>
            {nodeLabel}
        </CardTitle>
      </CardHeader>

      <Tabs defaultValue="config" className="flex-1 flex flex-col overflow-hidden" value={activeTab} onValueChange={setActiveTab}>
        <div className={cn(
          "px-4 py-2 border-b-2",
          isDark ? "border-blue-800" : "border-blue-200"
        )}>
          <TabsList className={cn(
            "grid w-full grid-cols-2 h-9 p-1 rounded-xl",
            isDark ? "bg-blue-900/30" : "bg-blue-100"
          )}>
            <TabsTrigger value="config" className={cn(
              "text-sm rounded-lg",
              isDark 
                ? "data-[state=active]:bg-blue-800 data-[state=active]:text-blue-200" 
                : "data-[state=active]:bg-white data-[state=active]:text-blue-700"
            )}>Configuration</TabsTrigger>
            <TabsTrigger value="results" className={cn(
              "text-sm rounded-lg",
              isDark 
                ? "data-[state=active]:bg-blue-800 data-[state=active]:text-blue-200" 
                : "data-[state=active]:bg-white data-[state=active]:text-blue-700"
            )}>Simulation</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="config" className="flex-1 overflow-y-auto mt-0">
          <CardContent className="p-4">
            <ConfigDisplay data={selectedNode.data} />
          </CardContent>
        </TabsContent>

        <TabsContent value="results" className="flex-1 flex flex-col mt-0 overflow-hidden">
          <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
            <div className="mb-4 flex items-center justify-between flex-shrink-0">
              <ResultStatusBadge status={result.status} />
              {result.timestamp && (
                <span className={cn(
                  "text-xs px-2 py-1 rounded-lg",
                  isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-600"
                )}>
                  {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second: '2-digit' })}
                </span>
              )}
            </div>

            <ScrollArea className={cn(
              "flex-1 border-2 rounded-xl",
              isDark 
                ? "bg-blue-950/30 border-blue-800" 
                : "bg-white border-blue-200"
            )}>
              <div className="p-4 min-h-full flex flex-col justify-center">
                {result.status === 'error' ? (
                  <div className={cn(
                    "p-4 rounded-xl border-2",
                    isDark ? "bg-red-900/20 border-red-800 text-red-300" : "bg-red-50 border-red-200 text-red-800"
                  )}>
                    <p className="font-medium mb-2">Simulation Error:</p>
                    <p className="font-mono text-xs break-all">{result.error || 'Unknown error'}</p>
                  </div>
                ) : result.status === 'success' ? (
                  <div>
                    <p className={cn(
                      "text-xs mb-2 font-medium",
                      isDark ? "text-blue-300" : "text-blue-700"
                    )}>Simulated Output:</p>
                    <pre className={cn(
                      "text-xs whitespace-pre-wrap break-all font-mono p-3 rounded-xl border-2",
                      isDark 
                        ? "bg-blue-900/20 border-blue-800 text-blue-200" 
                        : "bg-blue-50 border-blue-200 text-blue-800"
                    )}>
                      {result.data !== undefined ? JSON.stringify(result.data, null, 2) : 'No output data'}
                    </pre>
                  </div>
                ) : (result.status === 'pending' || result.status === 'loading') ? (
                  <div className={cn(
                    "text-center p-6 rounded-xl border-2",
                    isDark 
                      ? "bg-blue-900/20 border-blue-800 text-blue-300" 
                      : "bg-blue-50 border-blue-200 text-blue-600"
                  )}>
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin opacity-70" />
                    <p>Simulating node execution...</p>
                  </div>
                ) : ( // idle
                  <div className={cn(
                    "text-center p-6 rounded-xl border-2",
                    isDark 
                      ? "bg-blue-900/20 border-blue-800 text-blue-300" 
                      : "bg-blue-50 border-blue-200 text-blue-600"
                  )}>
                    <Play className="h-8 w-8 mx-auto mb-2 opacity-70" />
                    <p>Click "Simulate Execution" to see example results</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          
          <div className={cn(
            "p-4 border-t-2 flex-shrink-0", 
            isDark ? "border-blue-800" : "border-blue-200"
          )}>
            <Button
              variant={isDark ? "outline" : "secondary"}
              size="sm"
              className={cn(
                "gap-2 w-full rounded-xl h-10 text-sm font-medium",
                isDark 
                  ? "border-2 border-blue-700 text-blue-300 hover:text-blue-200 hover:bg-blue-900/30" 
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200 border-2 border-blue-300"
              )}
              onClick={() => selectedNode && executeSingleNode(selectedNode.id)}
              disabled={isSimulationDisabled || !selectedNode}
            >
              {(result.status === 'pending' || result.status === 'loading') ? 
                <Loader2 className="h-5 w-5 animate-spin" /> : 
                <Play className="h-5 w-5" />
              }
              Simulate Execution
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 