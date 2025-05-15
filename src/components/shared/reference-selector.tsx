'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFlowStore } from '@/store/index';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useTheme } from 'next-themes';
import { JSONPath } from 'jsonpath-plus';

interface ReferenceSelectorProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onInsertReference: (reference: string) => void;
  currentNodeId: string; // ID of the node being configured
}

// Placeholder for a JSON interactive viewer/selector
// In a real app, use libraries like react-json-view or build custom
const JsonViewerSelector = ({ jsonData, onSelectPath }: { jsonData: any, onSelectPath: (path: string) => void }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const jsonString = useMemo(() => JSON.stringify(jsonData, null, 2), [jsonData]);

  // Basic path selection (replace with interactive viewer)
  const handleSelect = () => {
    // Example: always select the root for now
    onSelectPath('$');
  };

  return (
    <div className="relative">
       <ScrollArea className={cn(
         "h-60 w-full border-2 rounded-lg shadow-sm p-0",
         isDark ? "bg-neutral-900 border-blue-500" : "bg-neutral-50 border-neutral-800"
       )}>
          <pre className={cn(
            "text-xs font-mono p-3 whitespace-pre-wrap break-all",
            isDark ? "text-neutral-200" : "text-neutral-800"
          )}>
              <code>{jsonString}</code>
          </pre>
      </ScrollArea>
      {/* Placeholder button - replace with actual click/selection logic */}
      <Button size="sm" onClick={handleSelect} className="absolute bottom-2 right-2 z-10">Select Path (Root)</Button>
    </div>
  );
};

