'use client';
import React, { useState, useEffect, ReactNode } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, AlertCircle, CheckCircle, Clock, Tag, Info, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Import the main Zustand store
import { useFlowStore } from '@/store/index';
import { Node } from '@xyflow/react';

// Shared view-specific interface for node results
interface SharedViewNodeResult {
  status: 'success' | 'error' | 'pending' | 'idle' | 'loading';
  data?: any;
  error?: string | null;
  timestamp?: Date | number;
}

// Component to display result status in the shared view
const SharedViewResultStatus: React.FC<{ status: SharedViewNodeResult['status'] }> = ({ status }) => {
  const commonClasses = "text-xs px-2 py-0.5 rounded-full border flex items-center gap-1";
  switch (status) {
    case 'success':
      return <Badge variant="outline" className={`${commonClasses} bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700`}><CheckCircle className="w-3 h-3" /> Success</Badge>;
    case 'error':
      return <Badge variant="outline" className={`${commonClasses} bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700`}><AlertCircle className="w-3 h-3" /> Error</Badge>;
    case 'pending':
    case 'loading':
      return <Badge variant="outline" className={`${commonClasses} bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700`}><Loader2 className="w-3 h-3 animate-spin" /> Processing</Badge>;
    default: // idle
      return <Badge variant="outline" className={`${commonClasses} bg-gray-100 text-gray-600 border-gray-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700`}><Clock className="w-3 h-3" /> Not Run</Badge>;
  }
};

// Component to render a configuration row in the shared view
const SharedViewConfigRow: React.FC<{ configKey: string; configValue: any }> = ({ configKey, configValue }) => {
  let displayValue: ReactNode;
  const valueType = typeof configValue;

  if (configValue === null || configValue === undefined || configValue === '') {
    displayValue = <span className="text-neutral-400 italic">empty</span>;
  } else if (valueType === 'string' && configValue.length > 200) {
    displayValue = (
      <ScrollArea className="max-h-40 mt-1 rounded border bg-neutral-50 dark:bg-neutral-800 p-2 font-mono text-xs">
        {configValue}
      </ScrollArea>
    );
  } else if (valueType === 'string' && (configValue.startsWith('http') || configValue.startsWith('/'))) {
    displayValue = <a href={configValue} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-all">{configValue}</a>;
  } else if (valueType === 'boolean') {
    displayValue = <span className={configValue ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{configValue ? 'True' : 'False'}</span>;
  } else if (valueType === 'object') {
    try {
      const jsonString = JSON.stringify(configValue, null, 2);
      displayValue = (
        <ScrollArea className="max-h-40 mt-1 rounded border bg-neutral-50 dark:bg-neutral-800 p-2 font-mono text-xs">
          <pre>{jsonString}</pre>
        </ScrollArea>
      );
    } catch (e) {
      displayValue = <span className="text-neutral-500">[Complex Object]</span>;
    }
  } else {
    displayValue = <span className="text-neutral-800 dark:text-neutral-200 break-words">{String(configValue)}</span>;
  }

  return (
    <div className="pb-2 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0">
      <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 font-medium capitalize">
        {configKey.replace(/([A-Z])/g, ' $1').trim()}
      </div>
      <div>{displayValue}</div>
    </div>
  );
};

// Component to display node configuration in the shared view
const SharedViewConfigDisplay: React.FC<{ data: Record<string, any> | undefined }> = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return <div className="text-neutral-500 italic text-center py-4 text-sm">No configuration data.</div>;
  }

  // Exclude internal properties from display
  const excludedKeys = ['isReadOnly', 'internalState', 'width', 'height', 'positionAbsolute', 'selected', 'dragging', 'resizing', 'label'];
  const displayData = Object.entries(data)
    .filter(([key]) => !excludedKeys.includes(key))
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  if (displayData.length === 0) {
     return <div className="text-neutral-500 italic text-center py-4 text-sm">No relevant configuration to display.</div>;
  }

  return (
    <div className="space-y-4 text-sm">
      {displayData.map(([key, value]) => (
        <SharedViewConfigRow key={key} configKey={key} configValue={value} />
      ))}
    </div>
  );
};

// Main inspection panel component for the shared view
export function InspectionPanel() {
  const {
    nodes,
    selectedNodeId,
    nodeResults,
    executeSingleNode,
    isRunning,
  } = useFlowStore();

  const selectedNode = nodes.find(node => node.id === selectedNodeId) as Node<any> | undefined;
  const [activeTab, setActiveTab] = useState('config');

  useEffect(() => {
    if (selectedNodeId) {
      setActiveTab('config');
    }
  }, [selectedNodeId]);

  // Show a message when no node is selected
  if (!selectedNode) {
    return (
      <Card className="h-full flex items-center justify-center border-l-0 border-r-0 border-b-0 rounded-none shadow-none bg-transparent">
        <div className="text-center p-6 text-neutral-500 dark:text-neutral-400">
          <Info className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select a node to view details</p>
        </div>
      </Card>
    );
  }

  // Get the result state for the selected node (or default to idle)
  const result: SharedViewNodeResult = nodeResults[selectedNode.id] || { status: 'idle' as const };
  const nodeType = selectedNode.type || 'unknown';
  const nodeLabel = typeof selectedNode.data?.label === 'string' ? selectedNode.data.label : 'Unnamed Node';

  // Check if simulation is disabled
  const isSimulationDisabled = isRunning || result.status === 'pending' || result.status === 'loading';

  return (
    <Card className="h-full flex flex-col border-l-0 border-r-0 border-b-0 rounded-none shadow-none bg-neutral-50 dark:bg-neutral-900">
      <CardHeader className="pb-3 border-b dark:border-neutral-800">
        <div className="flex justify-between items-center mb-1">
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            <Tag className="w-3 h-3" />
            <span>{nodeType}</span>
          </Badge>
        </div>
        <CardTitle className="text-lg font-semibold truncate" title={nodeLabel}>
            {nodeLabel}
        </CardTitle>
      </CardHeader>

      <Tabs defaultValue="config" className="flex-1 flex flex-col overflow-hidden" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-4 py-2 border-b dark:border-neutral-800">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="config" className="text-xs h-6">Configuration</TabsTrigger>
            <TabsTrigger value="results" className="text-xs h-6">Simulation</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="config" className="flex-1 overflow-y-auto mt-0">
          <CardContent className="p-4">
            <SharedViewConfigDisplay data={selectedNode.data} />
          </CardContent>
        </TabsContent>

        <TabsContent value="results" className="flex-1 flex flex-col mt-0 overflow-hidden">
          <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
            <div className="mb-3 flex items-center justify-between flex-shrink-0">
              <SharedViewResultStatus status={result.status} />
              {result.timestamp && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second: '2-digit' })}
                </span>
              )}
            </div>

            <ScrollArea className="flex-1 border rounded-md bg-white dark:bg-neutral-800/50 dark:border-neutral-700">
              <div className="p-3 min-h-full flex flex-col justify-center">
                {result.status === 'error' ? (
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-red-800 dark:text-red-300 text-sm">
                    <p className="font-medium mb-1">Simulation Error:</p>
                    <p className="font-mono text-xs break-all">{result.error || 'Unknown error'}</p>
                  </div>
                ) : result.status === 'success' ? (
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 font-medium">Simulated Output:</p>
                    <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                      {result.data !== undefined ? JSON.stringify(result.data, null, 2) : 'No output data'}
                    </pre>
                  </div>
                ) : (result.status === 'pending' || result.status === 'loading') ? (
                  <div className="text-center text-neutral-500 dark:text-neutral-400 text-sm">
                    Simulating...
                  </div>
                ) : ( // idle
                  <div className="text-center text-neutral-500 dark:text-neutral-400 text-sm">
                    Click "Simulate Execution" to see example results.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          
          <CardFooter className="border-t dark:border-neutral-800 pt-3 mt-auto flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 w-full"
              onClick={() => selectedNode && executeSingleNode(selectedNode.id)}
              disabled={isSimulationDisabled || !selectedNode}
            >
              {(result.status === 'pending' || result.status === 'loading') ? 
                <Loader2 className="h-4 w-4 animate-spin" /> : 
                <Play className="h-4 w-4" />
              }
              Simulate Execution
            </Button>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 