export function ReferenceSelector({
  isOpen,
  onOpenChange,
  onInsertReference,
  currentNodeId,
}: ReferenceSelectorProps) {
  const { nodes, nodeResults } = useFlowStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [previewValue, setPreviewValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter out the current node and nodes without successful results
  const availableNodes = useMemo(() => {
    return nodes.filter(node => 
      node.id !== currentNodeId && 
      nodeResults[node.id]?.status === 'success' &&
      nodeResults[node.id]?.data !== undefined
    );
  }, [nodes, nodeResults, currentNodeId]);

  const selectedNodeResult = useMemo(() => {
    return selectedNodeId ? nodeResults[selectedNodeId]?.data : null;
  }, [selectedNodeId, nodeResults]);

  // Update preview when node or path changes
  useEffect(() => {
    setError(null);
    setPreviewValue(null);
    if (selectedNodeId && selectedPath && selectedNodeResult !== null && selectedNodeResult !== undefined) { // Check for null/undefined
      try {
        const extracted = JSONPath({ path: selectedPath, json: selectedNodeResult });
        if (extracted && extracted.length > 0) {
          const firstResult = extracted[0];
          if (typeof firstResult === 'string') {
              setPreviewValue(firstResult);
          } else if (typeof firstResult === 'number' || typeof firstResult === 'boolean') {
              setPreviewValue(String(firstResult));
          } else if (typeof firstResult === 'object') {
              try {
                 setPreviewValue(JSON.stringify(firstResult, null, 2)); // Show formatted JSON for objects
              } catch { 
                  setPreviewValue('[Object]'); 
              }
          } else {
              setPreviewValue('[Null/Undefined]');
          }
        } else {
           setError('JSONPath returned no results.');
        }
      } catch (e: any) {
        setError(`Invalid JSONPath: ${e.message}`);
      }
    }
  }, [selectedNodeId, selectedPath, selectedNodeResult]);

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedPath(null); // Reset path when node changes
    setPreviewValue(null);
    setError(null);
  };

  const handlePathSelect = (path: string) => {
    setSelectedPath(path);
  };

  const handleInsertClick = () => {
    if (selectedNodeId && selectedPath) {
      const reference = `{{${selectedNodeId}::${selectedPath}}}`;
     
      onInsertReference(reference);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Optionally reset state on close
    setSelectedNodeId(null);
    setSelectedPath(null);
    setPreviewValue(null);
    setError(null);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "sm:max-w-2xl p-0 rounded-2xl shadow-lg",
        isDark 
          ? "bg-neutral-800 border-2 border-blue-500 text-white"
          : "bg-white border-2 border-neutral-800 text-neutral-800"
      )}>
        <DialogHeader className={cn(
          "p-6 pb-4 border-b-2", 
          isDark ? "border-blue-500" : "border-neutral-800"
        )}>
          <DialogTitle className="text-xl font-bold">Insert Dynamic Reference</DialogTitle>
          <DialogDescription className={cn("text-sm pt-1", isDark ? "text-blue-200" : "text-neutral-600")}>
            Select a node and a value from its output to reference dynamically.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
         <>
            {/* Left Side: Node Selection and Path Input */} 
            <div className="space-y-4">
              <div>
                <label className={cn("text-sm font-semibold mb-1.5 block", isDark ? "text-blue-200" : "text-neutral-700")}>
                  1. Select Source Node
                </label>
                <Select value={selectedNodeId || ''} onValueChange={handleNodeSelect}>
                  <SelectTrigger className={cn("w-full h-10 rounded-lg shadow-sm border-2", isDark ? "bg-neutral-700 border-blue-500" : "bg-white border-neutral-800")}>
                    <SelectValue placeholder="Choose a node..." />
                  </SelectTrigger>
                  <SelectContent className={cn("rounded-lg shadow-md", isDark ? "bg-neutral-800 border-blue-500" : "bg-white border-neutral-800")}>
                    {availableNodes.length === 0 ? (
                      <SelectItem value="" disabled>No nodes with successful results</SelectItem>
                    ) : (
                      availableNodes.map((node) => (
                        <SelectItem key={node.id} value={node.id} className={cn("cursor-pointer", isDark ? "focus:bg-blue-700" : "focus:bg-blue-100")}>
             
                          {(typeof node.data?.label === 'string' && node.data.label) || node.type || 'Unnamed Node'} ({node.id.substring(0, 6)}...)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={cn("text-sm font-semibold mb-1.5 block", isDark ? "text-blue-200" : "text-neutral-700")}>
                  2. Select JSONPath
                </label>
                <p className={cn("text-xs mb-2", isDark ? "text-blue-100/70" : "text-neutral-500")}>
                   Click within the JSON viewer (Right) to select a path automatically (placeholder).
                </p>
                 {/* Manual Path Input (Fallback/Advanced) */} 
                 <input
                    type="text"
                    placeholder="e.g., $.data.token or click viewer ->"
                    value={selectedPath || ''}
                    onChange={(e) => handlePathSelect(e.target.value)}
                    disabled={!selectedNodeId}
                    className={cn(
                      "w-full h-10 px-3 text-sm rounded-lg shadow-sm border-2 font-mono",
                      isDark 
                        ? "bg-neutral-700 border-blue-500 text-white focus:border-blue-400 disabled:opacity-50"
                        : "bg-white border-neutral-800 text-neutral-800 focus:border-blue-500 disabled:opacity-50",
                      error ? (isDark ? "border-red-500" : "border-red-600") : (isDark ? "border-blue-500" : "border-neutral-800")
                    )}
                  />
              </div>

              {error && (
                <Alert variant="destructive" className={cn("p-2 text-xs rounded-lg flex items-center gap-1.5", isDark ? "bg-red-900/50 border-red-700 text-red-200" : "bg-red-100 border-red-700 text-red-800")}>
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <label className={cn("text-sm font-semibold mb-1.5 block", isDark ? "text-blue-200" : "text-neutral-700")}>
                  Preview Value
                </label>
                <div className={cn("w-full min-h-[60px] p-2 text-xs rounded-lg shadow-inner border-2 overflow-auto", isDark ? "bg-neutral-700 border-blue-500/50 text-blue-100/80" : "bg-neutral-100 border-neutral-300 text-neutral-700")}>
                  {String(previewValue ?? '') || <span className={cn("italic", isDark ? "text-blue-100/50" : "text-neutral-400")}>Select node and path...</span>}
                </div>
              </div>
            </div>

            {/* Right Side: JSON Viewer */} 
            <div className="space-y-2">
               <label className={cn("text-sm font-semibold block", isDark ? "text-blue-200" : "text-neutral-700")}>
                 Node Output Viewer
                </label>
              {selectedNodeResult !== null && selectedNodeResult !== undefined ? (
                <JsonViewerSelector jsonData={selectedNodeResult} onSelectPath={handlePathSelect} />
              ) : (
                <div className={cn("h-60 flex items-center justify-center border-2 border-dashed rounded-lg", isDark ? "border-blue-500/30 text-blue-200/60" : "border-neutral-300 text-neutral-500")}>
                  <p className="text-sm italic">{selectedNodeId ? 'Node has no data' : 'Select a node to view its output'}</p>
                </div>
              )}
            </div>
          </>
        </div>

        <DialogFooter className={cn("p-6 pt-4 border-t-2 flex justify-end gap-3", isDark ? "border-blue-500" : "border-neutral-800")}>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose} 
            className={cn(isDark ? "bg-neutral-700 text-blue-200 border-blue-500 hover:bg-neutral-600" : "")}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleInsertClick} 
            disabled={!selectedNodeId || !selectedPath || !!error}
            className={cn(isDark ? "bg-blue-600 text-white hover:bg-blue-500" : "")}
          >
            Insert Reference
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 